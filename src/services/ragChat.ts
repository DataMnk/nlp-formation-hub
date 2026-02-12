/**
 * RAG chat service. Calls only the Supabase Edge Function.
 * No API keys in frontend. Uses session JWT for Authorization.
 */

import { SUPABASE_URL } from "../config";

export interface RagChatResponse {
  success: boolean;
  error?: string;
  message?: string;
  letter_ids?: string[];
  letter_titles?: string[];
}

export async function sendRagChatMessage(
  question: string,
  programId: string,
  accessToken: string
): Promise<RagChatResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/rag-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ question, program_id: programId }),
  });

  const data = (await res.json()) as RagChatResponse;
  if (!res.ok) {
    return {
      success: false,
      error: data.error ?? "Request failed",
      message: data.message ?? `HTTP ${res.status}`,
    };
  }
  return data;
}
