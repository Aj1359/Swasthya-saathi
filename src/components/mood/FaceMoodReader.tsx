import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, Loader2, RefreshCw, PersonStanding, TrendingUp, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MoodResult {
  mood: string;
  confidence: number;
  description: string;
  wellness_tip: string;
  health_flags: string[];
  posture_score: number | null;
  posture_flags: string[];
  posture_tip: string | null;
}

interface FaceMoodReaderProps {
  onMoodDetected?: (result: MoodResult) => void;
  onSendToRuhi?: (result: MoodResult) => void;
}

const moodEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😤', anxious: '😰', neutral: '😐',
  tired: '😴', stressed: '😣', content: '🙂', fearful: '😨',
  disgusted: '😣', surprised: '😮', grief: '💔',
};

// ─── ML Helpers ───────────────────────────────────────────────────────────────
function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
}

function sharpnessScore(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width, h = canvas.height;
  const sx = Math.floor(w * 0.25), sy = Math.floor(h * 0.25);
  const sw = Math.floor(w * 0.5), sh = Math.floor(h * 0.5);
  const { data } = ctx.getImageData(sx, sy, sw, sh);
  const grey: number[] = [];
  for (let i = 0; i < data.length; i += 4)
    grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  const mean = grey.reduce((a, b) => a + b, 0) / grey.length;
  return grey.reduce((a, b) => a + (b - mean) ** 2, 0) / grey.length;
}

async function preprocessBase64(raw: string, canvas: HTMLCanvasElement): Promise<string> {
  const SIZE = 224;
  const img = new Image();
  await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = `data:image/jpeg;base64,${raw}`; });
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = imageData.data;
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * Math.pow(i / 255, 1 / 1.1));
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

async function getBestFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, numFrames = 5): Promise<string> {
  let best = { raw: '', score: -Infinity };
  for (let i = 0; i < numFrames; i++) {
    const raw = captureFrame(video, canvas);
    const score = sharpnessScore(canvas);
    if (score > best.score) best = { raw, score };
    if (i < numFrames - 1) await new Promise(r => setTimeout(r, 150));
  }
  return preprocessBase64(best.raw, canvas);
}

function averageResults(results: MoodResult[]): MoodResult {
  if (results.length === 1) return results[0];
  const votes: Record<string, { totalConf: number; count: number; last: MoodResult }> = {};
  for (const r of results) {
    if (!votes[r.mood]) votes[r.mood] = { totalConf: 0, count: 0, last: r };
    votes[r.mood].totalConf += r.confidence;
    votes[r.mood].count += 1;
    votes[r.mood].last = r;
  }
  const winner = Object.values(votes).sort((a, b) => b.totalConf / b.count - a.totalConf / a.count)[0];
  const avgPosture = results.reduce((sum, r) => sum + (r.posture_score || 0), 0) / results.length;
  const allPostureFlags = [...new Set(results.flatMap(r => r.posture_flags || []))];
  const allHealthFlags = [...new Set(results.flatMap(r => r.health_flags || []))];
  return {
    ...winner.last,
    confidence: Math.round(winner.totalConf / winner.count),
    posture_score: winner.last.posture_score !== null ? Math.round(avgPosture) : null,
    posture_flags: allPostureFlags,
    health_flags: allHealthFlags,
  };
}

// Posture score badge
const PostureScore = ({ score }: { score: number }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';
  const radius = 20, circ = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
          <circle cx="25" cy="25" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle cx="25" cy="25" r={radius} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={circ - (score / 100) * circ}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color, fontSize: 11, fontWeight: 700 }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label} Posture</span>
    </div>
  );
};

