import { useState, useEffect } from 'react';
import { Users, Heart, Send, MessageSquare, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PeerPost {
  id: string;
  alias: string;
  emoji: string;
  content: string;
  category: string;
  hearts: number;
  created_at: string;
}

interface PeerReply {
  id: string;
  post_id: string;
  alias: string;
  emoji: string;
  content: string;
  hearts: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🌈' },
  { value: 'homesick', label: 'Homesick', icon: '🏠' },
  { value: 'stress', label: 'Stress', icon: '😰' },
  { value: 'lonely', label: 'Lonely', icon: '💙' },
  { value: 'wins', label: 'Wins', icon: '🎉' },
  { value: 'advice', label: 'Advice', icon: '💡' },
  { value: 'addiction', label: 'Addiction', icon: '🔗' },
  { value: 'sexuality', label: 'Sexuality', icon: '🌈' },
  { value: 'abuse', label: 'Abuse & Trauma', icon: '🛡️' },
  { value: 'self-harm', label: 'Self-Harm', icon: '🆘' },
  { value: 'body-image', label: 'Body Image', icon: '🪞' },
  { value: 'grief', label: 'Grief & Loss', icon: '🕊️' },
];

const RANDOM_ALIASES = [
  'Brave Soul', 'Kind Heart', 'Gentle Spirit', 'Hopeful Mind', 'Quiet Warrior',
  'Dreamer', 'Stargazer', 'Moon Child', 'Sunshine', 'River Flow',
];
const RANDOM_EMOJIS = ['🌸', '🌻', '🌿', '🦋', '✨', '🌙', '☘️', '🍀', '💫', '🕊️'];

const PeerSupport = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PeerPost[]>([]);
  const [replies, setReplies] = useState<Record<string, PeerReply[]>>({});
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('stress');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hearted, setHearted] = useState<Set<string>>(new Set());
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
    const stored = localStorage.getItem('swasthyasaathi_hearted');
    if (stored) setHearted(new Set(JSON.parse(stored)));
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('peer_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data);
  };

  const fetchReplies = async (postId: string) => {
    const { data } = await supabase
      .from('peer_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setReplies(prev => ({ ...prev, [postId]: data }));
  };

  const toggleExpand = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!replies[postId]) fetchReplies(postId);
    }
  };

  const submitPost = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast({ title: "Write a bit more 🌿", description: "Share at least a couple of sentences." });
      return;
    }
    setLoading(true);
    const alias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
    const emoji = RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
    const { error } = await supabase.from('peer_posts').insert({
      alias, emoji, content: content.trim().slice(0, 1000), category,
    });
    if (!error) {
      setContent('');
      toast({ title: "Shared anonymously 💚", description: "Your voice matters." });
      fetchPosts();
    }
    setLoading(false);
  };

  const submitReply = async (postId: string) => {
    const text = replyContent[postId]?.trim();
    if (!text || text.length < 3) return;
    const alias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
    const emoji = RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
    const { error } = await supabase.from('peer_replies').insert({
      post_id: postId, alias, emoji, content: text.slice(0, 500),
    });
    if (!error) {
      setReplyContent(prev => ({ ...prev, [postId]: '' }));
      fetchReplies(postId);
      toast({ title: "Reply sent 💚" });
    }
  };

  const heartPost = async (postId: string) => {
    if (hearted.has(postId)) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const newHearted = new Set(hearted).add(postId);
    setHearted(newHearted);
    localStorage.setItem('swasthyasaathi_hearted', JSON.stringify([...newHearted]));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hearts: p.hearts + 1 } : p));
    await supabase.from('peer_posts').update({ hearts: post.hearts + 1 }).eq('id', postId);
  };

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.category === filter);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-sky/30 via-primary/10 to-lavender/20 pb-4">
        <CardTitle className="font-display text-xl flex items-center gap-2 text-foreground">
          <Users className="w-5 h-5 text-sky-foreground" />
          Anonymous Peer Support
        </CardTitle>
        <p className="text-sm text-muted-foreground">You're not alone. Share anonymously, support each other. 💚</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Compose */}
        <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            Share how you feel (completely anonymous)
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write what's on your heart... no one will know it's you 🌿"
            className="min-h-[80px] bg-background/60 border-border/40 rounded-xl resize-none"
            maxLength={1000}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <Button onClick={submitPost} disabled={loading || !content.trim()} className="w-full rounded-xl bg-gradient-to-r from-sky to-primary text-primary-foreground">
            <Send className="w-4 h-4 mr-2" />Share Anonymously
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === cat.value ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No posts yet. Be the first to share! 🌿</p>
              </div>
            )}
            {filtered.map((post) => (
              <div key={post.id} className="p-4 rounded-2xl bg-muted/30 border border-border/30 space-y-2 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{post.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{post.alias}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{post.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => heartPost(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-all ${
                      hearted.has(post.id) ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hearted.has(post.id) ? 'fill-current' : ''}`} />
                    <span>{post.hearts}</span>
                  </button>
                  <button onClick={() => toggleExpand(post.id)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply</span>
                    {expandedPost === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Replies section */}
                {expandedPost === post.id && (
                  <div className="mt-2 pl-4 border-l-2 border-primary/20 space-y-2">
                    {(replies[post.id] || []).map((r) => (
                      <div key={r.id} className="p-2 rounded-lg bg-background/50 text-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span>{r.emoji}</span>
                          <span className="font-medium text-xs text-foreground">{r.alias}</span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                        </div>
                        <p className="text-foreground/80 text-xs">{r.content}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={replyContent[post.id] || ''}
                        onChange={(e) => setReplyContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a supportive reply..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground"
                        maxLength={500}
                      />
                      <Button size="sm" variant="ghost" onClick={() => submitReply(post.id)} className="h-8 px-3 text-primary">
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PeerSupport;
