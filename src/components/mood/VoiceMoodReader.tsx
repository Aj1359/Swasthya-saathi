import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, Loader2, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: (e: unknown) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export interface VoiceMoodResult {
  mood: string;
  confidence: number;
  description: string;
  wellness_tip: string;
  mental_state_indicators: string[];
  suggested_action: string;
  urgency: 'low' | 'moderate' | 'high' | 'crisis';
  transcript_themes: string[];
  phq2_flag: boolean;
  transcript?: string;
}

interface VoiceMoodReaderProps {
  onMoodDetected?: (result: VoiceMoodResult) => void;
}

const moodEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', tired: '😴', anxious: '😰',
  neutral: '😐', angry: '😤', stressed: '😣', grief: '💔',
  numb: '😶', hopeful: '🌱', overwhelmed: '😵',
};

const urgencyColors: Record<string, string> = {
  low: 'border-emerald-500/30 bg-emerald-500/10',
  moderate: 'border-amber-500/30 bg-amber-500/10',
  high: 'border-orange-500/30 bg-orange-500/10',
  crisis: 'border-red-500/40 bg-red-500/15',
};

const RECORDING_OPTIONS = [10, 15, 20]; // seconds

const VoiceMoodReader = ({ onMoodDetected }: VoiceMoodReaderProps) => {
  const { user } = useAuth();
  const { userData } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceMoodResult | null>(null);
  const [error, setError] = useState('');
  const [recordDuration, setRecordDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(28).fill(4));

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const volumeDataRef = useRef<number[]>([]);
  const pitchDataRef = useRef<number[]>([]);
  const pauseCountRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  const open = () => { setIsOpen(true); setResult(null); setError(''); setTranscript(''); };
  const close = () => { stopRecording(); setIsOpen(false); setResult(null); setError(''); setTranscript(''); };

  // Waveform animation loop
  const animateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const bars = Array.from({ length: 28 }, (_, i) => {
      const idx = Math.floor((i / 28) * data.length * 0.6);
      return Math.max(4, (data[idx] / 255) * 48);
    });
    setWaveformBars(bars);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError('');
      setTranscript('');
      volumeDataRef.current = [];
      pitchDataRef.current = [];
      pauseCountRef.current = 0;
      wordsRef.current = [];
      setTimeLeft(recordDuration);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Data collection loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSilent = false;
      const collectData = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0, highSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (i > 100) highSum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const pitch = highSum / dataArray.length;
        if (avg > 6) {
          volumeDataRef.current.push(avg);
          pitchDataRef.current.push(pitch);
          if (lastSilent) pauseCountRef.current++;
          lastSilent = false;
        } else {
          lastSilent = true;
        }
      };
      const dataLoop = setInterval(collectData, 100);

      // Animate waveform
      animateWaveform();

      // Speech recognition for transcript
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = 'en-IN';
        rec.interimResults = true;
        rec.continuous = true;
        rec.onresult = (e: SpeechRecognitionEvent) => {
          const words: string[] = [];
          for (let i = 0; i < e.results.length; i++) {
            words.push(e.results[i][0].transcript);
          }
          setTranscript(words.join(' '));
          wordsRef.current = words.join(' ').split(/\s+/);
        };
        rec.onerror = () => { /* ignore error */ };
        rec.start();
        recognitionRef.current = rec;
      }

      // Countdown timer
      let count = recordDuration;
      timerRef.current = window.setInterval(() => {
        count--;
        setTimeLeft(count);
        if (count <= 0) {
          clearInterval(timerRef.current!);
          clearInterval(dataLoop);
          stopRecordingAndAnalyze();
        }
      }, 1000);

    } catch {
      setError('Could not access microphone. Please allow microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ignore error */ } }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    analyserRef.current = null;
    setIsRecording(false);
    setWaveformBars(Array(28).fill(4));
  };

  const stopRecordingAndAnalyze = () => {
    const vol = [...volumeDataRef.current];
    const pitch = [...pitchDataRef.current];
    const pauses = pauseCountRef.current;
    const words = [...wordsRef.current];
    const tx = transcript || wordsRef.current.join(' ');

    stopRecording();

    setTimeout(() => analyzeVoiceData(vol, pitch, pauses, words, tx), 300);
  };

  const analyzeVoiceData = async (volumes: number[], pitches: number[], pauseCount: number, words: string[], tx: string) => {
    setIsAnalyzing(true);
    setError('');

    try {
      if (volumes.length < 5) throw new Error("Could not detect enough voice. Please speak louder or longer.");

      const totalVol = volumes.reduce((a, b) => a + b, 0);
      const avgVolume = totalVol / volumes.length;
      const variance = volumes.reduce((a, b) => a + Math.pow(b - avgVolume, 2), 0) / volumes.length;
      const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
      const wordsPerMinute = words.length > 0 ? Math.round((words.length / recordDuration) * 60) : 0;

      const { data, error: fnError } = await supabase.functions.invoke('voice-mood', {
        body: {
          transcript: tx,
          audioFeatures: { avgVolume, variance, avgPitch, duration: recordDuration, pauseCount, wordsPerMinute },
          userProfile: userData ? { occupation: userData.occupation, age: userData.age } : null,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const finalResult: VoiceMoodResult = { ...data, transcript: tx };
      setResult(finalResult);
      setTranscript(tx);
      onMoodDetected?.(finalResult);

      // Save to DB
      if (user) {
        await supabase.from('voice_mood_scans').insert({
          user_id: user.id,
          mood: finalResult.mood,
          confidence: finalResult.confidence,
          transcript: tx,
          audio_features: { avgVolume, variance, avgPitch, duration: recordDuration, pauseCount, wordsPerMinute },
          mental_state_indicators: finalResult.mental_state_indicators,
          suggested_action: finalResult.suggested_action,
        });
      }

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      <Button onClick={open} variant="outline" size="sm"
        className="gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Mic className="w-4 h-4" />
        <span className="text-sm">Voice Mood Scan</span>
      </Button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d1117' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Voice Mood Analysis</p>
                  <p className="text-xs text-gray-500">AI-powered mental state detection</p>
                </div>
              </div>
              <button onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 min-h-[340px] flex flex-col items-center justify-center">
              {error ? (
                <div className="text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                  <p className="text-red-400 text-sm">{error}</p>
                  <Button onClick={() => setError('')} variant="outline" size="sm"
                    className="border-white/20 text-white hover:bg-white/10">Try Again</Button>
                </div>
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <div>
                    <p className="text-white font-semibold">Analyzing with AI...</p>
                    <p className="text-gray-400 text-xs mt-1">Reading your tone, content & patterns</p>
                  </div>
                </div>
              ) : result ? (
                <div className="w-full space-y-4 animate-[fadeIn_0.4s_ease]">
                  <div className="text-center">
                    <span className="text-5xl">{moodEmojis[result.mood] || '🤔'}</span>
                    <p className="text-white text-lg font-bold capitalize mt-2">{result.mood}</p>
                    <p className="text-emerald-400 text-xs">{result.confidence}% confidence</p>
                  </div>

                  <p className="text-gray-300 text-sm text-center leading-relaxed">{result.description}</p>

                  {/* Mental state indicators */}
                  {result.mental_state_indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {result.mental_state_indicators.slice(0, 4).map(ind => (
                        <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                          {ind.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested action */}
                  <div className={`p-3 rounded-xl border ${urgencyColors[result.urgency]}`}>
                    {result.urgency === 'crisis' && (
                      <p className="text-red-400 text-xs font-bold mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Please reach out for support
                      </p>
                    )}
                    <p className="text-sm text-white/90 leading-relaxed">{result.suggested_action}</p>
                  </div>

                  {/* Transcript preview */}
                  {result.transcript && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-gray-500 mb-1">What you said:</p>
                      <p className="text-xs text-gray-300 italic leading-relaxed line-clamp-2">"{result.transcript}"</p>
                    </div>
                  )}

                  {/* PHQ-2 flag */}
                  {result.phq2_flag && (
                    <p className="text-xs text-amber-400 text-center">
                      💛 You might benefit from speaking to a counsellor. iCall: 9152987821
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full space-y-5">
                  {/* Waveform visualizer */}
                  <div className="flex items-end justify-center gap-0.5 h-14">
                    {waveformBars.map((h, i) => (
                      <div key={i}
                        style={{ height: `${h}px`, width: '6px' }}
                        className={`rounded-full transition-all duration-75 ${
                          isRecording
                            ? 'bg-emerald-400'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Status text */}
                  <div className="text-center">
                    {isRecording ? (
                      <>
                        <p className="text-white font-semibold">
                          Listening... <span className="text-emerald-400 font-mono">{timeLeft}s</span>
                        </p>
                        {hasSpeechRecognition && transcript && (
                          <p className="text-gray-400 text-xs mt-1 italic line-clamp-2">"{transcript}"</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-white font-semibold">Speak naturally</p>
                        <p className="text-gray-400 text-xs mt-1">Talk about how your day is going</p>
                      </>
                    )}
                  </div>

                  {/* Duration selector */}
                  {!isRecording && (
                    <div className="flex justify-center gap-2">
                      {RECORDING_OPTIONS.map(s => (
                        <button key={s} onClick={() => setRecordDuration(s)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            recordDuration === s
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}>
                          {s}s
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sample prompt */}
                  {!isRecording && (
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <p className="text-gray-300 text-xs italic text-center leading-relaxed">
                        "Today has been... [just talk freely about how you're feeling, what's on your mind, how your day went]"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              {!result && !isAnalyzing ? (
                <Button onClick={isRecording ? stopRecordingAndAnalyze : startRecording}
                  className={`w-full h-12 rounded-xl text-white font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'
                  }`}>
                  {isRecording ? (
                    <><X className="w-4 h-4 mr-2" />Stop & Analyze</>
                  ) : (
                    <><Mic className="w-4 h-4 mr-2" />Start Recording ({recordDuration}s)</>
                  )}
                </Button>
              ) : result && !isAnalyzing ? (
                <Button onClick={() => { setResult(null); setTranscript(''); }} variant="outline"
                  className="w-full h-12 rounded-xl border-emerald-500/30 text-emerald-400 bg-transparent hover:bg-emerald-500/10">
                  <RefreshCw className="w-4 h-4 mr-2" />Scan Again
                </Button>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default VoiceMoodReader;