// Mood history trend (last 7 from localStorage)
const MoodTrend = () => {
  const raw = localStorage.getItem('swasthyasaathi_face_history');
  const history: { mood: string; timestamp: string }[] = raw ? JSON.parse(raw).slice(-7) : [];
  if (history.length < 2) return null;

  const moodScore: Record<string, number> = {
    happy: 5, content: 4, neutral: 3, tired: 2, sad: 1, stressed: 1, anxious: 1, angry: 1, grief: 1, fearful: 1, numb: 2, overwhelmed: 1,
  };
  const scores = history.map(h => moodScore[h.mood] || 3);
  const max = 5, min = 1, h = 36, w = 200;

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>7-day mood trend</p>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 40 }}>
        <polyline points={points} fill="none" stroke="rgba(99,102,241,0.9)" strokeWidth="2" strokeLinejoin="round" />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * w;
          const y = h - ((s - min) / (max - min)) * h;
          return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {history.map((h, i) => (
          <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
            {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric' }).replace('/', '/')}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const FaceMoodReader = ({ onMoodDetected, onSendToRuhi }: FaceMoodReaderProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MoodResult | null>(null);
  const [error, setError] = useState('');
  const [mlStage, setMlStage] = useState('Analyzing your expression...');
  const [postureMode, setPostureMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError(''); setResult(null);
    } catch {
      setError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true); setError('');

    try {
      setMlStage('Sampling best frame...');
      const base64 = await getBestFrame(videoRef.current, canvasRef.current, 5);

      const PASSES = 3;
      const inferences: MoodResult[] = [];

      for (let pass = 0; pass < PASSES; pass++) {
        setMlStage(`Running inference (${pass + 1}/${PASSES})...`);
        const { data, error: fnError } = await supabase.functions.invoke('face-mood', {
          body: { imageBase64: base64, augmentPass: pass, postureMode },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        inferences.push(data as MoodResult);
      }

      setMlStage('Averaging predictions...');
      const finalResult = averageResults(inferences);
      setResult(finalResult);
      onMoodDetected?.(finalResult);

      // Save to DB
      if (user) {
        await supabase.from('face_scans').insert({
          user_id: user.id,
          mood: finalResult.mood,
          confidence: finalResult.confidence,
          description: finalResult.description,
          wellness_tip: finalResult.wellness_tip,
          health_flags: finalResult.health_flags || [],
          posture_score: finalResult.posture_score,
          posture_flags: finalResult.posture_flags || [],
        });
      }

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || 'Analysis failed. Try again.');
    } finally {
      setIsAnalyzing(false);
      setMlStage('Analyzing your expression...');
    }
  }, [onMoodDetected, postureMode, user]);

  const open = () => { setIsOpen(true); setTimeout(startCamera, 100); };
  const close = () => { stopCamera(); setIsOpen(false); setResult(null); setError(''); };

  return (
    <>
      <Button onClick={open} variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/10">
        <Camera className="w-4 h-4 text-primary" />
        <span className="text-sm">Face Mood Scan</span>
      </Button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* Camera block */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', background: '#000', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', aspectRatio: postureMode ? '3/5' : '3/4' }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
            <canvas ref={canvasRef} className="hidden" />

            {/* Close */}
            <button onClick={close} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
              <X style={{ width: 18, height: 18, color: '#fff' }} />
            </button>

            {/* Label */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 999, padding: '5px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Camera style={{ width: 14, height: 14, color: 'var(--primary, #6366f1)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Face Mood Reader</span>
            </div>

            {/* Posture Mode toggle */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setPostureMode(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
                  background: postureMode ? 'rgba(16,185,129,0.8)' : 'rgba(0,0,0,0.6)',
                  border: `1.5px solid ${postureMode ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.2)'}`,
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)',
                }}>
                <PersonStanding style={{ width: 14, height: 14 }} />
                {postureMode ? 'Posture Mode ON' : 'Enable Posture Mode'}
              </button>
            </div>

            {/* Posture hint */}
            {postureMode && !isAnalyzing && !result && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: '8px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                <p style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>📸 Step back to show shoulders</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Sit upright, facing the camera</p>
              </div>
            )}

            {/* Face guide brackets (face only mode) */}
            {!postureMode && !isAnalyzing && !result && (
              <>
                {[
                  { top: '50%', left: '50%', transform: 'translate(-90px, -110px)', borderTop: '2.5px solid', borderLeft: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(62px, -110px)', borderTop: '2.5px solid', borderRight: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(-90px, 82px)', borderBottom: '2.5px solid', borderLeft: '2.5px solid' },
                  { top: '50%', left: '50%', transform: 'translate(62px, 82px)', borderBottom: '2.5px solid', borderRight: '2.5px solid' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 3, ...s }} />
                ))}
              </>
            )}

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Loader2 style={{ width: 36, height: 36, color: 'var(--primary, #6366f1)', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>{mlStage}</p>
              </div>
            )}
          </div>

          {/* Result card */}
          <div style={{ width: '100%', maxWidth: 420, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>
              </div>
            )}

            {result && (
              <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 16px', backdropFilter: 'blur(10px)' }}>

                {/* Mood + posture row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 36 }}>{moodEmojis[result.mood] || '🤔'}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 17, color: '#fff', margin: 0, textTransform: 'capitalize' }}>{result.mood}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{result.confidence}% confidence</p>
                    </div>
                  </div>
                  {result.posture_score !== null && <PostureScore score={result.posture_score} />}
                </div>

                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.55, marginBottom: 10 }}>{result.description}</p>

                {/* Health flags */}
                {result.health_flags.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>Health signals detected:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {result.health_flags.map((f, i) => (
                        <span key={i} style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, padding: '2px 8px' }}>
                          {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posture flags */}
                {result.posture_flags.length > 0 && !result.posture_flags.includes('good_alignment') && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>Posture observations:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {result.posture_flags.filter(f => f !== 'good_alignment').map((f, i) => (
                        <span key={i} style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 999, padding: '2px 8px' }}>
                          {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    {result.posture_tip && (
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.4 }}>
                        💡 {result.posture_tip}
                      </p>
                    )}
                  </div>
                )}

                {/* Wellness tip */}
                <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>{result.wellness_tip}</p>
                </div>

                {/* Mood trend */}
                <MoodTrend />

                {/* Send to Ruhi */}
                {onSendToRuhi && (
                  <button onClick={() => { onSendToRuhi(result); close(); }}
                    style={{ marginTop: 10, width: '100%', height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Send style={{ width: 14, height: 14 }} />
                    Share with Ruhi
                  </button>
                )}
              </div>
            )}

            <Button onClick={captureAndAnalyze} disabled={isAnalyzing}
              style={{ width: '100%', height: 48, borderRadius: 14, fontSize: 15, fontWeight: 700 }}
              className="bg-primary hover:bg-primary/90">
              {result ? <><RefreshCw className="w-4 h-4 mr-2" />Scan Again</> : <><Camera className="w-4 h-4 mr-2" />Capture & Analyze</>}
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FaceMoodReader;