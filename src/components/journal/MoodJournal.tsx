import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Save,
  Smile,
  Meh,
  Frown,
  Heart,
  Sparkles
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface JournalEntry {
  id: string;
  mood: number;
  reflection: string;
  created_at: string;
}

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: "Rough", color: "text-red-500" },
  { value: 2, icon: Frown, label: "Low", color: "text-amber-500" },
  { value: 3, icon: Meh, label: "Okay", color: "text-gray-500" },
  { value: 4, icon: Smile, label: "Good", color: "text-green-500" },
  { value: 5, icon: Heart, label: "Great", color: "text-pink-500" }
];

const REFLECTION_PROMPTS = [
  "What challenged you today?",
  "What made you smile today?",
  "What did you learn today?",
  "What are you proud of today?"
];

const MoodJournal = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [mood, setMood] = useState(3);
  const [reflection, setReflection] = useState("");
  const [intention, setIntention] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  /* Load journal entries from both LocalStorage and Supabase */
  const loadEntries = useCallback(async () => {
    try {
      const localDict = JSON.parse(localStorage.getItem('swasthyasaathi_journal') || '{}');
      const localList: JournalEntry[] = Object.values(localDict).map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        mood: item.mood || 3,
        reflection: item.reflection || '',
        created_at: item.created_at || new Date(item.timestamp || Date.now()).toISOString(),
      }));

      let dbList: JournalEntry[] = [];
      if (user) {
        const { data, error } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          dbList = data.map((d) => ({
            id: d.id,
            mood: d.mood,
            reflection: d.reflection,
            created_at: d.created_at,
          }));
        }
      }

      // Merge and deduplicate by ID
      const map = new Map<string, JournalEntry>();
      [...dbList, ...localList].forEach((e) => {
        if (e.id && e.reflection) map.set(e.id, e);
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(merged);
    } catch (err) {
      console.warn("Journal load error:", err);
    }
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /* Save journal entry */
  const saveEntry = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Write something first 🌿",
        description: "Even a single sentence counts!"
      });
      return;
    }

    setLoading(true);

    try {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        mood: mood,
        reflection: reflection.trim(),
        created_at: new Date().toISOString(),
      };

      // 1. Save to LocalStorage (works offline & guest mode)
      const localDict = JSON.parse(localStorage.getItem('swasthyasaathi_journal') || '{}');
      localDict[newEntry.id] = {
        id: newEntry.id,
        mood: newEntry.mood,
        reflection: newEntry.reflection,
        timestamp: Date.now(),
        created_at: newEntry.created_at
      };
      localStorage.setItem('swasthyasaathi_journal', JSON.stringify(localDict));

      // 2. Save to Supabase (if logged in)
      if (user) {
        try {
          await supabase
            .from("journal_entries")
            .insert([
              {
                user_id: user.id,
                mood: mood,
                reflection: reflection.trim()
              }
            ]);
        } catch (dbErr) {
          console.warn("Database sync warning:", dbErr);
        }
      }

      setLoading(false);

      toast({
        title: "Journal saved 💚",
        description: "Your reflection has been recorded."
      });

      setEntries(prev => [newEntry, ...prev.filter(e => e.id !== newEntry.id)]);
      setReflection("");
      setIntention("");

    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected error",
        description: "Something went wrong."
      });
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="w-5 h-5" />
          Mood Journal
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mood Selector */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            How are you feeling today?
          </p>

          <div className="flex gap-2">
            {MOOD_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMood(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-200 ${
                    mood === opt.value
                      ? "bg-primary/20 ring-2 ring-primary/40 scale-105 shadow"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      mood === opt.value
                        ? opt.color
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
            <span>Rough</span>
            <span>Okay</span>
            <span>Great</span>
          </div>
        </div>

        {/* Reflection */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            What's on your mind today?
          </p>

          <Textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="Write freely... no one else will see this 🌿"
            className="min-h-[120px] bg-muted/30 border-border/50 rounded-xl resize-none"
          />

          <div className="flex flex-wrap gap-2 mt-3">
            {REFLECTION_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => setReflection(prompt + " ")}
                className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/70"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Intention (UI only) */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Today's small intention 🌱
          </p>

          <Textarea
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Example: Take a short walk, drink more water..."
            className="min-h-[60px] bg-muted/30 border-border/50 rounded-xl resize-none"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={saveEntry}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-green-500 text-white shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Reflection"}
        </Button>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Recent reflections
            </p>

            <div className="space-y-2">
              {entries.slice(0, 5).map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-muted/40 border border-border/40 text-sm flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {MOOD_OPTIONS.find(m => m.value === entry.mood)?.label || 'Mood'}
                    </span>
                    <span>{new Date(entry.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{entry.reflection}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodJournal;