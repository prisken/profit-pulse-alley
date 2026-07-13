export const LEARNING_INTEREST_OPTIONS = [
  "market_outlook",
  "long_term_investing",
  "risk_management",
  "retirement_planning",
  "insurance_protection",
  "business_owner_planning",
  "just_challenge",
] as const;

export type LearningInterestOption = (typeof LEARNING_INTEREST_OPTIONS)[number];

const LEARNING_INTEREST_OPTION_SET = new Set<string>(LEARNING_INTEREST_OPTIONS);

export function isValidLearningInterest(
  value: string,
): value is LearningInterestOption {
  return LEARNING_INTEREST_OPTION_SET.has(value);
}

export const NEXT_STEP_PREFERENCE_OPTIONS = [
  "next_challenge",
  "market_recap",
  "attend_event",
  "clarity_call",
  "just_browsing",
] as const;

export type NextStepPreferenceOption =
  (typeof NEXT_STEP_PREFERENCE_OPTIONS)[number];

const NEXT_STEP_PREFERENCE_OPTION_SET = new Set<string>(
  NEXT_STEP_PREFERENCE_OPTIONS,
);

export function isValidNextStepPreference(
  value: string,
): value is NextStepPreferenceOption {
  return NEXT_STEP_PREFERENCE_OPTION_SET.has(value);
}
