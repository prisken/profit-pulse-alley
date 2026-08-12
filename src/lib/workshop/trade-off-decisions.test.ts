import { describe, expect, it } from "vitest";

import { deriveTradeOffDecisions } from "@/lib/workshop/trade-off-decisions";
import type { GoalJourneyState, PyramidState } from "@/lib/workshop/types";

const pyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 80,
    criticalIllnessAmountHKD: 500_000,
  },
  emergencyFund: { savedAmountHKD: 100_000 },
  goals: {
    goals: [
      {
        id: "wedding",
        icon: "Heart",
        label: { en: "Wedding", zhHant: "婚禮" },
        targetAmountHKD: 200_000,
        targetAge: 38,
        targetYear: 2029,
      },
      {
        id: "home",
        icon: "Home",
        label: { en: "Home", zhHant: "置業" },
        targetAmountHKD: 1_000_000,
        targetAge: 42,
        targetYear: 2033,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 200_000,
  },
};

describe("deriveTradeOffDecisions", () => {
  it("summarizes secured, deprioritized, and accepted squeezes", () => {
    const journey: GoalJourneyState = {
      decisions: [
        {
          goalId: "wedding",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: true,
          squeezeCutsHKD: { fun: 12_000, discretionary: 24_000 },
        },
        {
          goalId: "home",
          status: "given_up",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
      ],
      updatedAt: new Date(0).toISOString(),
    };

    const result = deriveTradeOffDecisions({ pyramid, journey });
    expect(result?.secured).toEqual([
      expect.objectContaining({
        goalId: "wedding",
        usedLiquidation: true,
        targetAge: 38,
      }),
    ]);
    expect(result?.deprioritized).toEqual([
      expect.objectContaining({ goalId: "home", targetAge: 42 }),
    ]);
    expect(result?.squeezesAccepted).toEqual([
      { category: "fun", monthlyAmount: 1000 },
      { category: "discretionary", monthlyAmount: 2000 },
    ]);
  });

  it("returns null when journey is empty", () => {
    expect(
      deriveTradeOffDecisions({
        pyramid,
        journey: { decisions: [], updatedAt: new Date(0).toISOString() },
      }),
    ).toBeNull();
  });
});
