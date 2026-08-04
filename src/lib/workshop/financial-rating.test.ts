import { describe, expect, it } from "vitest";

import { bilingualBoth } from "@/lib/workshop/bilingual";
import {
  RATING_WEIGHTS,
  computeFinancialRating,
  computeGoalImpactPoints,
} from "@/lib/workshop/financial-rating";
import type {
  CrisisState,
  PyramidState,
  StressTestResult,
} from "@/lib/workshop/types";

const nowYear = new Date().getFullYear();

const strongPyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 90,
    criticalIllnessAmountHKD: 1_000_000,
  },
  emergencyFund: { savedAmountHKD: 300_000 },
  goals: {
    goals: [
      {
        id: "wedding",
        icon: "Heart",
        label: bilingualBoth("Wedding"),
        targetAmountHKD: 200_000,
        targetYear: nowYear + 3,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    monthlyInvestmentHKD: 8_000,
    monthlyFunHKD: 2_000,
  },
};

const weakPyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 0,
    criticalIllnessAmountHKD: 0,
  },
  emergencyFund: { savedAmountHKD: 0 },
  goals: {
    goals: [
      {
        id: "home",
        icon: "Home",
        label: bilingualBoth("Home"),
        targetAmountHKD: 2_000_000,
        targetYear: nowYear + 5,
      },
      {
        id: "edu",
        icon: "GraduationCap",
        label: bilingualBoth("Education"),
        targetAmountHKD: 800_000,
        targetYear: nowYear + 8,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 80, mid: 15, high: 5 },
    monthlyInvestmentHKD: 0,
    monthlyFunHKD: 0,
  },
};

const strongBenchmarks = {
  medicalCoveragePercent: 80,
  criticalIllnessAmountHKD: 800_000,
  emergencyFundTargetMonths: 6,
  emergencyFundTargetHKD: 180_000,
};

const weakBenchmarks = {
  medicalCoveragePercent: 80,
  criticalIllnessAmountHKD: 800_000,
  emergencyFundTargetMonths: 6,
  emergencyFundTargetHKD: 180_000,
};

const strongStress: StressTestResult = {
  monthlySurplusByYear: [
    { year: 1, income: 80_000, expenses: 30_000, surplus: 50_000 },
  ],
  emergencyFundProjection: {
    targetMonths: 6,
    projectedMonths: 0,
    status: "green",
  },
  goalProjections: [
    {
      goalId: "wedding",
      label: bilingualBoth("Wedding"),
      icon: "Heart",
      targetAmountHKD: 200_000,
      targetYear: nowYear + 3,
      projectedYear: nowYear + 2,
      status: "green",
    },
  ],
};

const weakStress: StressTestResult = {
  monthlySurplusByYear: [
    { year: 1, income: 40_000, expenses: 38_000, surplus: 2_000 },
  ],
  emergencyFundProjection: {
    targetMonths: 6,
    projectedMonths: 360,
    status: "red",
  },
  goalProjections: [
    {
      goalId: "home",
      label: bilingualBoth("Home"),
      icon: "Home",
      targetAmountHKD: 2_000_000,
      targetYear: nowYear + 5,
      projectedYear: null,
      status: "red",
    },
    {
      goalId: "edu",
      label: bilingualBoth("Education"),
      icon: "GraduationCap",
      targetAmountHKD: 800_000,
      targetYear: nowYear + 8,
      projectedYear: null,
      status: "red",
    },
  ],
};

const mildCrisis: CrisisState = {
  title: bilingualBoth("Mild industry soft patch"),
  description: bilingualBoth("A short, contained income dip."),
  riskProfile: "balanced",
  monthlyIncomeImpactPercent: 10,
  oneTimeCostHKD: 20_000,
  durationMonths: 3,
  impacts: [
    {
      layer: "investment",
      icon: "TrendingDown",
      headline: bilingualBoth("Portfolio wobble"),
      detailHKD: 40_000,
    },
    {
      layer: "goals",
      icon: "Target",
      headline: bilingualBoth("Minor delay"),
      detailMonths: 6,
    },
  ],
};

