import { useState, useEffect } from 'react';
import { BookOpen, Save, ChevronLeft, ChevronRight, Smile, Meh, Frown, Heart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  date: string;
  mood: number;
  reflection: string;
  gratitude: string;
  timestamp: number;
}

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: 'Rough', color: 'text-destructive' },
  { value: 2, icon: Frown, label: 'Low', color: 'text-amber' },
  { value: 3, icon: Meh, label: 'Okay', color: 'text-muted-foreground' },
  { value: 4, icon: Smile, label: 'Good', color: 'text-primary' },
  { value: 5, icon: Heart, label: 'Great', color: 'text-pink-500' },
];

const MoodJournal = () => {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [mood, setMood] = useState(3);
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});

  useEffect(() => {
    const stored = localStorage.getItem('swasthyasaathi_journal');
    if (stored) setEntries(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const entry = entries[selectedDate];
    if (entry) {
      setMood(entry.mood);
      setReflection(entry.reflection);
      setGratitude(entry.gratitude);
    } else {
      setMood(3);
      setReflection('');
      setGratitude('');
    }
  }, [selectedDate, entries]);

  const saveEntry = () => {
    if (!reflection.trim()) {
      toast({ title: "Write something first 🌿", description: "Even a single sentence counts!" });
      return;
    }
    const entry: JournalEntry = {
      date: selectedDate,
      mood,
      reflection: reflection.trim(),
      gratitude: gratitude.trim(),
      timestamp: Date.now(),
    };
    const updated = { ...entries, [selectedDate]: entry };
    setEntries(updated);
    localStorage.setItem('swasthyasaathi_journal', JSON.stringify(updated));
    toast({ title: "Journal saved! 💚", description: "Your reflection has been recorded." });
  };

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    if (d <= new Date()) setSelectedDate(d.toISOString().split('T')[0]);
  };

  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (entries[key]) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  })();

  const isToday = selectedDate === today;
  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-lavender/30 via-primary/10 to-accent/20 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2 text-foreground">
            <BookOpen className="w-5 h-5 text-lavender-foreground" />
            Mood Journal
          </CardTitle>
          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber/20 text-amber-foreground text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              {streak} day streak 🔥
            </div>
          )}
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{formattedDate}</span>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} disabled={isToday} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Mood selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">How are you feeling?</p>
          <div className="flex justify-between gap-2">
            {MOOD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMood(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    mood === opt.value
                      ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${mood === opt.value ? opt.color : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reflection */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">What's on your mind today?</p>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write freely... no one else will see this 🌿"
            className="min-h-[100px] bg-muted/30 border-border/50 rounded-xl resize-none"
            maxLength={2000}
          />
        </div>

        {/* Gratitude */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">One thing you're grateful for? ✨</p>
          <Textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="Even something small counts..."
            className="min-h-[60px] bg-muted/30 border-border/50 rounded-xl resize-none"
            maxLength={500}
          />
        </div>

        <Button onClick={saveEntry} className="w-full rounded-xl bg-gradient-to-r from-lavender to-primary text-primary-foreground shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Save Reflection
        </Button>
      </CardContent>
    </Card>
  );
};

export default MoodJournal;
