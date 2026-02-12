-- Phase 1: RAG data layer using pgvector
-- Does not modify any existing tables. All RAG data lives in new table letter_chunks.

-- Enable pgvector extension (required for embedding column)
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG table: chunks from letters.content_md with precomputed embeddings.
-- letter_id and program_id reference existing tables (read-only from this migration).
-- Embeddings are never stored in the letters table.
CREATE TABLE IF NOT EXISTS letter_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  month_number integer,
  title text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast similarity search filtered by program_id
CREATE INDEX IF NOT EXISTS letter_chunks_program_id_idx ON letter_chunks(program_id);
-- IVFFlat index for cosine similarity. If this fails on empty table, run after ingest-letters.
CREATE INDEX IF NOT EXISTS letter_chunks_embedding_idx ON letter_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Similarity search: cosine similarity, filter by program_id, return top k chunks.
-- Used by the RAG chat Edge Function. Query embedding is passed from the function.
CREATE OR REPLACE FUNCTION match_letter_chunks(
  query_embedding vector(1536),
  p_program_id uuid,
  match_limit int DEFAULT 4
)
RETURNS TABLE (
  id uuid,
  letter_id uuid,
  program_id uuid,
  content text,
  month_number integer,
  title text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id,
    lc.letter_id,
    lc.program_id,
    lc.content,
    lc.month_number,
    lc.title,
    1 - (lc.embedding <=> query_embedding) AS similarity
  FROM letter_chunks lc
  WHERE lc.program_id = p_program_id
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

COMMENT ON TABLE letter_chunks IS 'RAG knowledge base: chunked letter content with embeddings. Populated by ingest Edge Function.';
