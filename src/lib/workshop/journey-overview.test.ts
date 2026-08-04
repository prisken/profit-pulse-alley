import { describe, expect, it } from "vitest";

import { deriveJourneyOverview } from "@/lib/workshop/journey-overview";
import type { ExpensesState, PyramidState } from "@/lib/workshop/types";

const expenses: ExpensesState = {
  totalHKD: 25_000,
  categories: [
    { key: "housing", icon: "Home", amountHKD: 12_000 },
    { key: "food_living", icon: "UtensilsCrossed", amountHKD: 5_000 },
    { key: "transport", icon: "Bus", amountHKD: 2_000 },
    { key: "insurance", icon: "Shield", amountHKD: 2_000 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 4_000 },
  ],
};

const pyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 80,
    criticalIllnessAmountHKD: 500_000,
  },
  emergencyFund: { savedAmountHKD: 180_000 },
  goals: { goals: [] },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 320_000,
    monthlyInvestmentHKD: 8_000,
    monthlyFunHKD: 5_000,
  },
};

describe("deriveJourneyOverview", () => {
  it("builds cash-flow slices with unallocated surplus and assets from confirmed pools", () => {
    const overview = deriveJourneyOverview({
      monthlyIncomeHKD: 50_000,
      expenses,
      pyramid,
    });

    expect(overview.cashFlowSlices.map((s) => s.key)).toEqual([
      "housing",
      "food_living",
      "transport",
      "insurance",
      "discretionary",
      "fun",
      "investment",
      "surplus",
    ]);
    // 50k − 25k expenses − 5k fun − 8k investing = 12k surplus
    expect(overview.monthlySurplusHKD).toBe(12_000);
    expect(
      overview.cashFlowSlices.find((s) => s.key === "surplus")?.amountHKD,
    ).toBe(12_000);

    expect(overview.assetsSlices).toEqual([
      expect.objectContaining({ key: "liquid", amountHKD: 180_000 }),
      expect.objectContaining({ key: "invested", amountHKD: 320_000 }),
    ]);
  });
});