const severeCrisis: CrisisState = {
  title: bilingualBoth("Full-stack shock"),
  description: bilingualBoth("Income, health, and liquidity all hit at once."),
  riskProfile: "conservative",
  monthlyIncomeImpactPercent: 90,
  oneTimeCostHKD: 500_000,
  durationMonths: 18,
  impacts: [
    {
      layer: "protection",
      icon: "ShieldOff",
      headline: bilingualBoth("No CI cover"),
      detailHKD: 400_000,
    },
    {
      layer: "emergencyFund",
      icon: "PiggyBank",
      headline: bilingualBoth("Cash gone"),
      detailMonths: 1,
    },
    {
      layer: "investment",
      icon: "TrendingDown",
      headline: bilingualBoth("Forced sale"),
      detailHKD: 200_000,
    },
    {
      layer: "goals",
      icon: "Target",
      headline: bilingualBoth("Goals stalled"),
      detailMonths: 36,
    },
  ],
};

describe("RATING_WEIGHTS", () => {
  it("sums to 1.0", () => {
    const sum =
      RATING_WEIGHTS.protection +
      RATING_WEIGHTS.emergencyFund +
      RATING_WEIGHTS.goalsOnTrack +
      RATING_WEIGHTS.crisisResilience;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("computeFinancialRating", () => {
  it("scores near 100 for strong protection, funded EF, green goals, mild crisis", () => {
    const rating = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
    });

    expect(rating.breakdown.protection).toBeGreaterThanOrEqual(95);
    expect(rating.breakdown.emergencyFund).toBe(100);
    expect(rating.breakdown.goalsOnTrack).toBe(100);
    expect(rating.score).toBeGreaterThanOrEqual(85);
    expect(rating.labelKey).toBe("strongFoundation");
    expect(rating).not.toHaveProperty("label");
    expect(typeof (rating as { label?: unknown }).label).toBe("undefined");
  });

  it("scores low with no protection, no emergency fund, red goals, and all-layer crisis", () => {
    const rating = computeFinancialRating({
      pyramid: weakPyramid,
      benchmarks: weakBenchmarks,
      stressTest: weakStress,
      crisis: severeCrisis,
    });

    expect(rating.breakdown.protection).toBe(0);
    expect(rating.breakdown.emergencyFund).toBe(0);
    expect(rating.breakdown.goalsOnTrack).toBe(0);
    expect(rating.breakdown.crisisResilience).toBeLessThan(50);
    expect(rating.score).toBeLessThan(40);
    expect(rating.labelKey).toBe("needsAttention");
    expect(rating).not.toHaveProperty("label");
  });

  it("returns labelKey enum keys only — never a raw display label string", () => {
    const strong = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
    });
    const weak = computeFinancialRating({
      pyramid: weakPyramid,
      benchmarks: weakBenchmarks,
      stressTest: weakStress,
      crisis: severeCrisis,
    });
    const mid = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: {
        ...strongStress,
        goalProjections: strongStress.goalProjections.map((g) => ({
          ...g,
          status: "amber" as const,
        })),
      },
      crisis: mildCrisis,
    });

    const allowed = new Set([
      "needsAttention",
      "goodRoomToGrow",
      "strongFoundation",
    ]);
    for (const rating of [strong, weak, mid]) {
      expect(allowed.has(rating.labelKey)).toBe(true);
      // Display phrases like "Needs attention" must not appear as the return value.
      expect(rating.labelKey.includes(" ")).toBe(false);
      expect(Object.keys(rating)).not.toContain("label");
    }
  });

  it("gives amber goals half credit on goalsOnTrack", () => {
    const rating = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: {
        ...strongStress,
        goalProjections: [
          {
            ...strongStress.goalProjections[0]!,
            status: "amber",
            projectedYear: nowYear + 4,
          },
          {
            goalId: "other",
            label: bilingualBoth("Other"),
            icon: "Target",
            targetAmountHKD: 100_000,
            targetYear: nowYear + 5,
            projectedYear: nowYear + 5,
            status: "green",
          },
        ],
      },
      crisis: mildCrisis,
    });

    // (0.5 + 1) / 2 = 75
    expect(rating.breakdown.goalsOnTrack).toBe(75);
  });
});

describe("computeGoalImpactPoints", () => {
  it("scales with category weight and remaining gap", () => {
    expect(
      computeGoalImpactPoints("protection", 60, RATING_WEIGHTS.protection),
    ).toBe(15);
    expect(
      computeGoalImpactPoints("goalsOnTrack", 100, RATING_WEIGHTS.goalsOnTrack),
    ).toBe(30);
    expect(computeGoalImpactPoints("emergencyFund", 0, 0.25)).toBe(0);
  });
});
