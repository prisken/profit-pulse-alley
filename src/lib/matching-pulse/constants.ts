/**
 * Matching Pulse shared constants.
 * Safe for import from client and server (no Prisma).
 * Values must stay aligned with prisma/schema.prisma enums.
 */

export const MATCHING_PULSE_REQUEST_TYPES = [
  "NEED_HELP",
  "OFFER_HELP",
  "PARTNERSHIP",
] as const;

export type MatchingPulseRequestTypeValue =
  (typeof MATCHING_PULSE_REQUEST_TYPES)[number];

export const MATCHING_PULSE_CATEGORIES = [
  "CAREER",
  "BUSINESS",
  "CAPITAL",
  "NETWORKING",
  "OTHER",
] as const;

export type MatchingPulseCategoryValue =
  (typeof MATCHING_PULSE_CATEGORIES)[number];

export const MATCHING_PULSE_URGENCIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type MatchingPulseUrgencyValue =
  (typeof MATCHING_PULSE_URGENCIES)[number];

export const MATCHING_PULSE_STATUSES = [
  "NEW",
  "REVIEWING",
  "NEED_MORE_INFO",
  "POTENTIAL_MATCH_FOUND",
  "INTRO_MADE",
  "CLOSED",
  "REJECTED",
] as const;

export type MatchingPulseStatusValue =
  (typeof MATCHING_PULSE_STATUSES)[number];

export const MATCHING_PULSE_DEFAULT_STATUS: MatchingPulseStatusValue = "NEW";

const REQUEST_TYPE_SET = new Set<string>(MATCHING_PULSE_REQUEST_TYPES);
const CATEGORY_SET = new Set<string>(MATCHING_PULSE_CATEGORIES);
const URGENCY_SET = new Set<string>(MATCHING_PULSE_URGENCIES);
const STATUS_SET = new Set<string>(MATCHING_PULSE_STATUSES);

export function isMatchingPulseRequestType(
  value: string,
): value is MatchingPulseRequestTypeValue {
  return REQUEST_TYPE_SET.has(value);
}

export function isMatchingPulseCategory(
  value: string,
): value is MatchingPulseCategoryValue {
  return CATEGORY_SET.has(value);
}

export function isMatchingPulseUrgency(
  value: string,
): value is MatchingPulseUrgencyValue {
  return URGENCY_SET.has(value);
}

export function isMatchingPulseStatus(
  value: string,
): value is MatchingPulseStatusValue {
  return STATUS_SET.has(value);
}

/** Form option lists for selects. */
export const MATCHING_PULSE_REQUEST_TYPE_OPTIONS = MATCHING_PULSE_REQUEST_TYPES.map(
  (value) => ({ value }),
);

export const MATCHING_PULSE_CATEGORY_OPTIONS = MATCHING_PULSE_CATEGORIES.map(
  (value) => ({ value }),
);

export const MATCHING_PULSE_URGENCY_OPTIONS = MATCHING_PULSE_URGENCIES.map(
  (value) => ({ value }),
);

export const MATCHING_PULSE_STATUS_OPTIONS = MATCHING_PULSE_STATUSES.map(
  (value) => ({ value }),
);

export const MATCHING_PULSE_FIELD_MAX = {
  title: 120,
  company: 120,
  roleTitle: 120,
  contactPhone: 80,
  contactMethod: 80,
  description: 2000,
  idealMatch: 1000,
  source: 120,
  adminNotes: 5000,
  tags: 500,
} as const;
