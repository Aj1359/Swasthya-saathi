import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Camera, Dumbbell, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [faceScans, setFaceScans] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    const [chats, scans, acts, jrnls] = await Promise.all([
      supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('face_scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);

    if (chats.data) {
      // Group by session
      const sessions: Record<string, any[]> = {};
      chats.data.forEach((m) => {
        if (!sessions[m.session_id]) sessions[m.session_id] = [];
        sessions[m.session_id].push(m);
      });
      setChatSessions(Object.entries(sessions).map(([id, msgs]) => ({
        id,
        messageCount: msgs.length,
        lastMessage: msgs[0]?.content?.slice(0, 80),
        date: msgs[0]?.created_at,
      })));
    }
    if (scans.data) setFaceScans(scans.data);
    if (acts.data) setActivities(acts.data);
    if (jrnls.data) setJournals(jrnls.data);
  };

  const moodEmojis: Record<string, string> = {
    happy: '😊', sad: '😢', angry: '😤', anxious: '😰', neutral: '😐', tired: '😴', stressed: '😣',
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-primary/10">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground">Your History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card/80 rounded-2xl mb-4 border border-border/50">
            <TabsTrigger value="chats" className="rounded-xl text-xs sm:text-sm"><MessageSquare className="w-4 h-4 mr-1" />Chats</TabsTrigger>
            <TabsTrigger value="scans" className="rounded-xl text-xs sm:text-sm"><Camera className="w-4 h-4 mr-1" />Scans</TabsTrigger>
            <TabsTrigger value="activities" className="rounded-xl text-xs sm:text-sm"><Dumbbell className="w-4 h-4 mr-1" />Activities</TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl text-xs sm:text-sm"><BookOpen className="w-4 h-4 mr-1" />Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="chats">
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-3">
                {chatSessions.length === 0 && <p className="text-center text-muted-foreground py-8">No chat history yet. Talk to Ruhi! 💚</p>}
                {chatSessions.map((s) => (
                  <Card key={s.id} className="bg-card/80 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.lastMessage || 'Chat session'}</p>
                          <p className="text-xs text-muted-foreground">{s.messageCount} messages</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{s.date && fmt(s.date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="scans">
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-3">
                {faceScans.length === 0 && <p className="text-center text-muted-foreground py-8">No face scans yet. Try one! 📸</p>}
                {faceScans.map((s) => (
                  <Card key={s.id} className="bg-card/80 border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{moodEmojis[s.mood] || '🤔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{s.mood} — {s.confidence}% confidence</p>
                        <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                        {s.health_flags?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {s.health_flags.map((f: string, i: number) => (
                              <span key={i} className="text-[10px] bg-amber/20 text-amber-foreground px-1.5 py-0.5 rounded-full">{f.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmt(s.created_at)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activities">
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-3">
                {activities.length === 0 && <p className="text-center text-muted-foreground py-8">No activities logged yet. Start meditating! 🧘</p>}
                {activities.map((a) => (
                  <Card key={a.id} className="bg-card/80 border-border/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{a.activity_name || a.activity_type}</p>
                        <p className="text-xs text-muted-foreground">{a.duration_minutes} minutes</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(a.created_at)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="journal">
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-3">
                {journals.length === 0 && <p className="text-center text-muted-foreground py-8">No journal entries yet. Start reflecting! 📝</p>}
                {journals.map((j) => (
                  <Card key={j.id} className="bg-card/80 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{j.reflection || 'No reflection'}</p>
                          <p className="text-xs text-muted-foreground mt-1">Mood: {['😢', '😔', '😐', '🙂', '😊'][((j.mood || 3) - 1)]}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{fmt(j.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default History;
