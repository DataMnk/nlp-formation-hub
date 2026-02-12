/**
 * Phase 3: Supabase Edge Function for RAG chatbot.
 * Receives question + program_id. Auto-detects language, runs similarity search (pgvector),
 * returns refusal if no relevant context; otherwise strict RAG + LLM answer.
 * All OpenAI calls server-side. Structured JSON: success, error, message, [data].
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;
const MATCH_LIMIT = 4;

interface ChatRequestBody {
  question: string;
  program_id: string;
}

interface ChatResponse {
  success: boolean;
  error?: string;
  message?: string;
  letter_ids?: string[];
  letter_titles?: string[];
}

function detectLanguage(text: string): "es" | "en" {
  const t = text.trim().toLowerCase();
  const spanishIndicators = /[áéíóúñ¿¡]|(\b(que|como|donde|cuando|porque|este|esta|tienes|tiene|son|para|con|una|uno|sobre|muy|mas|pero|sus|del|las|los)\b)/i;
  if (spanishIndicators.test(t)) return "es";
  return "en";
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

function jsonResponse(body: ChatResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const NO_CONTEXT_REFUSAL_ES =
  "Solo puedo responder con base en el contenido de las cartas de formación. No encontré contenido relevante para tu pregunta. Por favor reformula o pregunta sobre otro tema incluido en las cartas.";
const NO_CONTEXT_REFUSAL_EN =
  "I can only answer based on the formation letters content. I didn't find relevant content for your question. Please rephrase or ask about something covered in the letters.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
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

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({
      success: false,
      error: "Invalid JSON body",
      message: "Expected { question: string, program_id: string }",
    }, 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const programId = typeof body.program_id === "string" ? body.program_id.trim() : "";

  if (!question || !programId) {
    return jsonResponse({
      success: false,
      error: "Missing required fields",
      message: "question and program_id are required",
    }, 400);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const lang = detectLanguage(question);
    const isSpanish = lang === "es";

    const queryEmbedding = await getEmbedding(question, openaiKey);
    const { data: chunks, error: rpcError } = await supabase.rpc("match_letter_chunks", {
      query_embedding: queryEmbedding,
      p_program_id: programId,
      match_limit: MATCH_LIMIT,
    });

    if (rpcError) {
      return jsonResponse({
        success: false,
        error: "Similarity search failed",
        message: rpcError.message,
      }, 500);
    }

    const rows = Array.isArray(chunks) ? chunks : [];
    if (rows.length === 0) {
      return jsonResponse({
        success: true,
        message: isSpanish ? NO_CONTEXT_REFUSAL_ES : NO_CONTEXT_REFUSAL_EN,
      });
    }

    const context = rows
      .map((r: { content?: string; title?: string; month_number?: number }) =>
        `[${r.title ?? "Letter"} - Month ${r.month_number ?? "?"}]\n${r.content ?? ""}`
      )
      .join("\n\n---\n\n");

    const letterIds = [...new Set(rows.map((r: { letter_id?: string }) => r.letter_id).filter(Boolean))] as string[];
    const letterTitles = [...new Set(rows.map((r: { title?: string }) => r.title).filter(Boolean))] as string[];

    const systemInstruction = isSpanish
      ? `Eres un asistente que responde ÚNICAMENTE con base en el siguiente contexto extraído de cartas de formación. No uses conocimiento externo. Si la respuesta no está en el contexto, di que no puedes responder con lo que tienes. Puedes hacer preguntas de seguimiento para ayudar al usuario a estudiar, y mencionar cartas futuras solo si esa información está en el contexto.\n\nContexto:\n${context}`
      : `You are an assistant that answers ONLY based on the following context from formation letters. Do not use external knowledge. If the answer is not in the context, say you cannot answer with what you have. You may ask follow-up questions to help the user study, and reference future letters only if that information is in the context.\n\nContext:\n${context}`;

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: question },
        ],
        max_tokens: 1024,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      return jsonResponse({
        success: false,
        error: "LLM failure",
        message: `OpenAI chat failed: ${chatRes.status} ${errText}`,
      }, 500);
    }

    const chatData = await chatRes.json();
    const answer = chatData?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return jsonResponse({
        success: false,
        error: "LLM failure",
        message: "Empty response from model",
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: answer,
      letter_ids: letterIds,
      letter_titles: letterTitles,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({
      success: false,
      error: "Chat failed",
      message: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});
