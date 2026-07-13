import {
  isValidLearningInterest,
  isValidNextStepPreference,
  type LearningInterestOption,
  type NextStepPreferenceOption,
} from "@/lib/acquisition/constants";
import type { MessageKey } from "@/lib/i18n/messages/en";

type TranslateFn = (key: MessageKey) => string;

function learningInterestMessageKey(option: LearningInterestOption): MessageKey {
  return `acquisition.learningInterest.option.${option}` as MessageKey;
}

function nextStepPreferenceMessageKey(
  option: NextStepPreferenceOption,
): MessageKey {
  return `acquisition.nextStep.option.${option}` as MessageKey;
}

export function formatLearningInterestLabel(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value) {
    return "—";
  }

  if (isValidLearningInterest(value)) {
    return t(learningInterestMessageKey(value));
  }

  return value;
}

export function formatNextStepPreferenceLabel(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value) {
    return "—";
  }

  if (isValidNextStepPreference(value)) {
    return t(nextStepPreferenceMessageKey(value));
  }

  return value;
}
