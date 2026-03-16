import { useState, useEffect } from "react";
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

  /* Load entries from DB */

  useEffect(() => {
    if (!user) return;

    const loadEntries = async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        toast({
          title: "Could not load journal",
          description: error.message
        });
        return;
      }

      setEntries(data || []);
    };

    loadEntries();
  }, [user]);

  /* Save entry */

  const saveEntry = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Write something first 🌿",
        description: "Even a single sentence counts!"
      });
      return;
    }

    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        mood,
        reflection: reflection.trim()
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Error saving journal",
        description: error.message
      });
      return;
    }

    toast({
      title: "Journal saved 💚",
      description: "Your reflection has been recorded."
    });

    setEntries(prev => [data, ...prev]);

    setReflection("");
    setIntention("");
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">

      {/* Header */}

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="w-5 h-5" />
          Mood Journal
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Mood selector */}

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

          {/* Mood scale */}

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

          {/* Prompt helpers */}

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

        {/* Intention field (UI only) */}

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

        {/* Save button */}

        <Button
          onClick={saveEntry}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-green-500 text-white shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />

          {loading ? "Saving..." : "Save Reflection"}
        </Button>

        {/* Recent entries */}

        {entries.length > 0 && (
          <div className="pt-4 border-t border-border/50">

            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Recent reflections
            </p>

            <div className="space-y-2">
              {entries.slice(0, 3).map((e, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/30 text-sm"
                >
                  {e.reflection}
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