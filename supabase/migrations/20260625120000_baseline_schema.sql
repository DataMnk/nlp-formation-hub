-- Baseline schema snapshot for Supabase project efaiwykhkcovgeptivlh.
-- Captures the full public schema as of 2026-06-25 (structure only, no data).
-- Recreates from scratch: extension, tables, RLS, policies, function, indexes.

-- 1. Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tables (dependency order: programs → profiles / letters → letter_chunks)

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'::text,
  display_name text,
  phone text,
  city text,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  long_events_count integer NOT NULL DEFAULT 0,
  short_events_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);

CREATE TABLE public.letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  month_number integer NOT NULL,
  title text NOT NULL,
  content_md text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  comprehension_questions jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE public.letter_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  month_number integer,
  title text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.letter_chunks IS 'RAG knowledge base: chunked letter content with embeddings. Populated by ingest Edge Function.';

-- 3. Row Level Security
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_chunks ENABLE ROW LEVEL SECURITY;

-- 4. Policies (exact names and conditions from remote)

CREATE POLICY "Authenticated users can view active programs"
  ON public.programs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Members can view published letters of their program"
  ON public.letters
  FOR SELECT
  USING (
    is_published = true
    AND program_id = (
      SELECT profiles.program_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- letter_chunks: RLS enabled, no policies in remote

-- 5. RPC function
CREATE OR REPLACE FUNCTION public.match_letter_chunks(
  query_embedding vector,
  p_program_id uuid,
  match_limit integer DEFAULT 4
)
RETURNS TABLE (
  id uuid,
  letter_id uuid,
  program_id uuid,
  content text,
  month_number integer,
  title text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- 6. Indexes (non-primary-key; PK indexes are created with PRIMARY KEY constraints)
CREATE INDEX letter_chunks_program_id_idx ON public.letter_chunks USING btree (program_id);
CREATE INDEX letter_chunks_embedding_idx ON public.letter_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
