import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WeekSummary {
  avgMood: number;
  totalMeditation: number;
  totalYoga: number;
  totalBreathing: number;
  scanCount: number;
  journalCount: number;
  dominantMood: string;
  trend: 'up' | 'down' | 'stable';
}

const WeeklyReport = () => {
  const { userData } = useUser();
  const { user } = useAuth();
  const [report, setReport] = useState<WeekSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    generateReport();
  }, [user]);

  const generateReport = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString();

    const [scans, activities, journals] = await Promise.all([
      supabase.from('face_scans').select('*').eq('user_id', user!.id).gte('created_at', weekStr),
      supabase.from('activity_logs').select('*').eq('user_id', user!.id).gte('created_at', weekStr),
      supabase.from('journal_entries').select('*').eq('user_id', user!.id).gte('created_at', weekStr),
    ]);

    const moodScores: Record<string, number> = { happy: 5, neutral: 3, sad: 1, anxious: 2, stressed: 2, tired: 2, angry: 1 };
    const moodCounts: Record<string, number> = {};
    let totalMoodScore = 0;

    (scans.data || []).forEach(s => {
      moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
      totalMoodScore += moodScores[s.mood] || 3;
    });

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    const avgMood = (scans.data?.length || 0) > 0 ? totalMoodScore / scans.data!.length : 3;

    let med = 0, yoga = 0, breath = 0;
    (activities.data || []).forEach(a => {
      if (a.activity_type === 'meditation') med += a.duration_minutes || 0;
      if (a.activity_type === 'yoga') yoga += a.duration_minutes || 0;
      if (a.activity_type === 'breathing') breath += a.duration_minutes || 0;
    });

    const trend = avgMood >= 4 ? 'up' : avgMood <= 2 ? 'down' : 'stable';

    setReport({
      avgMood,
      totalMeditation: med,
      totalYoga: yoga,
      totalBreathing: breath,
      scanCount: scans.data?.length || 0,
      journalCount: journals.data?.length || 0,
      dominantMood,
      trend,
    });
  };

  if (!report) return null;

  const TrendIcon = report.trend === 'up' ? TrendingUp : report.trend === 'down' ? TrendingDown : Minus;
  const trendColor = report.trend === 'up' ? 'text-primary' : report.trend === 'down' ? 'text-destructive' : 'text-secondary';
  const moodEmoji: Record<string, string> = { happy: '😊', neutral: '😐', sad: '😢', anxious: '😰', stressed: '😣', tired: '😴', angry: '😤' };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-amber flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Weekly Wellness Report</CardTitle>
            <p className="text-sm text-muted-foreground">Past 7 days summary</p>
          </div>
          <TrendIcon className={`w-6 h-6 ml-auto ${trendColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-center">
            <p className="text-2xl">{moodEmoji[report.dominantMood] || '😐'}</p>
            <p className="text-xs text-muted-foreground mt-1">Dominant Mood</p>
            <p className="text-sm font-medium text-foreground capitalize">{report.dominantMood}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/10 text-center">
            <p className="text-2xl font-bold text-foreground">{report.scanCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Face Scans</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-primary">{report.totalMeditation}</p>
            <p className="text-[10px] text-muted-foreground">Med. mins</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-secondary">{report.totalYoga}</p>
            <p className="text-[10px] text-muted-foreground">Yoga mins</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-accent">{report.totalBreathing}</p>
            <p className="text-[10px] text-muted-foreground">Breath mins</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/50 flex items-center justify-between">
          <span className="text-sm text-foreground">Journal Entries</span>
          <span className="text-sm font-bold text-foreground">{report.journalCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-primary/10">
          <p className="text-sm font-medium text-foreground mb-1">
            {report.trend === 'up' ? '🌟 Great week!' : report.trend === 'down' ? '💚 Take it easy' : '🌿 Steady progress'}
          </p>
          <p className="text-xs text-muted-foreground">
            {report.trend === 'up'
              ? 'Your mood and activities show positive momentum. Keep it going!'
              : report.trend === 'down'
              ? 'This week was tough. Talk to Ruhi or try a meditation session.'
              : 'You\'re maintaining a stable baseline. Small improvements add up!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyReport;
