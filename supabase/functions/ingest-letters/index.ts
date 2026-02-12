/**
 * Phase 2: Supabase Edge Function for embeddings and ingestion.
 * Reads published letters from letters table, chunks content_md (paragraph/section),
 * calls OpenAI Embeddings API, inserts chunks + embeddings into letter_chunks.
 * Used for initial seeding and re-indexing. All API keys from Supabase env.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;
const MAX_CHUNK_CHARS = 500;
const MIN_CHUNK_CHARS = 50;

interface LetterRow {
  id: string;
  program_id: string;
  month_number: number;
  title: string | null;
  content_md: string;
}

interface IngestResponse {
  success: boolean;
  error?: string;
  message?: string;
  letters_processed?: number;
  chunks_inserted?: number;
}

function chunkByParagraphsAndSections(text: string): string[] {
  if (!text || !text.trim()) return [];
  const chunks: string[] = [];
  // Split by double newline (paragraphs) or markdown headers (## or ###)
  const sections = text.split(/(?:\n\s*\n|\n##\s|\n###\s)/).map((s) => s.trim()).filter(Boolean);
  for (const section of sections) {
    if (section.length <= MAX_CHUNK_CHARS) {
      if (section.length >= MIN_CHUNK_CHARS) chunks.push(section);
      else if (chunks.length && chunks[chunks.length - 1].length + section.length + 2 <= MAX_CHUNK_CHARS) {
        chunks[chunks.length - 1] = chunks[chunks.length - 1] + "\n\n" + section;
      } else if (section.length > 0) chunks.push(section);
    } else {
      // Split long section by sentences or by size
      const sentences = section.split(/(?<=[.!?])\s+/).filter(Boolean);
      let current = "";
      for (const sent of sentences) {
        if (current.length + sent.length + 1 <= MAX_CHUNK_CHARS) {
          current = current ? current + " " + sent : sent;
        } else {
          if (current.length >= MIN_CHUNK_CHARS) chunks.push(current);
          current = sent;
        }
      }
      if (current.trim().length >= MIN_CHUNK_CHARS) chunks.push(current.trim());
    }
  }
  return chunks.filter((c) => c.length >= MIN_CHUNK_CHARS);
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error("Invalid embedding response from OpenAI");
  }
  return embedding;
}

function jsonResponse(body: IngestResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!openaiKey || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({
      success: false,
      error: "Server configuration error: missing OPENAI_API_KEY or Supabase env",
    }, 500);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: letters, error: fetchError } = await supabase
      .from("letters")
      .select("id, program_id, month_number, title, content_md")
      .eq("is_published", true)
      .not("content_md", "is", null);

    if (fetchError) {
      return jsonResponse({
        success: false,
        error: "Failed to fetch letters",
        message: fetchError.message,
      }, 500);
    }

    const rows = (letters ?? []) as LetterRow[];
    let totalChunks = 0;

    for (const letter of rows) {
      const content = letter.content_md ?? "";
      const chunks = chunkByParagraphsAndSections(content);
      if (chunks.length === 0) continue;

      // Delete existing chunks for this letter (re-index replaces)
      await supabase.from("letter_chunks").delete().eq("letter_id", letter.id);

      for (const contentChunk of chunks) {
        try {
          const embedding = await getEmbedding(contentChunk, openaiKey);
          const { error: insertError } = await supabase.from("letter_chunks").insert({
            letter_id: letter.id,
            program_id: letter.program_id,
            content: contentChunk,
            embedding,
            month_number: letter.month_number,
            title: letter.title,
          });
          if (insertError) {
            console.error("Insert error for letter", letter.id, insertError);
            return jsonResponse({
              success: false,
              error: "Embedding generation or insert failure",
              message: insertError.message,
            }, 500);
          }
          totalChunks += 1;
        } catch (e) {
          console.error("Embedding error", e);
          return jsonResponse({
            success: false,
            error: "Embedding generation failure",
            message: e instanceof Error ? e.message : String(e),
          }, 500);
        }
      }
    }

    return jsonResponse({
      success: true,
      message: "Ingest completed",
      letters_processed: rows.length,
      chunks_inserted: totalChunks,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({
      success: false,
      error: "Ingest failed",
      message: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});
