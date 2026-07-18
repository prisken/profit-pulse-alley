import {
  isMatchingPulseCategory,
  isMatchingPulseRequestType,
  isMatchingPulseUrgency,
  MATCHING_PULSE_FIELD_MAX,
} from "@/lib/matching-pulse/constants";
import { sanitizeMatchingPulseSource } from "@/lib/matching-pulse/create-source";
import type {
  MatchingPulseRequestCreateData,
  MatchingPulseRequestFieldErrors,
  MatchingPulseRequestFormInput,
  MatchingPulseValidationResult,
} from "@/lib/matching-pulse/types";

function asTrimmedString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).trim();
  }
  return "";
}

function optionalTrimmed(
  value: unknown,
  maxLength: number,
  field: keyof MatchingPulseRequestFieldErrors,
  errors: MatchingPulseRequestFieldErrors,
): string | null {
  const trimmed = asTrimmedString(value);
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    errors[field] = `Must be ${maxLength} characters or fewer.`;
    return null;
  }
  return trimmed;
}

function parseConsentFlag(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "on" ||
      normalized === "1" ||
      normalized === "yes"
    );
  }
  return false;
}

/**
 * Validates Matching Pulse request creation form data.
 * Independent of React / FormData — pass a plain object.
 */
export function validateMatchingPulseRequestCreate(
  input: MatchingPulseRequestFormInput,
): MatchingPulseValidationResult {
  const fieldErrors: MatchingPulseRequestFieldErrors = {};

  const title = asTrimmedString(input.title);
  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > MATCHING_PULSE_FIELD_MAX.title) {
    fieldErrors.title = `Title must be ${MATCHING_PULSE_FIELD_MAX.title} characters or fewer.`;
  }

  const requestTypeRaw = asTrimmedString(input.requestType);
  if (!requestTypeRaw) {
    fieldErrors.requestType = "Request type is required.";
  } else if (!isMatchingPulseRequestType(requestTypeRaw)) {
    fieldErrors.requestType = "Select a valid request type.";
  }

  const categoryRaw = asTrimmedString(input.category);
  if (!categoryRaw) {
    fieldErrors.category = "Category is required.";
  } else if (!isMatchingPulseCategory(categoryRaw)) {
    fieldErrors.category = "Select a valid category.";
  }

  const description = asTrimmedString(input.description);
  if (!description) {
    fieldErrors.description = "Description is required.";
  } else if (description.length > MATCHING_PULSE_FIELD_MAX.description) {
    fieldErrors.description = `Description must be ${MATCHING_PULSE_FIELD_MAX.description} characters or fewer.`;
  }

  const company = optionalTrimmed(
    input.company,
    MATCHING_PULSE_FIELD_MAX.company,
    "company",
    fieldErrors,
  );
  const roleTitle = optionalTrimmed(
    input.roleTitle,
    MATCHING_PULSE_FIELD_MAX.roleTitle,
    "roleTitle",
    fieldErrors,
  );
  const contactPhone = optionalTrimmed(
    input.contactPhone,
    MATCHING_PULSE_FIELD_MAX.contactPhone,
    "contactPhone",
    fieldErrors,
  );
  const contactMethod = optionalTrimmed(
    input.contactMethod,
    MATCHING_PULSE_FIELD_MAX.contactMethod,
    "contactMethod",
    fieldErrors,
  );
  const idealMatch = optionalTrimmed(
    input.idealMatch,
    MATCHING_PULSE_FIELD_MAX.idealMatch,
    "idealMatch",
    fieldErrors,
  );
  // Attribution source: sanitize to safe slug or "direct" (never reject the form).
  const source = sanitizeMatchingPulseSource(asTrimmedString(input.source));

  let urgency: MatchingPulseRequestCreateData["urgency"] = null;
  const urgencyRaw = asTrimmedString(input.urgency);
  if (urgencyRaw) {
    if (!isMatchingPulseUrgency(urgencyRaw)) {
      fieldErrors.urgency = "Select a valid urgency.";
    } else {
      urgency = urgencyRaw;
    }
  }

  const consentToContact = parseConsentFlag(input.consentToContact);
  if (!consentToContact) {
    fieldErrors.consentToContact =
      "You must agree to be contacted about this request.";
  }

  const consentToShare = parseConsentFlag(input.consentToShare);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
      formError: "Please fix the highlighted fields and try again.",
    };
  }

  const data: MatchingPulseRequestCreateData = {
    title,
    company,
    roleTitle,
    contactPhone,
    contactMethod,
    requestType: requestTypeRaw as MatchingPulseRequestCreateData["requestType"],
    category: categoryRaw as MatchingPulseRequestCreateData["category"],
    urgency,
    description,
    idealMatch,
    source,
    consentToContact: true,
    consentToShare,
  };

  return { ok: true, data };
}
