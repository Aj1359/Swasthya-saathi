-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  name                VARCHAR(255),
  gender              VARCHAR(50),
  age                 INTEGER,
  occupation          VARCHAR(100),
  country             VARCHAR(100),
  college_stressors   VARCHAR(100)[] DEFAULT '{}',
  happiness_index     INTEGER DEFAULT 70,
  health_index        INTEGER DEFAULT 70,
  chat_memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voice_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  last_activity_date  DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ FACE SCANS ============
CREATE TABLE IF NOT EXISTS public.face_scans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood             VARCHAR(50) NOT NULL,
  confidence       INTEGER NOT NULL DEFAULT 0,
  description      TEXT,
  wellness_tip     TEXT,
  health_flags     VARCHAR(100)[] DEFAULT '{}',
  posture_score    INTEGER,
  posture_flags    VARCHAR(100)[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ VOICE MOOD SCANS ============
CREATE TABLE IF NOT EXISTS public.voice_mood_scans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood             VARCHAR(50) NOT NULL,
  confidence       INTEGER NOT NULL DEFAULT 0,
  transcript       TEXT,
  audio_features   JSONB,
  mental_state_indicators VARCHAR(100)[] DEFAULT '{}',
  suggested_action TEXT,
  urgency          VARCHAR(50) NOT NULL DEFAULT 'low',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ CHAT MESSAGES ============
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       VARCHAR(255) NOT NULL,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role             VARCHAR(50) NOT NULL,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx
  ON private.chat_messages_enc (user_id, created_at DESC);

-- ============ KNOWLEDGE CHUNKS (RAG) ============
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source           VARCHAR(255) NOT NULL,
  content          TEXT NOT NULL,
  embedding        VECTOR(768), -- Matches standard Gemini embedding dimension (e.g. text-embedding-004)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

