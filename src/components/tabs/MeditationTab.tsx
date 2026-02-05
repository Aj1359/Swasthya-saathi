import { Headphones, Play, Pause, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDailyTracker } from '@/components/tracking/DailyTracker';

// ✅ Import audio files (same folder)
import ocean from './ocean.mp3';
import forest from './forest.mp3';
import tibetan from './tibetian.mp3';
import birds from './birds.mp3';
import river from './river.mp3';
import wind from './wind.mp3';

type Track = {
  id: number;
  title: string;
  duration: string;
  description: string;
  color: string;
  audioUrl: string;
  benefits: string[];
};

const tracks: Track[] = [
  {
    id: 1,
    title: 'Ocean Waves',
    duration: '11 min',
    description: 'Calming ocean sounds for deep relaxation',
    color: 'from-sky to-accent',
    audioUrl: ocean,
    benefits: ['Reduces anxiety', 'Improves sleep', 'Calms the mind'],
  },
  {
    id: 2,
    title: 'Forest Rain',
    duration: '12 min',
    description: 'Gentle rain in a peaceful forest',
    color: 'from-primary to-sage',
    audioUrl: forest,
    benefits: ['Deep relaxation', 'Focus enhancement', 'Stress relief'],
  },
  {
    id: 3,
    title: 'Tibetan Singing Bowls',
    duration: '10 min',
    description: 'Healing frequencies for inner peace',
    color: 'from-lavender to-primary',
    audioUrl: tibetan,
    benefits: ['Chakra balancing', 'Deep meditation', 'Spiritual healing'],
  },
  {
    id: 4,
    title: 'Morning Birds Chirping',
    duration: '8 min',
    description: "Wake up to nature's symphony",
    color: 'from-secondary to-amber',
    audioUrl: birds,
    benefits: ['Morning energy', 'Positive start', 'Natural awakening'],
  },
  {
    id: 5,
    title: 'Flowing Stream',
    duration: '20 min',
    description: 'Peaceful flowing water for meditation',
    color: 'from-primary to-lavender',
    audioUrl: river,
    benefits: ['Flow state', 'Concentration', 'Peace of mind'],
  },
  {
    id: 6,
    title: 'Zen Garden Wind Chimes',
    duration: '6 min',
    description: 'Gentle wind chimes for serenity',
    color: 'from-sage to-primary',
    audioUrl: wind,
    benefits: ['Stress reduction', 'Peaceful ambiance', 'Mental clarity'],
  },
];

const MeditationTab = () => {
  const [playing, setPlaying] = useState<number | null>(null);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const { addActivity } = useDailyTracker();

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = async (track: Track) => {
    try {
      // ⏸ Pause if same track
      if (playing === track.id) {
        audioRef.current?.pause();

        const elapsed = Math.round(
          (Date.now() - startTimeRef.current) / 60000
        );
        if (elapsed > 0) addActivity('meditation', elapsed);

        setPlaying(null);
        setCurrentTime(0);
        return;
      }

      // ▶ Stop previous
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(track.audioUrl);
      audio.volume = volume / 100;
      audio.loop = true;
      audio.preload = 'auto';

      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);

      await audio.play(); // 🔑 Required for reliability

      audioRef.current = audio;
      startTimeRef.current = Date.now();
      setPlaying(track.id);
    } catch (err) {
      console.error('Audio play blocked:', err);
      alert('Tap once more to enable audio 🎧');
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center animate-breathe">
            <Headphones className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Brain Soothing Music</h2>
            <p className="text-muted-foreground">
              🎧 Use headphones for best experience
            </p>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="glass-card p-4 flex items-center gap-4">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-sm w-12">{volume}%</span>
      </div>

      {/* Now Playing */}
      {playing && (
        <div className="glass-card p-6 border border-primary/30">
          <p className="text-sm text-muted-foreground">Now Playing</p>
          <p className="font-bold text-lg">
            {tracks.find(t => t.id === playing)?.title}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs">{formatTime(currentTime)}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: duration
                    ? `${(currentTime / duration) * 100}%`
                    : '0%',
                }}
              />
            </div>
            <span className="text-xs">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Tracks */}
      <div className="grid gap-4">
        {tracks.map(track => (
          <div
            key={track.id}
            className={`glass-card p-5 ${
              playing === track.id
                ? 'ring-2 ring-primary bg-primary/5'
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${track.color} flex items-center justify-center`}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-12 h-12 rounded-full bg-white/20 text-white"
                  onClick={() => togglePlay(track)}
                >
                  {playing === track.id ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{track.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {track.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {track.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-sm hidden sm:block">
                {track.duration}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeditationTab;
