import { describe, expect, it } from "vitest";

import { deriveRiskQuizJourneyConsistency } from "@/lib/workshop/risk-quiz-consistency";
import type { GoalJourneyState } from "@/lib/workshop/types";

function journey(
  decisions: GoalJourneyState["decisions"],
): GoalJourneyState {
  return { decisions, updatedAt: new Date().toISOString() };
}

describe("deriveRiskQuizJourneyConsistency", () => {
  it("returns null when journey is missing or has no applied goals", () => {
    expect(deriveRiskQuizJourneyConsistency("balanced", null)).toBeNull();
    expect(
      deriveRiskQuizJourneyConsistency("balanced", journey([])),
    ).toBeNull();
    expect(
      deriveRiskQuizJourneyConsistency(
        "balanced",
        journey([
          {
            goalId: "a",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ]),
      ),
    ).toBeNull();
  });

  it("flags conservative quiz vs frequent liquidation", () => {
    const result = deriveRiskQuizJourneyConsistency(
      "conservative",
      journey([
        {
          goalId: "a",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: false,
        },
        {
          goalId: "b",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: false,
        },
      ]),
    );
    expect(result).toEqual({
      messageKey: "workshop.riskQuiz.consistencyConservativeGap",
      vars: { x: 2, y: 2 },
    });
  });

  it("flags aggressive quiz vs protecting assets and giving up", () => {
    const result = deriveRiskQuizJourneyConsistency(
      "aggressive",
      journey([
        {
          goalId: "a",
          status: "applied",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
        {
          goalId: "b",
          status: "given_up",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
      ]),
    );
    expect(result).toEqual({
      messageKey: "workshop.riskQuiz.consistencyAggressiveGap",
      vars: {},
    });
  });

  it("aligns when profile and behavior match", () => {
    const alignedConservative = deriveRiskQuizJourneyConsistency(
      "conservative",
      journey([
        {
          goalId: "a",
          status: "applied",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
      ]),
    );
    expect(alignedConservative).toEqual({
      messageKey: "workshop.riskQuiz.consistencyAligned",
      vars: { profileKey: "workshop.riskProfile.labels.conservative" },
    });

    const alignedAggressive = deriveRiskQuizJourneyConsistency(
      "aggressive",
      journey([
        {
          goalId: "a",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: false,
        },
      ]),
    );
    expect(alignedAggressive).toEqual({
      messageKey: "workshop.riskQuiz.consistencyAligned",
      vars: { profileKey: "workshop.riskProfile.labels.aggressive" },
    });

    const balanced = deriveRiskQuizJourneyConsistency(
      "balanced",
      journey([
        {
          goalId: "a",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: false,
        },
        {
          goalId: "b",
          status: "applied",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
      ]),
    );
    expect(balanced?.messageKey).toBe(
      "workshop.riskQuiz.consistencyAligned",
    );
  });
});
