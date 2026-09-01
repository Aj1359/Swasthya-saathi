import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PersonStanding, X, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PostureResult {
  score: number;
  flags: string[];
  tips: string[];
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
}

interface PostureDetectorProps {
  onPostureDetected?: (result: PostureResult) => void;
}

// MediaPipe CDN URLs
const MEDIAPIPE_POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
const CAMERA_UTILS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
const DRAWING_UTILS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';

// Posture flag descriptors
const FLAG_LABELS: Record<string, string> = {
  forward_head: 'Forward Head',
  rounded_shoulders: 'Rounded Shoulders',
  head_tilt: 'Head Tilt',
  asymmetric_shoulders: 'Uneven Shoulders',
  upper_back_rounding: 'Upper Back Rounding',
  good_alignment: '✅ Good Alignment',
};

const YOGA_TIPS: Record<string, string> = {
  forward_head: 'Chin Tucks: Pull chin straight back, hold 5s, repeat 10×',
  rounded_shoulders: 'Wall Angels: Stand against wall, slide arms up and down like a snow angel',
  upper_back_rounding: 'Bhujangasana (Cobra Pose): Lie face-down, press chest up gently',
  head_tilt: 'Lateral neck stretch: Tilt ear to shoulder gently, hold 20s each side',
  asymmetric_shoulders: 'Shoulder rolls: 10 backward circles each side',
};

const scoreLabel = (s: number): PostureResult['label'] => {
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Fair';
  if (s >= 30) return 'Poor';
  return 'Critical';
};

const scoreColor = (s: number) => {
  if (s >= 70) return '#10b981';
  if (s >= 50) return '#f59e0b';
  if (s >= 30) return '#f97316';
  return '#ef4444';
};

// ─── Landmark analysis ────────────────────────────────────────────────────────
// We use MediaPipe WORLD_LANDMARKS (3D) for angle calculations.
// Key landmarks: 0=nose, 7=L_ear, 8=R_ear, 11=L_shoulder, 12=R_shoulder, 23=L_hip, 24=R_hip

interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface MediaPipeResults {
  image: {
    width: number;
    height: number;
  };
  poseLandmarks?: MediaPipeLandmark[];
}

function analyzePosture(landmarks: MediaPipeLandmark[]): PostureResult {
  if (!landmarks || landmarks.length < 25) {
    return { score: 0, flags: [], tips: ['Could not detect body landmarks'], label: 'Critical' };
  }

  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const flags: string[] = [];
  let penalty = 0;

  // 1. Forward head: nose should be roughly above mid-shoulder X
  const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const forwardHeadOffset = (nose.x - midShoulderX); // in normalised coords
  if (Math.abs(forwardHeadOffset) > 0.04) { flags.push('forward_head'); penalty += 20; }

  // 2. Shoulder asymmetry: Y difference between left and right shoulder
  const shoulderYDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderYDiff > 0.04) { flags.push('asymmetric_shoulders'); penalty += 15; }

  // 3. Rounded shoulders: shoulder Z vs ear Z (Z positive = towards camera)
  // If shoulder.z << ear.z (shoulders much further from camera than ears) → rounded
  const shoulderForward = ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2;
  const earForward = ((leftEar.z || 0) + (rightEar.z || 0)) / 2;
  if (shoulderForward - earForward > 0.05) { flags.push('rounded_shoulders'); penalty += 20; }

  // 4. Head tilt: nose Y vs avg ear Y
  const avgEarY = (leftEar.y + rightEar.y) / 2;
  const noseEarYDiff = Math.abs(nose.y - avgEarY);
  if (noseEarYDiff > 0.06) { flags.push('head_tilt'); penalty += 10; }

  // 5. Upper back rounding: shoulder Y vs hip Y ratio
  const midHipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = midHipY - midShoulderY;
  const shoulderHipRatio = torsoHeight > 0 ? (midShoulderY - nose.y) / torsoHeight : 0;
  if (shoulderHipRatio < 0.3) { flags.push('upper_back_rounding'); penalty += 15; }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  if (flags.length === 0) flags.push('good_alignment');

  const tips = flags
    .filter(f => f !== 'good_alignment')
    .map(f => YOGA_TIPS[f] || '')
    .filter(Boolean);

  if (score >= 85) tips.push('Great posture! Keep sitting upright 💪');

  return { score, flags, tips, label: scoreLabel(score) };
}

// ─────────────────────────────────────────────────────────────────────────────

