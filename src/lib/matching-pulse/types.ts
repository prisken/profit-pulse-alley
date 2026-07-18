import type {
  MatchingPulseCategoryValue,
  MatchingPulseRequestTypeValue,
  MatchingPulseStatusValue,
  MatchingPulseUrgencyValue,
} from "@/lib/matching-pulse/constants";

/** Loose form / request payload before validation. */
export type MatchingPulseRequestFormInput = {
  title?: unknown;
  company?: unknown;
  roleTitle?: unknown;
  contactPhone?: unknown;
  contactMethod?: unknown;
  requestType?: unknown;
  category?: unknown;
  urgency?: unknown;
  description?: unknown;
  idealMatch?: unknown;
  source?: unknown;
  consentToContact?: unknown;
  consentToShare?: unknown;
};

/** Normalized create payload after successful validation. */
export type MatchingPulseRequestCreateData = {
  title: string;
  company: string | null;
  roleTitle: string | null;
  contactPhone: string | null;
  contactMethod: string | null;
  requestType: MatchingPulseRequestTypeValue;
  category: MatchingPulseCategoryValue;
  urgency: MatchingPulseUrgencyValue | null;
  description: string;
  idealMatch: string | null;
  source: string | null;
  consentToContact: true;
  consentToShare: boolean;
};

export type MatchingPulseRequestFieldName =
  | keyof MatchingPulseRequestCreateData
  | "form";

export type MatchingPulseRequestFieldErrors = Partial<
  Record<MatchingPulseRequestFieldName, string>
>;

export type MatchingPulseValidationSuccess = {
  ok: true;
  data: MatchingPulseRequestCreateData;
};

export type MatchingPulseValidationFailure = {
  ok: false;
  fieldErrors: MatchingPulseRequestFieldErrors;
  formError?: string;
};

export type MatchingPulseValidationResult =
  | MatchingPulseValidationSuccess
  | MatchingPulseValidationFailure;

/** Admin list / detail row shape (DB-backed fields used in UI). */
export type MatchingPulseRequestSummary = {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  roleTitle: string | null;
  requestType: MatchingPulseRequestTypeValue;
  category: MatchingPulseCategoryValue;
  urgency: MatchingPulseUrgencyValue | null;
  status: MatchingPulseStatusValue;
  createdAt: Date | string;
  updatedAt: Date | string;
};
