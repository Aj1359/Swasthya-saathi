-- ============================================================================
-- V6: Add Knowledge Chunk Metadata Columns for JPA Schema Validation
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'knowledge_chunks' 
      AND table_type = 'BASE TABLE'
  ) THEN
    -- Add columns expected by JPA KnowledgeChunk model
    EXECUTE 'ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS title VARCHAR(255)';
    EXECUTE 'ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS category VARCHAR(100)';

    -- Add index on category
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category ON public.knowledge_chunks (category)';
  END IF;
END $$;
