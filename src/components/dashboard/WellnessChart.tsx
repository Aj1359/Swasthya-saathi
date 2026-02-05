import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface WellnessData {
  date: string;
  happiness: number;
  health: number;
  meditation: number;
  yoga: number;
  breathing: number;
}

const WellnessChart = () => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  
  // Get data from localStorage
  const getStoredData = (): WellnessData[] => {
    const data: WellnessData[] = [];
    const today = new Date();
    const days = view === 'weekly' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Try to get stored data for this date
      const storedDaily = localStorage.getItem(`swasthyasaathi_daily_${dateStr}`);
      const storedUser = localStorage.getItem('swasthyasaathi_user');
      
      let happiness = 50;
      let health = 50;
      let meditation = 0;
      let yoga = 0;
      let breathing = 0;
      
      if (storedDaily) {
        const daily = JSON.parse(storedDaily);
        meditation = daily.meditationMinutes || 0;
        yoga = daily.yogaMinutes || 0;
        breathing = daily.breathingMinutes || 0;
        
        // Calculate indices based on activities
        const activityScore = Math.min((meditation + yoga + breathing) * 2, 40);
        const waterScore = Math.min((daily.waterIntake || 0) * 3, 24);
        const sleepScore = Math.min((daily.sleepHours || 0) * 3, 24);
        const moodScore = (daily.mood || 3) * 6;
        
        health = Math.min(50 + activityScore + waterScore + sleepScore - 30, 100);
        happiness = Math.min(50 + moodScore + activityScore - 20, 100);
      }
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (i === 0) {
          happiness = user.happinessIndex || happiness;
          health = user.healthIndex || health;
        }
      }
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          weekday: view === 'weekly' ? 'short' : undefined,
          month: 'short', 
          day: 'numeric' 
        }),
        happiness: Math.round(happiness),
        health: Math.round(health),
        meditation,
        yoga,
        breathing
      });
    }
    
    return data;
  };

  const data = getStoredData();
  
  // Calculate trend
  const calculateTrend = (key: 'happiness' | 'health') => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3).reduce((sum, d) => sum + d[key], 0) / 3;
    const earlier = data.slice(0, 3).reduce((sum, d) => sum + d[key], 0) / 3;
    return Math.round(recent - earlier);
  };

  const happinessTrend = calculateTrend('happiness');
  const healthTrend = calculateTrend('health');

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Wellness Trends</CardTitle>
              <p className="text-sm text-muted-foreground">Track your progress over time</p>
            </div>
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              size="sm"
              variant={view === 'weekly' ? 'default' : 'ghost'}
              onClick={() => setView('weekly')}
              className="text-xs h-8"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Week
            </Button>
            <Button
              size="sm"
              variant={view === 'monthly' ? 'default' : 'ghost'}
              onClick={() => setView('monthly')}
              className="text-xs h-8"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend indicators */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10">
            <span className="text-sm font-medium text-foreground">Happiness</span>
            <span className={`text-sm font-bold ${happinessTrend >= 0 ? 'text-primary' : 'text-amber'}`}>
              {happinessTrend >= 0 ? '↑' : '↓'} {Math.abs(happinessTrend)}%
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10">
            <span className="text-sm font-medium text-foreground">Health</span>
            <span className={`text-sm font-bold ${healthTrend >= 0 ? 'text-accent' : 'text-amber'}`}>
              {healthTrend >= 0 ? '↑' : '↓'} {Math.abs(healthTrend)}%
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                interval={view === 'weekly' ? 0 : 'preserveStartEnd'}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="happiness" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="Happiness"
              />
              <Line 
                type="monotone" 
                dataKey="health" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                name="Health"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Summary */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-lavender/20">
            <p className="text-xs text-muted-foreground">Meditation</p>
            <p className="font-bold text-foreground">
              {data.reduce((sum, d) => sum + d.meditation, 0)} min
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-sage/20">
            <p className="text-xs text-muted-foreground">Yoga</p>
            <p className="font-bold text-foreground">
              {data.reduce((sum, d) => sum + d.yoga, 0)} min
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-sky/20">
            <p className="text-xs text-muted-foreground">Breathing</p>
            <p className="font-bold text-foreground">
              {data.reduce((sum, d) => sum + d.breathing, 0)} min
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellnessChart;
