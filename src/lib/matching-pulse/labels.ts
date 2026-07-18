import type {
  MatchingPulseCategoryValue,
  MatchingPulseRequestTypeValue,
  MatchingPulseStatusValue,
  MatchingPulseUrgencyValue,
} from "@/lib/matching-pulse/constants";
import {
  isMatchingPulseCategory,
  isMatchingPulseRequestType,
  isMatchingPulseStatus,
  isMatchingPulseUrgency,
} from "@/lib/matching-pulse/constants";

export const MATCHING_PULSE_REQUEST_TYPE_LABELS = {
  NEED_HELP: "I need help",
  OFFER_HELP: "I can offer help",
  PARTNERSHIP: "I want to partner",
} as const satisfies Record<MatchingPulseRequestTypeValue, string>;

export const MATCHING_PULSE_CATEGORY_LABELS = {
  CAREER: "Career",
  BUSINESS: "Business",
  CAPITAL: "Capital",
  NETWORKING: "Networking",
  OTHER: "Other",
} as const satisfies Record<MatchingPulseCategoryValue, string>;

export const MATCHING_PULSE_URGENCY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const satisfies Record<MatchingPulseUrgencyValue, string>;

export const MATCHING_PULSE_STATUS_LABELS = {
  NEW: "New",
  REVIEWING: "Reviewing",
  NEED_MORE_INFO: "Need more info",
  POTENTIAL_MATCH_FOUND: "Potential match found",
  INTRO_MADE: "Intro made",
  CLOSED: "Closed",
  REJECTED: "Rejected",
} as const satisfies Record<MatchingPulseStatusValue, string>;

export function formatMatchingPulseRequestTypeLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  if (isMatchingPulseRequestType(value)) {
    return MATCHING_PULSE_REQUEST_TYPE_LABELS[value];
  }
  return value;
}

export function formatMatchingPulseCategoryLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  if (isMatchingPulseCategory(value)) {
    return MATCHING_PULSE_CATEGORY_LABELS[value];
  }
  return value;
}

export function formatMatchingPulseUrgencyLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  if (isMatchingPulseUrgency(value)) {
    return MATCHING_PULSE_URGENCY_LABELS[value];
  }
  return value;
}

export function formatMatchingPulseStatusLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }
  if (isMatchingPulseStatus(value)) {
    return MATCHING_PULSE_STATUS_LABELS[value];
  }
  return value;
}
