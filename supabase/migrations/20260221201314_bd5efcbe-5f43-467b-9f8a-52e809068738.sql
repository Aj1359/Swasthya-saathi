
-- Anonymous peer support posts
CREATE TABLE public.peer_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias TEXT NOT NULL DEFAULT 'Anonymous',
  emoji TEXT NOT NULL DEFAULT '🌿',
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  hearts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peer_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts (anonymous feature)
CREATE POLICY "Anyone can read peer posts" ON public.peer_posts
  FOR SELECT USING (true);

-- Anyone can insert posts (anonymous feature)
CREATE POLICY "Anyone can create peer posts" ON public.peer_posts
  FOR INSERT WITH CHECK (true);

-- Anyone can update hearts (for the heart/support button)
CREATE POLICY "Anyone can update hearts" ON public.peer_posts
  FOR UPDATE USING (true) WITH CHECK (true);
