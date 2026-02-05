import { useState, useEffect } from 'react';
import { Droplets, Moon, Smile, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useUser } from '@/contexts/UserContext';

interface DailyData {
  date: string;
  waterIntake: number;
  sleepHours: number;
  mood: number;
  meditationMinutes: number;
  breathingMinutes: number;
  yogaMinutes: number;
}

const STORAGE_KEY = 'swasthyasaathi_daily';

const DailyTracker = () => {
  const { userData, updateIndices } = useUser();
  const today = new Date().toISOString().split('T')[0];
  
  const [dailyData, setDailyData] = useState<DailyData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed;
    }
    return {
      date: today,
      waterIntake: 0,
      sleepHours: 7,
      mood: 3,
      meditationMinutes: 0,
      breathingMinutes: 0,
      yogaMinutes: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyData));
    
    // Update health and happiness indices based on daily data
    const waterScore = Math.min(dailyData.waterIntake / 8, 1) * 20;
    const sleepScore = dailyData.sleepHours >= 7 ? 25 : (dailyData.sleepHours / 7) * 25;
    const moodScore = (dailyData.mood / 5) * 25;
    const activityScore = Math.min((dailyData.meditationMinutes + dailyData.breathingMinutes + dailyData.yogaMinutes) / 30, 1) * 30;
    
    const newHealth = Math.round(waterScore + sleepScore + activityScore);
    const newHappiness = Math.round(moodScore + activityScore + waterScore / 2 + sleepScore / 2);
    
    if (userData) {
      updateIndices(Math.min(newHappiness, 100), Math.min(newHealth, 100));
    }
  }, [dailyData, userData, updateIndices]);

  const addWater = () => {
    setDailyData(prev => ({ ...prev, waterIntake: Math.min(prev.waterIntake + 1, 12) }));
  };

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sky flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Daily Wellness Tracker</h3>
          <p className="text-sm text-muted-foreground">Track your daily health habits</p>
        </div>
      </div>

      {/* Water Intake */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky" />
            <span className="font-medium text-foreground">Water Intake</span>
          </div>
          <span className="text-sm text-muted-foreground">{dailyData.waterIntake}/8 glasses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky to-accent transition-all duration-300"
              style={{ width: `${(dailyData.waterIntake / 8) * 100}%` }}
            />
          </div>
          <Button size="sm" variant="outline" onClick={addWater} className="shrink-0">
            <Droplets className="w-4 h-4 mr-1" />
            +1
          </Button>
        </div>
      </div>

      {/* Sleep Hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-lavender" />
            <span className="font-medium text-foreground">Sleep Last Night</span>
          </div>
          <span className="text-sm text-muted-foreground">{dailyData.sleepHours} hours</span>
        </div>
        <Slider
          value={[dailyData.sleepHours]}
          onValueChange={([value]) => setDailyData(prev => ({ ...prev, sleepHours: value }))}
          min={0}
          max={12}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Mood */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-secondary" />
            <span className="font-medium text-foreground">Today's Mood</span>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          {moodEmojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setDailyData(prev => ({ ...prev, mood: i + 1 }))}
              className={`text-2xl p-2 rounded-lg transition-all ${
                dailyData.mood === i + 1 
                  ? 'bg-primary/20 scale-110 ring-2 ring-primary' 
                  : 'hover:bg-muted'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Today's Activities</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-card rounded-lg p-2">
            <p className="text-lg font-bold text-primary">{dailyData.meditationMinutes}</p>
            <p className="text-xs text-muted-foreground">Meditation mins</p>
          </div>
          <div className="bg-card rounded-lg p-2">
            <p className="text-lg font-bold text-sage">{dailyData.breathingMinutes}</p>
            <p className="text-xs text-muted-foreground">Breathing mins</p>
          </div>
          <div className="bg-card rounded-lg p-2">
            <p className="text-lg font-bold text-secondary">{dailyData.yogaMinutes}</p>
            <p className="text-xs text-muted-foreground">Yoga mins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useDailyTracker = () => {
  const STORAGE_KEY = 'swasthyasaathi_daily';
  const today = new Date().toISOString().split('T')[0];
  
  const addActivity = (type: 'meditation' | 'breathing' | 'yoga', minutes: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let data = stored ? JSON.parse(stored) : { date: today };
    if (data.date !== today) {
      data = { date: today, waterIntake: 0, sleepHours: 7, mood: 3, meditationMinutes: 0, breathingMinutes: 0, yogaMinutes: 0 };
    }
    
    if (type === 'meditation') data.meditationMinutes = (data.meditationMinutes || 0) + minutes;
    if (type === 'breathing') data.breathingMinutes = (data.breathingMinutes || 0) + minutes;
    if (type === 'yoga') data.yogaMinutes = (data.yogaMinutes || 0) + minutes;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('dailyTrackerUpdate'));
  };

  return { addActivity };
};

export default DailyTracker;
