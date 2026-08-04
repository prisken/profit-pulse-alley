/**
 * Pure comparison of risk-quiz profile vs Step 4 goal-journey behavior.
 * No AI — deterministic copy keys only. Does not affect quiz scoring.
 */

import type { MessageKey } from "@/lib/i18n/messages";
import type { GoalJourneyState, RiskProfile } from "@/lib/workshop/types";

export type RiskQuizConsistencyResult = {
  messageKey: MessageKey;
  vars: Record<string, string | number>;
};

/**
 * Derive one consistency sentence after the quiz result is known.
 * Returns null when journey is missing or has no applied goals (graceful skip).
 */
export function deriveRiskQuizJourneyConsistency(
  profile: RiskProfile,
  journey: GoalJourneyState | null | undefined,
): RiskQuizConsistencyResult | null {
  if (!journey?.decisions?.length) {
    return null;
  }

  const applied = journey.decisions.filter((row) => row.status === "applied");
  if (applied.length === 0) {
    return null;
  }

  const liquidatedCount = applied.filter(
    (row) => row.allowLiquidation === true,
  ).length;
  const appliedCount = applied.length;
  const gaveUpAny = journey.decisions.some((row) => row.status === "given_up");
  const liquidatedRatio = liquidatedCount / appliedCount;

  if (profile === "conservative" && liquidatedRatio >= 0.5) {
    return {
      messageKey: "workshop.riskQuiz.consistencyConservativeGap",
      vars: { x: liquidatedCount, y: appliedCount },
    };
  }

  if (
    profile === "aggressive" &&
    liquidatedCount === 0 &&
    gaveUpAny
  ) {
    return {
      messageKey: "workshop.riskQuiz.consistencyAggressiveGap",
      vars: {},
    };
  }

  return {
    messageKey: "workshop.riskQuiz.consistencyAligned",
    vars: {
      profileKey: `workshop.riskProfile.labels.${profile}`,
    },
  };
}
