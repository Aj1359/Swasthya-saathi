-- ============ VOICE MOOD SCANS ============
CREATE TABLE IF NOT EXISTS public.voice_mood_scans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood             TEXT NOT NULL,
  confidence       INT NOT NULL DEFAULT 0,
  transcript       TEXT,
  audio_features   JSONB,
  mental_state_indicators TEXT[] DEFAULT '{}',
  suggested_action TEXT,
  urgency          TEXT NOT NULL DEFAULT 'low',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voice_mood_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voice scans"
  ON public.voice_mood_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice scans"
  ON public.voice_mood_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice scans"
  ON public.voice_mood_scans FOR DELETE
  USING (auth.uid() = user_id);

-- ============ FACE SCANS — POSTURE FIELDS ============
ALTER TABLE public.face_scans
  ADD COLUMN IF NOT EXISTS posture_score    INT,
  ADD COLUMN IF NOT EXISTS posture_flags    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS posture_mode     BOOLEAN DEFAULT FALSE;

-- ============ PROFILES — PRIVACY PREFERENCES ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_memory_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS voice_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS streak_days            INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date     DATE;

-- ============ CHAT MESSAGES — user_id INDEX for memory lookups ============
CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx
  ON private.chat_messages_enc (user_id, created_at DESC);
