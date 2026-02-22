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

const FaceMoodReader = ({ onMoodDetected }: FaceMoodReaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MoodResult | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = dataUrl.split(',')[1];

    setIsAnalyzing(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('face-mood', {
        body: { imageBase64: base64 },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      onMoodDetected?.(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Try again.');
    } finally {
      setIsAnalyzing(false);
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
                      <p className="text-sm text-foreground">Analyzing your expression...</p>
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
