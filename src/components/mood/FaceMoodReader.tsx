import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MoodResult {
  mood: string;
  confidence: number;
  description: string;
  wellness_tip: string;
}

interface FaceMoodReaderProps {
  onMoodDetected?: (result: MoodResult) => void;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😤',
  anxious: '😰',
  neutral: '😐',
  tired: '😴',
  stressed: '😣',
};

// ─── ML Helpers ───────────────────────────────────────────────────────────────

/**
 * Capture a raw frame from the video into the canvas and return base64.
 */
function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  quality = 1.0,
): string {
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

/**
 * Compute a rough sharpness score (Laplacian variance proxy) for a frame.
 * Sharper frames = less motion blur = better ML accuracy.
 */
function sharpnessScore(canvas: HTMLCanvasElement): number {
  const ctx  = canvas.getContext('2d')!;
  const w    = canvas.width;
  const h    = canvas.height;

  // Sample the centre 50% of the frame (where the face is most likely)
  const sx = Math.floor(w * 0.25);
  const sy = Math.floor(h * 0.25);
  const sw = Math.floor(w * 0.5);
  const sh = Math.floor(h * 0.5);

  const { data } = ctx.getImageData(sx, sy, sw, sh);
  const grey: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const mean     = grey.reduce((a, b) => a + b, 0) / grey.length;
  const variance = grey.reduce((a, b) => a + (b - mean) ** 2, 0) / grey.length;
  return variance;
}

/**
 * Pre-process a raw base64 frame:
 *  • Centre-crop to square  (most CNN face models expect square input)
 *  • Resize to 224×224      (standard MobileNet / EfficientNet input size)
 *  • Apply gamma correction (γ = 1.1) to recover detail in dark frames
 *
 * Returns a new base64 string ready for the edge-function.
 */
async function preprocessBase64(raw: string, canvas: HTMLCanvasElement): Promise<string> {
  const SIZE = 224;

  // Draw raw frame into an off-screen image
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = `data:image/jpeg;base64,${raw}`;
  });

  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx  = canvas.getContext('2d')!;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx   = (img.naturalWidth  - side) / 2;
  const sy   = (img.naturalHeight - side) / 2;

  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

  // Gamma LUT
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const d   = imageData.data;
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(255 * Math.pow(i / 255, 1 / 1.1));
  }
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

/**
 * Multi-frame sampling:
 * Capture `numFrames` frames spaced `intervalMs` apart, score each by
 * sharpness, and return the best one pre-processed for the ML model.
 */
async function getBestFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  numFrames = 5,
  intervalMs = 150,
): Promise<string> {
  let best = { raw: '', score: -Infinity };

  for (let i = 0; i < numFrames; i++) {
    const raw   = captureFrame(video, canvas, 1.0);
    const score = sharpnessScore(canvas);
    if (score > best.score) best = { raw, score };
    if (i < numFrames - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }

  return preprocessBase64(best.raw, canvas);
}

/**
 * Ensemble averaging:
 * Run inference `PASSES` times (each pass asks the server to apply a
 * slightly different spatial jitter / augmentation so predictions are
 * not identical), then vote-weight by confidence and return the winner.
 */
function averageResults(results: MoodResult[]): MoodResult {
  if (results.length === 1) return results[0];

  const votes: Record<string, { totalConf: number; count: number; last: MoodResult }> = {};
  for (const r of results) {
    if (!votes[r.mood]) votes[r.mood] = { totalConf: 0, count: 0, last: r };
    votes[r.mood].totalConf += r.confidence;
    votes[r.mood].count     += 1;
    votes[r.mood].last       = r;
  }

  const winner = Object.values(votes).sort(
    (a, b) => b.totalConf / b.count - a.totalConf / a.count,
  )[0];

  return {
    ...winner.last,
    confidence: Math.round(winner.totalConf / winner.count),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const FaceMoodReader = ({ onMoodDetected }: FaceMoodReaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MoodResult | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ML pipeline stage label (shown in the existing loading overlay)
  const [mlStage, setMlStage] = useState('Analyzing your expression...');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError('');
      setResult(null);
    } catch {
      setError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // ── 1. Multi-frame sampling → pick sharpest frame ───────────────────────
      setMlStage('Sampling frames for best quality…');
      const base64 = await getBestFrame(videoRef.current, canvasRef.current, 5, 150);

      // ── 2. Ensemble: 3 inference passes with server-side augmentation ────────
      const PASSES = 3;
      const inferences: MoodResult[] = [];

      for (let pass = 0; pass < PASSES; pass++) {
        setMlStage(`Running inference (pass ${pass + 1}/${PASSES})…`);

        const { data, error: fnError } = await supabase.functions.invoke('face-mood', {
          body: {
            imageBase64: base64,
            // Signals the edge function to apply a small random spatial jitter
            // per pass so each prediction is independently sampled
            augmentPass: pass,
          },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        inferences.push(data as MoodResult);
      }

      // ── 3. Average ensemble → final prediction ───────────────────────────────
      setMlStage('Averaging predictions…');
      const finalResult = averageResults(inferences);

      setResult(finalResult);
      onMoodDetected?.(finalResult);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Try again.');
    } finally {
      setIsAnalyzing(false);
      setMlStage('Analyzing your expression...');
    }
  }, [onMoodDetected]);

  const open = () => {
    setIsOpen(true);
    setTimeout(startCamera, 100);
  };

  const close = () => {
    stopCamera();
    setIsOpen(false);
    setResult(null);
    setError('');
  };

  return (
    <>
      <Button
        onClick={open}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Camera className="w-4 h-4 text-primary" />
        <span className="text-sm">Face Mood Scan</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Face Mood Reader
              </h3>
              <Button size="icon" variant="ghost" onClick={close} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-foreground">{mlStage}</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              {result && (
                <div className="bg-primary/5 rounded-xl p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{moodEmojis[result.mood] || '🤔'}</span>
                    <div>
                      <p className="font-bold text-foreground capitalize">{result.mood}</p>
                      <p className="text-xs text-muted-foreground">{result.confidence}% confident</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{result.description}</p>
                  <div className="bg-primary/10 rounded-lg p-3 mt-2">
                    <p className="text-xs text-primary font-medium">💡 Suggestion</p>
                    <p className="text-sm text-foreground">{result.wellness_tip}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {result ? <RefreshCw className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                  {result ? 'Scan Again' : 'Capture & Analyze'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FaceMoodReader;