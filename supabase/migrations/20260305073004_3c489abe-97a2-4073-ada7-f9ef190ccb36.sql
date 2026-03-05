
-- Peer replies table
CREATE TABLE public.peer_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.peer_posts(id) ON DELETE CASCADE,
  alias TEXT NOT NULL DEFAULT 'Anonymous',
  emoji TEXT NOT NULL DEFAULT '🌿',
  content TEXT NOT NULL,
  hearts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.peer_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies" ON public.peer_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can create replies" ON public.peer_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reply hearts" ON public.peer_replies FOR UPDATE USING (true) WITH CHECK (true);

-- Add trigger for handle_new_user if not exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
