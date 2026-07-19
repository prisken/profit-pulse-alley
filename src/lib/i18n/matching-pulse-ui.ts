import type { SiteLocale } from "@/lib/i18n/locales";
import {
  translate,
  translateWith,
  type MessageKey,
} from "@/lib/i18n/messages";
import type {
  MatchingPulseCategoryValue,
  MatchingPulseRequestTypeValue,
  MatchingPulseUrgencyValue,
} from "@/lib/matching-pulse/constants";
import { MATCHING_PULSE_FIELD_MAX } from "@/lib/matching-pulse/constants";

const ERROR_KEY_BY_MESSAGE: Record<string, MessageKey> = {
  "Title is required.": "matchingPulse.error.titleRequired",
  [`Title must be ${MATCHING_PULSE_FIELD_MAX.title} characters or fewer.`]:
    "matchingPulse.error.titleMax",
  "Request type is required.": "matchingPulse.error.requestTypeRequired",
  "Select a valid request type.": "matchingPulse.error.requestTypeInvalid",
  "Category is required.": "matchingPulse.error.categoryRequired",
  "Select a valid category.": "matchingPulse.error.categoryInvalid",
  "Description is required.": "matchingPulse.error.descriptionRequired",
  [`Description must be ${MATCHING_PULSE_FIELD_MAX.description} characters or fewer.`]:
    "matchingPulse.error.descriptionMax",
  "Select a valid urgency.": "matchingPulse.error.urgencyInvalid",
  "You must agree to be contacted about this request.":
    "matchingPulse.error.consentRequired",
  "Please fix the highlighted fields and try again.":
    "matchingPulse.error.formFix",
  "Could not submit your request. Please try again.":
    "matchingPulse.error.submitFailed",
};

const MAX_LENGTH_ERROR_RE = /^Must be (\d+) characters or fewer\.$/;
const TITLE_MAX_ERROR_RE = /^Title must be (\d+) characters or fewer\.$/;
const DESCRIPTION_MAX_ERROR_RE =
  /^Description must be (\d+) characters or fewer\.$/;

export const MATCHING_PULSE_REQUEST_TYPE_MESSAGE_KEYS = {
  NEED_HELP: "matchingPulse.requestType.NEED_HELP",
  OFFER_HELP: "matchingPulse.requestType.OFFER_HELP",
  PARTNERSHIP: "matchingPulse.requestType.PARTNERSHIP",
} as const satisfies Record<MatchingPulseRequestTypeValue, MessageKey>;

export const MATCHING_PULSE_CATEGORY_MESSAGE_KEYS = {
  CAREER: "matchingPulse.category.CAREER",
  BUSINESS: "matchingPulse.category.BUSINESS",
  CAPITAL: "matchingPulse.category.CAPITAL",
  NETWORKING: "matchingPulse.category.NETWORKING",
  OTHER: "matchingPulse.category.OTHER",
} as const satisfies Record<MatchingPulseCategoryValue, MessageKey>;

export const MATCHING_PULSE_URGENCY_MESSAGE_KEYS = {
  LOW: "matchingPulse.urgency.LOW",
  MEDIUM: "matchingPulse.urgency.MEDIUM",
  HIGH: "matchingPulse.urgency.HIGH",
} as const satisfies Record<MatchingPulseUrgencyValue, MessageKey>;

export function translateMatchingPulseError(
  locale: SiteLocale,
  error: string,
): string {
  const exact = ERROR_KEY_BY_MESSAGE[error];
  if (exact === "matchingPulse.error.titleMax") {
    return translateWith(locale, exact, {
      max: MATCHING_PULSE_FIELD_MAX.title,
    });
  }
  if (exact === "matchingPulse.error.descriptionMax") {
    return translateWith(locale, exact, {
      max: MATCHING_PULSE_FIELD_MAX.description,
    });
  }
  if (exact) {
    return translate(locale, exact);
  }

  const maxLengthMatch = error.match(MAX_LENGTH_ERROR_RE);
  if (maxLengthMatch) {
    return translateWith(locale, "matchingPulse.error.maxLength", {
      max: maxLengthMatch[1] ?? "",
    });
  }

  const titleMaxMatch = error.match(TITLE_MAX_ERROR_RE);
  if (titleMaxMatch) {
    return translateWith(locale, "matchingPulse.error.titleMax", {
      max: titleMaxMatch[1] ?? "",
    });
  }

  const descriptionMaxMatch = error.match(DESCRIPTION_MAX_ERROR_RE);
  if (descriptionMaxMatch) {
    return translateWith(locale, "matchingPulse.error.descriptionMax", {
      max: descriptionMaxMatch[1] ?? "",
    });
  }

  return error;
}
