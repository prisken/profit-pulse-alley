import { describe, expect, it } from "vitest";

import { computeRunwayBeforeAfter } from "@/lib/workshop/runway";
import type {
  ExpensesState,
  GoalJourneyState,
  PyramidState,
} from "@/lib/workshop/types";

const NOW_YEAR = 2026;

function pyramid(): PyramidState {
  return {
    protection: {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 500_000,
    },
    emergencyFund: { savedAmountHKD: 50_000 },
    goals: {
      goals: [
        {
          id: "wedding",
          icon: "Heart",
          label: { en: "Wedding", zhHant: "婚禮" },
          targetAmountHKD: 400_000,
          targetAge: 40,
          targetYear: NOW_YEAR + 5,
        },
        {
          id: "home",
          icon: "House",
          label: { en: "Home deposit", zhHant: "置業首期" },
          targetAmountHKD: 1_500_000,
          targetAge: 45,
          targetYear: NOW_YEAR + 10,
        },
      ],
    },
    investment: {
      riskAllocation: { low: 30, mid: 40, high: 30 },
      lumpSumHKD: 600_000,
    },
  };
}

function expenses(overrides?: Partial<ExpensesState>): ExpensesState {
  const categories = [
    { key: "housing" as const, icon: "Home", amountHKD: 12_000 },
    { key: "food_living" as const, icon: "UtensilsCrossed", amountHKD: 6_000 },
    { key: "transport" as const, icon: "Bus", amountHKD: 2_000 },
    { key: "insurance" as const, icon: "Shield", amountHKD: 2_000 },
    { key: "discretionary" as const, icon: "Sparkles", amountHKD: 4_000 },
  ];
  return {
    categories,
    totalHKD: categories.reduce((sum, row) => sum + row.amountHKD, 0),
    ...overrides,
  };
}

function emptyJourney(): GoalJourneyState {
  return { decisions: [], updatedAt: new Date(0).toISOString() };
}

function baseInput(overrides?: {
  expenses?: ExpensesState;
  journey?: GoalJourneyState;
}) {
  return {
    age: 35,
    retirementAge: 65,
    monthlyIncome: 50_000,
    industry: "Tech",
    pyramid: pyramid(),
    expenses: overrides?.expenses ?? expenses(),
    journey: overrides?.journey ?? emptyJourney(),
    nowYear: NOW_YEAR,
  };
}

describe("computeRunwayBeforeAfter", () => {
  it("returns the same runway when no journey decisions exist", () => {
    const runway = computeRunwayBeforeAfter(baseInput());
    expect(typeof runway.beforeAge === "number" || runway.beforeAge === null).toBe(
      true,
    );
    expect(runway.afterAge).toBe(runway.beforeAge);
  });

  it("a squeeze that cuts discretionary extends the after runway", () => {
    const squeezedExpenses = expenses({
      totalHKD: 22_000,
      categories: expenses().categories.map((row) =>
        row.key === "discretionary"
          ? { ...row, amountHKD: 1_000 }
          : row,
      ),
    });
    const journey: GoalJourneyState = {
      decisions: [
        {
          goalId: "wedding",
          status: "applied",
          allowLiquidation: false,
          acceptedSqueeze: true,
          squeezeCutsHKD: { fun: 0, discretionary: 36_000 },
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const runway = computeRunwayBeforeAfter(
      baseInput({ expenses: squeezedExpenses, journey }),
    );

    // More surplus (fewer expenses) → assets should last at least as long.
    // null = sustained past 90 (best case).
    const before = runway.beforeAge ?? 90;
    const after = runway.afterAge ?? 90;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("given-up goals never shorten the after runway", () => {
    const journey: GoalJourneyState = {
      decisions: [
        {
          goalId: "home",
          status: "given_up",
          allowLiquidation: false,
          acceptedSqueeze: false,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const runway = computeRunwayBeforeAfter(baseInput({ journey }));
    if (runway.beforeAge != null && runway.afterAge != null) {
      expect(runway.afterAge).toBeGreaterThanOrEqual(runway.beforeAge);
    }
  });
});
