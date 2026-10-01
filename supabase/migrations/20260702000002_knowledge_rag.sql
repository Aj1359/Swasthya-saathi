-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure public.knowledge_chunks table exists with vector(768)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category         VARCHAR(100),
  title            VARCHAR(255),
  content          TEXT NOT NULL,
  tags             TEXT[],
  source           VARCHAR(255) NOT NULL,
  embedding        VECTOR(768),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure HNSW index exists on knowledge_chunks embedding for fast cosine similarity lookup
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
  ON public.knowledge_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Create or replace matching function for vector similarity search (768-dim)
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  tags text[],
  source text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.category,
    kc.title,
    kc.content,
    kc.tags,
    kc.source,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

