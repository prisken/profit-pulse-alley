import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 1 as const;
/** Unsubscribe links expire after 90 days. */
export const UNSUBSCRIBE_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type UnsubscribeTokenCreateInput = {
  userId: string;
  email: string;
  /** Override now (tests). */
  now?: Date;
  /** Override TTL (tests). */
  ttlMs?: number;
};

export type UnsubscribeTokenPayload = {
  v: typeof TOKEN_VERSION;
  /** User id — opaque cuid, not an email. */
  uid: string;
  /** SHA-256 hex of normalized email (non-reversible binding). */
  eh: string;
  /** Expiry unix seconds. */
  exp: number;
};

export type VerifyUnsubscribeTokenResult =
  | { ok: true; userId: string; emailHash: string; expiresAt: Date }
  | {
      ok: false;
      reason:
        | "missing_secret"
        | "malformed"
        | "bad_signature"
        | "expired"
        | "invalid_payload";
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmailForUnsubscribeToken(email: string): string {
  return createHash("sha256")
    .update(normalizeEmail(email), "utf8")
    .digest("hex");
}

export function resolveUnsubscribeSigningSecret(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const dedicated = env.EMAIL_UNSUBSCRIBE_SECRET?.trim();
  if (dedicated) {
    return dedicated;
  }
  const auth = env.AUTH_SECRET?.trim();
  return auth || null;
}

function base64UrlEncode(value: string | Buffer): string {
  const buf = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToString(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    return Buffer.from(padded + "=".repeat(padLength), "base64").toString(
      "utf8",
    );
  } catch {
    return null;
  }
}

function signingInput(payload: UnsubscribeTokenPayload): string {
  return `${payload.v}.${payload.uid}.${payload.eh}.${payload.exp}`;
}

function signPayload(
  payload: UnsubscribeTokenPayload,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(signingInput(payload), "utf8")
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Create a signed unsubscribe token. Does not store tokens in the DB.
 * Payload never includes the raw email — only a one-way hash.
 */
export function createUnsubscribeToken(
  input: UnsubscribeTokenCreateInput,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const secret = resolveUnsubscribeSigningSecret(env);
  if (!secret) {
    throw new Error(
      "Unsubscribe signing secret is not configured (EMAIL_UNSUBSCRIBE_SECRET or AUTH_SECRET).",
    );
  }

  const userId = input.userId.trim();
  const email = input.email.trim();
  if (!userId || !email) {
    throw new Error("userId and email are required to create an unsubscribe token.");
  }

  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? UNSUBSCRIBE_TOKEN_TTL_MS;
  const payload: UnsubscribeTokenPayload = {
    v: TOKEN_VERSION,
    uid: userId,
    eh: hashEmailForUnsubscribeToken(email),
    exp: Math.floor((now.getTime() + ttlMs) / 1000),
  };

  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payload, secret);
  return `${body}.${signature}`;
}

export function verifyUnsubscribeToken(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): VerifyUnsubscribeTokenResult {
  const secret = resolveUnsubscribeSigningSecret(env);
  if (!secret) {
    return { ok: false, reason: "missing_secret" };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, reason: "malformed" };
  }

  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return { ok: false, reason: "malformed" };
  }

  const body = trimmed.slice(0, lastDot);
  const signature = trimmed.slice(lastDot + 1);
  const json = base64UrlDecodeToString(body);
  if (!json) {
    return { ok: false, reason: "malformed" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as UnsubscribeTokenPayload).v !== TOKEN_VERSION ||
    typeof (parsed as UnsubscribeTokenPayload).uid !== "string" ||
    typeof (parsed as UnsubscribeTokenPayload).eh !== "string" ||
    typeof (parsed as UnsubscribeTokenPayload).exp !== "number"
  ) {
    return { ok: false, reason: "invalid_payload" };
  }

  const payload = parsed as UnsubscribeTokenPayload;
  if (!payload.uid.trim() || !/^[a-f0-9]{64}$/i.test(payload.eh)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const expected = signPayload(payload, secret);
  if (!safeEqual(expected, signature)) {
    return { ok: false, reason: "bad_signature" };
  }

  if (payload.exp * 1000 <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    userId: payload.uid,
    emailHash: payload.eh,
    expiresAt: new Date(payload.exp * 1000),
  };
}
