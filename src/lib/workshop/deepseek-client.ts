import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from "openai";

import { withBilingualJsonInstruction } from "@/lib/workshop/bilingual-prompt";
import { getToneInstruction } from "@/lib/workshop/tone";
import type { WorkshopTone } from "@/lib/workshop/types";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat" as const;
const REQUEST_TIMEOUT_MS = 20_000;
const JSON_ONLY_REMINDER =
  "Respond with valid JSON only. Do not include markdown fences or commentary.";

function requireDeepSeekApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is missing. Set it in .env.local and restart npm run dev.",
    );
  }
  return apiKey;
}

let deepseekClient: OpenAI | null = null;

/**
 * Lazy OpenAI SDK client pointed at DeepSeek.
 * OpenAI SDK v7 requires a non-empty apiKey at construction time.
 */
function getDeepSeekClient(): OpenAI {
  const apiKey = requireDeepSeekApiKey();
  if (!deepseekClient || deepseekClient.apiKey !== apiKey) {
    deepseekClient = new OpenAI({
      baseURL: DEEPSEEK_BASE_URL,
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }
  return deepseekClient;
}

export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

export type CallDeepSeekParams = {
  systemPrompt: string;
  userPrompt: string;
  model?: DeepSeekModel;
  jsonMode?: boolean;
  /** When set, appends a strong tone instruction to the system prompt. */
  tone?: WorkshopTone;
  /**
   * When true, appends BILINGUAL_JSON_INSTRUCTION so user-facing text fields
   * return { en, zhHant }. Use only for narrative actions — not structural guesses.
   */
  bilingualFields?: boolean;
};

function isRetryableNetworkError(error: unknown): boolean {
  if (error instanceof APIConnectionTimeoutError) {
    return true;
  }
  if (error instanceof APIConnectionError) {
    return true;
  }
  if (error instanceof APIError) {
    // Explicit API / HTTP errors from DeepSeek — do not retry.
    return false;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up")
    );
  }
  return false;
}

function buildSystemPrompt(
  systemPrompt: string,
  jsonMode: boolean,
  tone?: WorkshopTone,
  bilingualFields?: boolean,
): string {
  let built = systemPrompt.trim();
  if (bilingualFields) {
    built = withBilingualJsonInstruction(built);
  }
  if (tone) {
    built = `${built}\n\nTONE INSTRUCTION: ${getToneInstruction(tone)}`;
  }
  if (!jsonMode) {
    return built;
  }
  return `${built}\n\n${JSON_ONLY_REMINDER}`;
}

async function createCompletion(params: {
  systemPrompt: string;
  userPrompt: string;
  model: DeepSeekModel;
  jsonMode: boolean;
}): Promise<string> {
  const client = getDeepSeekClient();
  const completions = client.chat?.completions;
  if (!completions || typeof completions.create !== "function") {
    throw new Error(
      "DeepSeek client is not initialized correctly. Restart npm run dev and try again.",
    );
  }

  const response = await completions.create(
    {
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      ...(params.jsonMode
        ? { response_format: { type: "json_object" as const } }
        : {}),
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }
  return content;
}

/**
 * Single entry point for Workshop Pyramid Lab AI calls.
 * Retries once on network/timeout failures only — not on API errors.
 */
export async function callDeepSeek(
  params: CallDeepSeekParams,
): Promise<string> {
  const model = params.model ?? DEFAULT_MODEL;
  const jsonMode = params.jsonMode ?? false;
  const systemPrompt = buildSystemPrompt(
    params.systemPrompt,
    jsonMode,
    params.tone,
    params.bilingualFields,
  );
  const request = {
    systemPrompt,
    userPrompt: params.userPrompt,
    model,
    jsonMode,
  };

  try {
    return await createCompletion(request);
  } catch (error) {
    if (!isRetryableNetworkError(error)) {
      throw error;
    }
    return createCompletion(request);
  }
}
