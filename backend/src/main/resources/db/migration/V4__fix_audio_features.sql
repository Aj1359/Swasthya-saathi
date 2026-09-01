-- Change audio_features column type from jsonb to TEXT to support standard String binding in Hibernate without casting issues
ALTER TABLE public.voice_mood_scans ALTER COLUMN audio_features TYPE TEXT;
