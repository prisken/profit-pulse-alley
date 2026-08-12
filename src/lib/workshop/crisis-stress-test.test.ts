import { describe, expect, it } from "vitest";

import {
  pickDeterministicCrisisScenario,
  runCrisisStressTest,
  toCrisisStressTestSummary,
} from "@/lib/workshop/crisis-stress-test";
import { computeFinancialRating } from "@/lib/workshop/financial-rating";
import type { ExpensesState, PyramidState } from "@/lib/workshop/types";

const NOW_YEAR = 2026;

function basePyramid(overrides?: {
  protection?: Partial<PyramidState["protection"]>;
  emergencyFund?: Partial<PyramidState["emergencyFund"]>;
  investment?: Partial<PyramidState["investment"]>;
  goals?: PyramidState["goals"];
}): PyramidState {
  return {
    protection: {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 800_000,
      ...overrides?.protection,
    },
    emergencyFund: {
      savedAmountHKD: 250_000,
      ...overrides?.emergencyFund,
    },
    goals: overrides?.goals ?? {
      goals: [
        {
          id: "wedding",
          icon: "Heart",
          label: { en: "Wedding", zhHant: "婚禮" },
          targetAmountHKD: 200_000,
          targetAge: 40,
          targetYear: NOW_YEAR + 5,
        },
      ],
    },
    investment: {
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 500_000,
      ...overrides?.investment,
    },
  };
}

const expenses: ExpensesState = {
  totalHKD: 28_000,
  categories: [
    { key: "housing", icon: "Home", amountHKD: 14_000 },
    { key: "food_living", icon: "Utensils", amountHKD: 5_000 },
    { key: "transport", icon: "Bus", amountHKD: 2_000 },
    { key: "insurance", icon: "Shield", amountHKD: 2_000 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 5_000 },
  ],
};

describe("pickDeterministicCrisisScenario", () => {
  it("is stable for identical profile inputs", () => {
    const a = pickDeterministicCrisisScenario({
      age: 42,
      industry: "Healthcare",
      riskProfile: "balanced",
    });
    const b = pickDeterministicCrisisScenario({
      age: 42,
      industry: "Healthcare",
      riskProfile: "balanced",
    });
    expect(a).toEqual(b);
  });

  it("biases health industries toward medical / critical illness", () => {
    const young = pickDeterministicCrisisScenario({
      age: 28,
      industry: "Healthcare",
      riskProfile: "aggressive",
    });
    expect(young.scenario).toBe("medical");

    const mid = pickDeterministicCrisisScenario({
      age: 48,
      industry: "醫療",
      riskProfile: "conservative",
    });
    expect(mid.scenario).toBe("critical_illness");
  });
});

