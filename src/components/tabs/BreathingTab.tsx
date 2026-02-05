import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyTracker } from '@/components/tracking/DailyTracker';

const exercises = [
  {
    id: 'anulom-vilom',
    name: 'Anulom Vilom',
    description: 'Alternate nostril breathing for balance',
    benefits: ['Balances left-right brain', 'Reduces stress', 'Improves focus'],
    steps: [
      { action: 'Close right nostril, inhale left', duration: 4 },
      { action: 'Close both, hold breath', duration: 2 },
      { action: 'Close left nostril, exhale right', duration: 4 },
      { action: 'Inhale right nostril', duration: 4 },
      { action: 'Close both, hold breath', duration: 2 },
      { action: 'Exhale left nostril', duration: 4 },
    ],
    color: 'from-primary to-sage',
    icon: '🌿',
  },
  {
    id: '4-7-8',
    name: '4-7-8 Technique',
    description: 'Calming breath for sleep & anxiety',
    benefits: ['Promotes sleep', 'Reduces anxiety', 'Calms nervous system'],
    steps: [
      { action: 'Inhale deeply', duration: 4 },
      { action: 'Hold your breath', duration: 7 },
      { action: 'Exhale slowly', duration: 8 },
    ],
    color: 'from-lavender to-accent',
    icon: '🌙',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal timing for focus & calm',
    benefits: ['Navy SEAL technique', 'Improves concentration', 'Stress relief'],
    steps: [
      { action: 'Inhale', duration: 4 },
      { action: 'Hold', duration: 4 },
      { action: 'Exhale', duration: 4 },
      { action: 'Hold', duration: 4 },
    ],
    color: 'from-secondary to-amber',
    icon: '📦',
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    description: 'Quick breaths to boost energy',
    benefits: ['Increases alertness', 'Boosts energy', 'Morning practice'],
    steps: [
      { action: 'Quick inhale through nose', duration: 1 },
      { action: 'Quick exhale through nose', duration: 1 },
      { action: 'Quick inhale through nose', duration: 1 },
      { action: 'Quick exhale through nose', duration: 1 },
    ],
    color: 'from-amber to-secondary',
    icon: '⚡',
  },
];

const BreathingTab = () => {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { addActivity } = useDailyTracker();

  useEffect(() => {
    if (isPlaying) {
      setTimeLeft(selectedExercise.steps[currentStep].duration);
    }
  }, [currentStep, isPlaying, selectedExercise]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      const nextStep = (currentStep + 1) % selectedExercise.steps.length;
      if (nextStep === 0) {
        setCycles((prev) => prev + 1);
      }
      setCurrentStep(nextStep);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeLeft, currentStep, selectedExercise]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setTimeLeft(selectedExercise.steps[currentStep].duration);
      startTimeRef.current = Date.now();
    } else {
      // Track activity when pausing
      const elapsed = Math.round(totalTime / 60);
      if (elapsed > 0) {
        addActivity('breathing', elapsed);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    // Track activity before reset
    if (totalTime > 0) {
      const elapsed = Math.round(totalTime / 60);
      if (elapsed > 0) {
        addActivity('breathing', elapsed);
      }
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeLeft(0);
    setCycles(0);
    setTotalTime(0);
  };

  const handleSelectExercise = (exercise: typeof exercises[0]) => {
    handleReset();
    setSelectedExercise(exercise);
  };

  const progress = isPlaying
    ? ((selectedExercise.steps[currentStep].duration - timeLeft) / selectedExercise.steps[currentStep].duration) * 100
    : 0;

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-lavender/20 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-lavender/30 flex items-center justify-center animate-breathe">
            <Wind className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Breathing Exercises</h2>
            <p className="text-muted-foreground">Follow the timer for guided breathing</p>
          </div>
        </div>
      </div>

      {/* Exercise Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => handleSelectExercise(ex)}
            className={`p-4 rounded-2xl text-left transition-all ${
              selectedExercise.id === ex.id
                ? 'bg-primary text-primary-foreground shadow-xl scale-[1.02]'
                : 'glass-card hover:bg-muted/50 hover:scale-[1.01]'
            }`}
          >
            <span className="text-2xl mb-2 block">{ex.icon}</span>
            <h3 className="font-semibold text-sm">{ex.name}</h3>
            <p className={`text-xs mt-1 ${selectedExercise.id === ex.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {ex.description}
            </p>
          </button>
        ))}
      </div>

      {/* Benefits */}
      <div className="flex flex-wrap gap-2">
        {selectedExercise.benefits.map((benefit, i) => (
          <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            ✓ {benefit}
          </span>
        ))}
      </div>

      {/* Main Exercise Display */}
      <div className="glass-card p-8">
        {/* Animated Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-primary">{timeLeft}</span>
            <span className="text-sm text-muted-foreground mt-1">seconds</span>
          </div>
        </div>

        {/* Current Action */}
        <div className="text-center mb-6">
          <p className={`text-2xl font-display font-semibold text-foreground ${isPlaying ? 'animate-pulse-gentle' : ''}`}>
            {isPlaying ? selectedExercise.steps[currentStep].action : 'Ready to begin?'}
          </p>
          
          {/* Stats Row */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-4 h-4 text-amber" />
              <span>{cycles} cycles</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{formatTotalTime(totalTime)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-36 bg-primary hover:bg-primary/90"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {selectedExercise.steps.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentStep ? 'bg-primary scale-125' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BreathingTab;
