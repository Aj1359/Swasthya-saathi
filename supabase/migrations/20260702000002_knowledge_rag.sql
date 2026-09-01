-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column for 3072 dimensions (gemini-embedding-001)
ALTER TABLE public.knowledge_documents
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- Create matching function for vector similarity search
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(3072),
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
    kd.id,
    kd.category,
    kd.title,
    kd.content,
    kd.tags,
    kd.source,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_documents kd
  WHERE 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
