import { createClient, type VercelKV } from "@vercel/kv";

/**
 * Vercel KV / Upstash Redis REST client for Game Master settings.
 *
 * Requires env vars (auto-injected when you add Redis via Vercel → Storage):
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 *
 * @see https://vercel.com/docs/redis
 */
let kvInstance: VercelKV | null = null;

export function isKvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

/** Returns the KV client, or null if env vars are missing (e.g. local dev without Redis). */
export function getKv(): VercelKV | null {
  if (!isKvConfigured()) {
    return null;
  }
  if (!kvInstance) {
    kvInstance = createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return kvInstance;
}