const PostureDetector = ({ onPostureDetected }: PostureDetectorProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [postureResult, setPostureResult] = useState<PostureResult | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<{ close: () => void } | null>(null);
  const cameraRef = useRef<{ start: () => Promise<void>; stop: () => Promise<void> } | null>(null);
  const lastResultsRef = useRef<PostureResult[]>([]);

  const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script'); s.src = src; s.crossOrigin = 'anonymous';
      s.onload = () => resolve(); s.onerror = reject;
      document.head.appendChild(s);
    });

  const loadMediaPipe = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      await loadScript(CAMERA_UTILS_CDN);
      await loadScript(DRAWING_UTILS_CDN);
      await loadScript(MEDIAPIPE_POSE_CDN);
      setScriptsLoaded(true);
    } catch {
      setError('Failed to load MediaPipe. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setError('');
    setIsRunning(true);
    lastResultsRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      const win = window as unknown as {
        Pose?: new (config: { locateFile: (file: string) => string }) => {
          setOptions: (opts: unknown) => void;
          onResults: (callback: (results: MediaPipeResults) => void) => void;
          send: (image: { image: HTMLVideoElement }) => Promise<void>;
          close: () => void;
        };
        drawConnectors?: (ctx: CanvasRenderingContext2D, landmarks: MediaPipeLandmark[], connections: unknown, style: unknown) => void;
        drawLandmarks?: (ctx: CanvasRenderingContext2D, landmarks: MediaPipeLandmark[], style: unknown) => void;
        POSE_CONNECTIONS?: unknown;
        Camera?: new (
          video: HTMLVideoElement,
          options: { onFrame: () => Promise<void>; width: number; height: number }
        ) => { start: () => Promise<void>; stop: () => Promise<void> };
      };
      if (!win.Pose || !win.Camera) throw new Error('MediaPipe Pose not loaded');

      const pose = new win.Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      poseRef.current = pose;

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: MediaPipeResults) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        canvas.width = results.image.width;
        canvas.height = results.image.height;
        ctx.save();
        ctx.scale(-1, 1); // mirror
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(results.image as unknown as CanvasImageSource, 0, 0);
        ctx.restore();

        if (results.poseLandmarks) {
          // Draw skeleton
          const drawConn = win.drawConnectors;
          const drawLmk = win.drawLandmarks;
          const poseConn = win.POSE_CONNECTIONS;

          if (drawConn && poseConn) {
            // Mirror: flip X for each landmark before drawing
            const mirrored = results.poseLandmarks.map((l) => ({ ...l, x: 1 - l.x }));
            ctx.save();
            drawConn(ctx, mirrored, poseConn, { color: 'rgba(99,102,241,0.7)', lineWidth: 2 });
            if (drawLmk) drawLmk(ctx, mirrored, { color: '#a5b4fc', lineWidth: 1, radius: 3 });
            ctx.restore();
          }

          // Analyse
          const analyzed = analyzePosture(results.poseLandmarks);
          setLiveScore(analyzed.score);
          lastResultsRef.current.push(analyzed);
          if (lastResultsRef.current.length > 15) lastResultsRef.current.shift();
        }
      });

      const camera = new win.Camera(videoRef.current, {
        onFrame: async () => { await pose.send({ image: videoRef.current! }); },
        width: 640, height: 480,
      });
      cameraRef.current = camera;
      camera.start();

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || 'Failed to start posture detection.');
      setIsRunning(false);
    }
  }, []);

  const stopAndSave = useCallback(() => {
    cameraRef.current?.stop();
    poseRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRunning(false);

    if (lastResultsRef.current.length > 0) {
      // Average the last N results
      const samples = lastResultsRef.current;
      const avgScore = Math.round(samples.reduce((s, r) => s + r.score, 0) / samples.length);
      const allFlags = [...new Set(samples.flatMap(r => r.flags))];
      const dominantFlags = allFlags.filter(f => {
        const count = samples.filter(r => r.flags.includes(f)).length;
        return count >= samples.length * 0.4; // present in at least 40% of frames
      });
      const tips = dominantFlags.filter(f => f !== 'good_alignment').map(f => YOGA_TIPS[f]).filter(Boolean);
      if (avgScore >= 85) tips.push('Excellent posture! Keep it up 💪');
      const finalResult: PostureResult = { score: avgScore, flags: dominantFlags, tips, label: scoreLabel(avgScore) };
      setPostureResult(finalResult);
      onPostureDetected?.(finalResult);

      // Save to supabase
      if (user) {
        supabase.from('face_scans').insert({
          user_id: user.id,
          mood: 'neutral',
          confidence: 100,
          description: `Posture check: ${finalResult.label} (${avgScore}/100)`,
          wellness_tip: tips[0] || 'Great posture!',
          health_flags: [],
          posture_score: avgScore,
          posture_flags: dominantFlags,
          posture_mode: true,
        }).then(() => {});
      }
    }
  }, [onPostureDetected, user]);

  const open = async () => {
    setIsOpen(true);
    setPostureResult(null);
    setLiveScore(null);
    setError('');
    if (!scriptsLoaded) await loadMediaPipe();
  };

  const close = () => {
    if (isRunning) stopAndSave();
    cameraRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsOpen(false);
    setPostureResult(null);
    setLiveScore(null);
    setIsRunning(false);
  };

  const radius = 44, circ = 2 * Math.PI * radius;
  const displayScore = postureResult?.score ?? liveScore ?? 0;
  const displayColor = scoreColor(displayScore);

  return (
    <>
      <Button onClick={open} variant="outline" size="sm"
        className="gap-2 border-violet-500/30 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400">
        <PersonStanding className="w-4 h-4" />
        <span className="text-sm">Posture Check</span>
      </Button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ background: '#0d1117', maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <PersonStanding className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Posture Detector</p>
                  <p className="text-xs text-gray-500">Real-time MediaPipe analysis</p>
                </div>
              </div>
              <button onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Camera canvas */}
            <div className="relative bg-black" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
              <video ref={videoRef} autoPlay playsInline muted className="hidden" />
              <canvas ref={canvasRef} className="w-full h-full object-cover" />

              {/* Live score badge */}
              {liveScore !== null && isRunning && (
                <div className="absolute top-3 right-3 flex flex-col items-center" style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(8px)', border: `1px solid ${displayColor}40` }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: displayColor }}>{liveScore}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>LIVE SCORE</span>
                </div>
              )}

              {/* Idle state */}
              {!isRunning && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <PersonStanding className="w-16 h-16 text-violet-400 opacity-30" />
                  <p className="text-gray-500 text-sm">Camera preview will appear here</p>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Loading MediaPipe...</p>
                  <p className="text-gray-600 text-xs">~3MB, one-time download</p>
                </div>
              )}
            </div>

            {/* Score ring + results */}
            <div className="p-4 overflow-y-auto">
              {error && (
                <div className="flex gap-2 items-start bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {postureResult ? (
                <div className="space-y-4">
                  {/* Score ring */}
                  <div className="flex items-center justify-center gap-6">
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke={displayColor} strokeWidth="10"
                          strokeLinecap="round" strokeDasharray={circ}
                          strokeDashoffset={circ - (postureResult.score / 100) * circ}
                          style={{ transition: 'stroke-dashoffset 1s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span style={{ fontSize: 22, fontWeight: 800, color: displayColor }}>{postureResult.score}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>/ 100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl">{postureResult.label}</p>
                      <p className="text-gray-400 text-sm mt-1">Posture score</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {postureResult.flags.filter(f => f !== 'good_alignment').slice(0, 3).map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#fde68a' }}>
                            {FLAG_LABELS[f] || f.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {postureResult.flags.includes('good_alignment') && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                            Good Alignment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  {postureResult.tips.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Correction Exercises</p>
                      {postureResult.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                          <span className="text-violet-400 text-sm">→</span>
                          <p className="text-gray-300 text-xs leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button onClick={() => { setPostureResult(null); setLiveScore(null); startDetection(); }}
                    className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm">
                    <RefreshCw className="w-4 h-4 mr-2" />Check Again
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  {isRunning ? (
                    <>
                      <p className="text-gray-400 text-sm">
                        Hold still & sit naturally. Analysing <span className="text-violet-400 font-semibold">~10 seconds</span>...
                      </p>
                      <Button onClick={stopAndSave}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                        Done — Show Results
                      </Button>
                    </>
                  ) : (
                    <>
                      {scriptsLoaded && (
                        <p className="text-gray-500 text-xs">Sit upright facing the camera so your shoulders are visible</p>
                      )}
                      <Button onClick={startDetection} disabled={isLoading || !scriptsLoaded}
                        className="w-full h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl">
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><PersonStanding className="w-4 h-4 mr-2" />Start Posture Check</>}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PostureDetector;
