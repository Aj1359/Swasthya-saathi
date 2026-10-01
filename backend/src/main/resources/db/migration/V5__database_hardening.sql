-- ============================================================================
-- V5: Database Hardening Migration
-- 1. Chat indexing by (session_id, created_at DESC) and (user_id, created_at DESC)
-- 2. RAG Vector HNSW index using vector_cosine_ops for 768-dim embeddings
-- 3. Schema definition & indexes for journal_entries and activity_logs
-- 4. Foreign key index coverage for face_scans and voice_mood_scans
-- ============================================================================

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. CHAT MESSAGES INDEXES (Safe execution only if chat_messages is a base table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id_created_at ON public.chat_messages (session_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at ON public.chat_messages (user_id, created_at DESC)';
  END IF;
END $$;

-- 2. RAG VECTOR HNSW INDEX (768-dim Cosine Similarity Search)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'knowledge_chunks' 
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw ON public.knowledge_chunks USING hnsw (embedding vector_cosine_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category ON public.knowledge_chunks (category)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON public.knowledge_chunks (source)';
  END IF;
END $$;

-- 3. JOURNAL ENTRIES TABLE & INDEXES
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood             INTEGER NOT NULL DEFAULT 3,
  reflection       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_created_at
  ON public.journal_entries (user_id, created_at DESC);

-- 4. ACTIVITY LOGS TABLE & INDEXES
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type    VARCHAR(100) NOT NULL,
  activity_name    VARCHAR(255),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id_created_at
  ON public.activity_logs (user_id, created_at DESC);

-- 5. PHYSIOLOGICAL SCAN INDEXES
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'face_scans' 
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_face_scans_user_id_created_at ON public.face_scans (user_id, created_at DESC)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'voice_mood_scans' 
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_voice_mood_scans_user_id_created_at ON public.voice_mood_scans (user_id, created_at DESC)';
  END IF;
END $$;
