import { MATCHING_PULSE_FIELD_MAX } from "@/lib/matching-pulse/constants";

const DEFAULT_SOURCE = "direct";

/** Letters, numbers, underscore, hyphen only (max length enforced separately). */
const SOURCE_PATTERN = /^[A-Za-z0-9_-]+$/;

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function readSourceParam(searchParams: SearchParamsLike): string {
  if (!searchParams) {
    return "";
  }

  if (typeof (searchParams as URLSearchParams).get === "function") {
    return (searchParams as URLSearchParams).get("source") ?? "";
  }

  const value = (searchParams as Record<string, string | string[] | undefined>)
    .source;
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

/**
 * Validates / sanitizes a Matching Pulse attribution source.
 * Empty or invalid values fall back to `"direct"`.
 */
export function sanitizeMatchingPulseSource(
  raw: string | null | undefined,
): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return DEFAULT_SOURCE;
  }
  if (trimmed.length > MATCHING_PULSE_FIELD_MAX.source) {
    return DEFAULT_SOURCE;
  }
  if (!SOURCE_PATTERN.test(trimmed)) {
    return DEFAULT_SOURCE;
  }
  return trimmed;
}

/**
 * Safe initial `source` for the Matching Pulse create form.
 * Reads `?source=` when present; otherwise defaults to `"direct"`.
 */
export function getMatchingPulseRequestCreateInitialSource(
  searchParams: SearchParamsLike,
): string {
  return sanitizeMatchingPulseSource(readSourceParam(searchParams));
}

export const MATCHING_PULSE_DEFAULT_CREATE_SOURCE = DEFAULT_SOURCE;

/**
 * Request-form path that preserves a valid `?source=` from the landing URL.
 * Omits the query when source is absent, `"direct"`, or invalid.
 */
export function buildMatchingPulseRequestPath(
  searchParams: SearchParamsLike,
): string {
  const source = sanitizeMatchingPulseSource(readSourceParam(searchParams));
  if (source === DEFAULT_SOURCE) {
    return "/matching-pulse/request";
  }

  return `/matching-pulse/request?source=${encodeURIComponent(source)}`;
}

/** Event / workshop rollout copy when attribution starts with `wework`. */
export function isMatchingPulseWorkshopSource(source: string): boolean {
  return source.trim().toLowerCase().startsWith("wework");
}