describe("runCrisisStressTest", () => {
  it("returns identical output when run twice on the same inputs", () => {
    const input = {
      age: 38,
      retirementAge: 65,
      monthlyIncome: 55_000,
      industry: "Finance",
      riskProfile: "balanced" as const,
      pyramid: basePyramid(),
      expenses,
      journey: { decisions: [], updatedAt: new Date(0).toISOString() },
      nowYear: NOW_YEAR,
    };
    const a = toCrisisStressTestSummary(runCrisisStressTest(input));
    const b = toCrisisStressTestSummary(runCrisisStressTest(input));
    expect(a).toEqual(b);
  });

  it("does not crash when goalJourney has zero applied goals and pyramid has no goals", () => {
    const result = runCrisisStressTest({
      age: 40,
      retirementAge: 65,
      monthlyIncome: 40_000,
      industry: "Tech",
      riskProfile: "conservative",
      pyramid: basePyramid({
        goals: { goals: [] },
        protection: {
          medicalCoveragePercent: 90,
          criticalIllnessAmountHKD: 1_000_000,
        },
      }),
      expenses,
      journey: { decisions: [], updatedAt: new Date(0).toISOString() },
      nowYear: NOW_YEAR,
    });
    expect(result.verdict).toMatch(/SHIELDED|PARTIAL|PENETRATED/);
    expect(result.affectedGoalId).toBeNull();
    expect(Number.isFinite(result.resilienceScore)).toBe(true);
  });

  it("marks strong protection as SHIELDED for a medical/CI-style shock", () => {
    const result = runCrisisStressTest({
      age: 28,
      retirementAge: 65,
      monthlyIncome: 50_000,
      industry: "Healthcare",
      riskProfile: "conservative",
      pyramid: basePyramid({
        protection: {
          medicalCoveragePercent: 100,
          criticalIllnessAmountHKD: 2_000_000,
        },
        emergencyFund: { savedAmountHKD: 400_000 },
        investment: {
          riskAllocation: { low: 50, mid: 40, high: 10 },
          lumpSumHKD: 300_000,
        },
      }),
      expenses,
      nowYear: NOW_YEAR,
    });
    expect(result.scenario).toBe("medical");
    expect(result.verdict).toBe("SHIELDED");
    expect(result.resilienceScore).toBeGreaterThanOrEqual(85);
    expect(result.penetrationAmount).toBeLessThanOrEqual(50_000 * 0.5);
  });

  it("marks weak protection + liquidated plan as PENETRATED", () => {
    const result = runCrisisStressTest({
      age: 48,
      retirementAge: 65,
      monthlyIncome: 45_000,
      industry: "Healthcare",
      riskProfile: "balanced",
      pyramid: basePyramid({
        protection: {
          medicalCoveragePercent: 0,
          criticalIllnessAmountHKD: 0,
        },
        emergencyFund: { savedAmountHKD: 0 },
        investment: {
          riskAllocation: { low: 80, mid: 15, high: 5 },
          lumpSumHKD: 20_000,
        },
      }),
      expenses: {
        totalHKD: 30_000,
        categories: [
          { key: "housing", icon: "Home", amountHKD: 18_000 },
          { key: "food_living", icon: "Utensils", amountHKD: 6_000 },
          { key: "transport", icon: "Bus", amountHKD: 2_000 },
          { key: "insurance", icon: "Shield", amountHKD: 0 },
          { key: "discretionary", icon: "Sparkles", amountHKD: 4_000 },
        ],
      },
      nowYear: NOW_YEAR,
    });
    expect(result.scenario).toBe("critical_illness");
    expect(result.verdict).toBe("PENETRATED");
    expect(result.resilienceScore).toBeLessThanOrEqual(40);
  });

  it("keeps Crisis Resilience rating band aligned with the stress-test verdict", () => {
    const stress = runCrisisStressTest({
      age: 28,
      retirementAge: 65,
      monthlyIncome: 50_000,
      industry: "Healthcare",
      riskProfile: "conservative",
      pyramid: basePyramid({
        protection: {
          medicalCoveragePercent: 100,
          criticalIllnessAmountHKD: 2_000_000,
        },
      }),
      expenses,
      nowYear: NOW_YEAR,
    });
    const summary = toCrisisStressTestSummary(stress);
    const rating = computeFinancialRating({
      pyramid: basePyramid(),
      benchmarks: {
        medicalCoveragePercent: 80,
        criticalIllnessAmountHKD: 800_000,
        emergencyFundTargetMonths: 6,
        emergencyFundTargetHKD: 180_000,
      },
      stressTest: {
        monthlySurplusByYear: [
          { year: 1, income: 50_000, expenses: 28_000, surplus: 22_000 },
        ],
        emergencyFundProjection: {
          targetMonths: 6,
          projectedMonths: 8,
          status: "green",
        },
        goalProjections: [],
      },
      crisisStressTest: summary,
    });
    expect(rating.breakdown.crisisResilience).toBe(summary.resilienceScore);
    expect(rating.breakdown.crisisResilience).toBeGreaterThanOrEqual(85);
  });
});
