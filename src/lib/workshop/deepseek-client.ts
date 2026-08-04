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

/** Per-attempt SDK timeout — bilingual JSON completions often need >20s. */
export const REQUEST_TIMEOUT_MS = 45_000;

/** Total createCompletion attempts (includes the first try). */
export const MAX_COMPLETION_ATTEMPTS = 3;

const JSON_ONLY_REMINDER =
  "Respond with valid JSON only. Do not include markdown fences or commentary.";

const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);

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
      maxRetries: 0, // we own retry / backoff below
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

/** Strip ```json … ``` fences some models still emit despite json_object mode. */
export function stripMarkdownJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Errors worth another attempt: timeouts, connection drops, rate limits, 5xx,
 * empty model content. Explicit 4xx (except 408/429) are not retried.
 */
export function isRetryableDeepSeekError(error: unknown): boolean {
  if (error instanceof APIConnectionTimeoutError) {
    return true;
  }
  if (error instanceof APIConnectionError) {
    return true;
  }
  if (error instanceof APIError) {
    const status = error.status;
    return typeof status === "number" && RETRYABLE_HTTP_STATUS.has(status);
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up") ||
      message.includes("empty response") ||
      message.includes("overloaded") ||
      message.includes("rate limit") ||
      message.includes("temporarily unavailable")
    );
  }
  return false;
}

/** Exponential backoff with light jitter: ~400ms, ~1200ms, … */
export function retryBackoffMs(attemptIndex: number): number {
  const base = 400 * 3 ** attemptIndex;
  const jitter = Math.floor(Math.random() * 200);
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  return stripMarkdownJsonFence(content);
}

/**
 * Single entry point for Workshop Pyramid Lab AI calls.
 * Retries on network/timeout, 429, and transient 5xx (with backoff).
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

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_COMPLETION_ATTEMPTS; attempt++) {
    try {
      return await createCompletion(request);
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < MAX_COMPLETION_ATTEMPTS - 1 &&
        isRetryableDeepSeekError(error);
      if (!canRetry) {
        throw error;
      }
      const delay = retryBackoffMs(attempt);
      console.warn(
        `[workshop/deepseek] attempt ${attempt + 1}/${MAX_COMPLETION_ATTEMPTS} failed (${error instanceof Error ? error.message : "unknown"}); retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("DeepSeek request failed after retries.");
}

/**
 * Call DeepSeek then parse. Retries the full call when the model returns
 * unusable JSON / schema (common intermittent bilingual failures).
 */
export async function callDeepSeekParsed<T>(
  params: CallDeepSeekParams,
  parse: (raw: string) => T,
  options?: { maxParseAttempts?: number },
): Promise<T> {
  const maxParseAttempts = options?.maxParseAttempts ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxParseAttempts; attempt++) {
    try {
      const raw = await callDeepSeek(params);
      return parse(raw);
    } catch (error) {
      lastError = error;
      if (!isTransientWorkshopAiError(error)) {
        throw error;
      }
      if (attempt >= maxParseAttempts - 1) {
        break;
      }
      const delay = retryBackoffMs(attempt);
      console.warn(
        `[workshop/deepseek] parse attempt ${attempt + 1}/${maxParseAttempts} failed (${error instanceof Error ? error.message : "unknown"}); re-requesting`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("DeepSeek parse failed after retries.");
}

/** True when another model call might succeed (not config / auth / schema bugs). */
export function isTransientWorkshopAiError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }
  const message = error.message;
  if (message.includes("DEEPSEEK_API_KEY")) {
    return false;
  }
  if (
    message.includes("out of date") ||
    message.includes("prisma generate") ||
    message.includes("Workshop database models")
  ) {
    return false;
  }
  if (message.includes("Session ID is required")) {
    return false;
  }
  if (message.includes("not initialized correctly")) {
    return false;
  }
  return true;
}
