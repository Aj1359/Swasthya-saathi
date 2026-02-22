import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

      {isOpen && createPortal(
        /* Full-screen backdrop — renders on document.body, immune to parent CSS */
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* ── Camera block ───────────────────────────────────────── */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              /* On phones: make it almost full-height so camera fills screen */
              aspectRatio: '3/4',
            }}
          >
            {/* Live video — fills the whole block */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: 'block',
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Floating close button — top-right corner of the camera ── */}
            <button
              onClick={close}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <X style={{ width: 18, height: 18, color: '#fff' }} />
            </button>

            {/* ── Label — top-left corner ── */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0,0,0,0.55)',
                borderRadius: '999px',
                padding: '5px 12px',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Camera style={{ width: 14, height: 14, color: 'var(--primary, #6366f1)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '.02em' }}>
                Face Mood Reader
              </span>
            </div>

            {/* ── Corner guide brackets ── */}
            {!isAnalyzing && !result && (
              <>
                {[
                  { top: '50%', left: '50%', transform: 'translate(-90px, -110px)', borderTop: '2.5px solid', borderLeft: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(62px, -110px)',  borderTop: '2.5px solid', borderRight: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(-90px, 82px)',   borderBottom: '2.5px solid', borderLeft: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(62px, 82px)',    borderBottom: '2.5px solid', borderRight: '2.5px solid' },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 28,
                      height: 28,
                      borderColor: 'rgba(255,255,255,0.7)',
                      borderRadius: 3,
                      ...s,
                    }}
                  />
                ))}
              </>
            )}

            {/* ── Analysing overlay ── */}
            {isAnalyzing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Loader2
                  style={{
                    width: 36,
                    height: 36,
                    color: 'var(--primary, #6366f1)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>
                  {mlStage}
                </p>
              </div>
            )}
          </div>

          {/* ── Result card — appears below camera ───────────────────── */}
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {error && (
              <p
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#f87171',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            {result && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 38 }}>{moodEmojis[result.mood] || '🤔'}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 17, color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                      {result.mood}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>
                      {result.confidence}% confidence
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.55 }}>
                  {result.description}
                </p>
                <div
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>💡</span>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                    {result.wellness_tip}
                  </p>
                </div>
              </div>
            )}

            {/* ── Capture / Scan Again button ── */}
            <Button
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              style={{ width: '100%', height: 48, borderRadius: 14, fontSize: 15, fontWeight: 700 }}
              className="bg-primary hover:bg-primary/90"
            >
              {result ? <RefreshCw className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
              {result ? 'Scan Again' : 'Capture & Analyze'}
            </Button>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default FaceMoodReader;