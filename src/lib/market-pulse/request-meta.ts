import { createHash } from "node:crypto";

export type MarketPulseRequestMeta = {
  ipHash: string | null;
  userAgentHash: string | null;
};

export function hashRequestMeta(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
}

export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return headers.get("x-real-ip")?.trim() || null;
}

export function getRequestMetaFromHeaders(
  headers: Headers,
): MarketPulseRequestMeta {
  return {
    ipHash: hashRequestMeta(getClientIpFromHeaders(headers)),
    userAgentHash: hashRequestMeta(headers.get("user-agent")),
  };
}
