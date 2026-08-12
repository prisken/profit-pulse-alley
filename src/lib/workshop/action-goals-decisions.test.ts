import { describe, expect, it } from "vitest";

import {
  buildActionGoalsDecisionsPayload,
  buildDeterministicActionGoalsFallback,
  isProfileBehaviorMismatch,
} from "@/lib/workshop/action-goals-decisions";
import { computeFinancialRating } from "@/lib/workshop/financial-rating";
import { runCrisisStressTest, toCrisisStressTestSummary } from "@/lib/workshop/crisis-stress-test";
import type {
  ExpensesState,
  GoalJourneyState,
  PyramidState,
} from "@/lib/workshop/types";

const NOW_YEAR = 2026;

function expenses(total = 28_000): ExpensesState {
  return {
    totalHKD: total,
    categories: [
      { key: "housing", icon: "Home", amountHKD: Math.round(total * 0.5) },
      { key: "food_living", icon: "Utensils", amountHKD: Math.round(total * 0.2) },
      { key: "transport", icon: "Bus", amountHKD: Math.round(total * 0.1) },
      { key: "insurance", icon: "Shield", amountHKD: Math.round(total * 0.05) },
      { key: "discretionary", icon: "Sparkles", amountHKD: Math.round(total * 0.15) },
    ],
  };
}

function pyramid(overrides?: {
  protection?: Partial<PyramidState["protection"]>;
  emergencyFund?: Partial<PyramidState["emergencyFund"]>;
  investment?: Partial<PyramidState["investment"]>;
  goals?: PyramidState["goals"];
}): PyramidState {
  return {
    protection: {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 500_000,
      ...overrides?.protection,
    },
    emergencyFund: {
      savedAmountHKD: 200_000,
      ...overrides?.emergencyFund,
    },
    goals: overrides?.goals ?? {
      goals: [
        {
          id: "wedding",
          icon: "Heart",
          label: { en: "Wedding", zhHant: "婚禮" },
          targetAmountHKD: 200_000,
          targetAge: 38,
          targetYear: NOW_YEAR + 3,
        },
        {
          id: "home",
          icon: "Home",
          label: { en: "Home Deposit", zhHant: "首期" },
          targetAmountHKD: 1_500_000,
          targetAge: 42,
          targetYear: NOW_YEAR + 7,
        },
        {
          id: "edu",
          icon: "GraduationCap",
          label: { en: "Education", zhHant: "教育" },
          targetAmountHKD: 600_000,
          targetAge: 45,
          targetYear: NOW_YEAR + 10,
        },
      ],
    },
    investment: {
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 400_000,
      ...overrides?.investment,
    },
  };
}

function journey(
  decisions: GoalJourneyState["decisions"],
): GoalJourneyState {
  return { decisions, updatedAt: new Date(0).toISOString() };
}

const STEP_NUMBER_RE = /\bStep\s*\d+\b/i;

describe("action-goals decisions payload + fallback", () => {
  it("(a) aggressive liquidator with PENETRATED — payload + fallback cite decisions", () => {
    const mutated = pyramid({
      protection: {
        medicalCoveragePercent: 0,
        criticalIllnessAmountHKD: 0,
      },
      emergencyFund: { savedAmountHKD: 0 },
      investment: {
        riskAllocation: { low: 20, mid: 30, high: 50 },
        lumpSumHKD: 15_000,
      },
    });
    const ex = expenses(32_000);
    const j = journey([
      {
        goalId: "wedding",
        status: "applied",
        allowLiquidation: true,
        acceptedSqueeze: true,
        squeezeCutsHKD: { fun: 24_000, discretionary: 36_000 },
      },
      {
        goalId: "home",
        status: "applied",
        allowLiquidation: true,
        acceptedSqueeze: false,
      },
    ]);

    const stress = toCrisisStressTestSummary(
      runCrisisStressTest({
        age: 48,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Healthcare",
        riskProfile: "aggressive",
        pyramid: mutated,
        expenses: ex,
        journey: j,
        nowYear: NOW_YEAR,
      }),
    );
    expect(stress.verdict).toBe("PENETRATED");

    const decisions = buildActionGoalsDecisionsPayload({
      pyramid: mutated,
      expenses: ex,
      monthlyIncome: 50_000,
      journey: j,
      crisisStressTest: stress,
      riskProfile: "aggressive",
    });

    expect(decisions.goalsApplied).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Wedding",
          usedLiquidation: true,
          liquidationSource: "investments",
        }),
        expect.objectContaining({
          name: "Home Deposit",
          usedLiquidation: true,
          liquidationSource: "investments",
        }),
      ]),
    );
    expect(decisions.squeezesAccepted).toEqual(
      expect.arrayContaining([
        { category: "fun", monthlyAmount: 2000 },
        { category: "discretionary", monthlyAmount: 3000 },
      ]),
    );
    expect(decisions.crisisStressTest.verdict).toBe("PENETRATED");
    expect(decisions.riskQuizProfile).toBe("Aggressive");
    expect(decisions.profileBehaviorMismatch).toBe(false);
    expect(decisions.postJourneyState.investmentBalanceRemaining).toBe(15_000);

    const seeds = [
      {
        rank: 1,
        category: "protection" as const,
        leverType: "structural" as const,
        icon: "Shield",
        impactPoints: 18.5,
      },
      {
        rank: 2,
        category: "savings" as const,
        leverType: "instant" as const,
        icon: "PiggyBank",
        impactPoints: 14,
      },
      {
        rank: 3,
        category: "investment" as const,
        leverType: "behavioral" as const,
        icon: "TrendingUp",
        impactPoints: 12,
      },
    ];
    const goals = buildDeterministicActionGoalsFallback(seeds, decisions);
    expect(goals).toHaveLength(3);
    for (const g of goals) {
      expect(g.impactPoints).toBe(
        seeds.find((s) => s.rank === g.rank)!.impactPoints,
      );
      expect(g.title.en.length).toBeGreaterThan(0);
      expect(g.title.zhHant.length).toBeGreaterThan(0);
      expect(g.reasoning.en.length).toBeGreaterThan(0);
      expect(g.reasoning.zhHant.length).toBeGreaterThan(0);
      expect(g.reasoning.en).not.toMatch(STEP_NUMBER_RE);
      expect(g.reasoning.zhHant).not.toMatch(STEP_NUMBER_RE);
    }
    const protection = goals.find((g) => g.category === "protection")!;
    expect(protection.reasoning.en).toMatch(/stress test|protection layer|gap/i);
    expect(protection.reasoning.zhHant).not.toBe(protection.reasoning.en);
  });

  it("(b) conservative giver-up with SHIELDED — no shame, cites prioritization", () => {
    const mutated = pyramid({
      protection: {
        medicalCoveragePercent: 100,
        criticalIllnessAmountHKD: 2_000_000,
      },
      emergencyFund: { savedAmountHKD: 400_000 },
      investment: {
        riskAllocation: { low: 60, mid: 30, high: 10 },
        lumpSumHKD: 300_000,
      },
    });
    const ex = expenses(25_000);
    const j = journey([
      {
        goalId: "home",
        status: "given_up",
        allowLiquidation: false,
        acceptedSqueeze: false,
      },
      {
        goalId: "edu",
        status: "given_up",
        allowLiquidation: false,
        acceptedSqueeze: false,
      },
      {
        goalId: "wedding",
        status: "applied",
        allowLiquidation: false,
        acceptedSqueeze: true,
        squeezeCutsHKD: { fun: 12_000, discretionary: 0 },
      },
    ]);

    const stress = toCrisisStressTestSummary(
      runCrisisStressTest({
        age: 28,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Healthcare",
        riskProfile: "conservative",
        pyramid: mutated,
        expenses: ex,
        journey: j,
        nowYear: NOW_YEAR,
      }),
    );
    expect(stress.verdict).toBe("SHIELDED");

    const decisions = buildActionGoalsDecisionsPayload({
      pyramid: mutated,
      expenses: ex,
      monthlyIncome: 50_000,
      journey: j,
      crisisStressTest: stress,
      riskProfile: "conservative",
    });

    expect(decisions.goalsGivenUp.map((g) => g.name).sort()).toEqual([
      "Education",
      "Home Deposit",
    ]);
    expect(decisions.goalsApplied[0]).toMatchObject({
      name: "Wedding",
      usedLiquidation: false,
      liquidationSource: null,
    });
    expect(decisions.crisisStressTest.verdict).toBe("SHIELDED");
    expect(decisions.profileBehaviorMismatch).toBe(false);

    const goals = buildDeterministicActionGoalsFallback(
      [
        { rank: 1, category: "goal", leverType: "instant", icon: "Target", impactPoints: 9 },
        { rank: 2, category: "investment", leverType: "structural", icon: "TrendingUp", impactPoints: 6 },
        { rank: 3, category: "savings", leverType: "behavioral", icon: "PiggyBank", impactPoints: 4 },
      ],
      decisions,
    );

    const joined = goals.map((g) => `${g.reasoning.en} ${g.reasoning.zhHant}`).join(" ");
    expect(joined).not.toMatch(/shame|fail|mistake|stupid|foolish/i);
    // Fallbacks never cite given-up goals.
    expect(joined).not.toMatch(/Home Deposit|Education/);
    expect(joined).toMatch(/Wedding|emergency|surplus|Conservative|Balanced|Aggressive|goal journey|6 months|priority/i);
    expect(joined).not.toMatch(STEP_NUMBER_RE);
    for (const g of goals) {
      expect(g.impactPoints).toBeGreaterThan(0);
      expect(g.title.zhHant.length).toBeGreaterThan(0);
      expect(g.reasoning.zhHant).not.toBe(g.reasoning.en);
    }
  });

  it("(c) Conservative quiz + heavy liquidation → profileBehaviorMismatch", () => {
    const mutated = pyramid({
      emergencyFund: { savedAmountHKD: 40_000 },
      investment: {
        riskAllocation: { low: 30, mid: 40, high: 30 },
        lumpSumHKD: 80_000,
      },
    });
    const j = journey([
      {
        goalId: "wedding",
        status: "applied",
        allowLiquidation: true,
        acceptedSqueeze: false,
      },
      {
        goalId: "home",
        status: "applied",
        allowLiquidation: true,
        acceptedSqueeze: false,
      },
    ]);
    expect(isProfileBehaviorMismatch("conservative", j)).toBe(true);

    const stress = toCrisisStressTestSummary(
      runCrisisStressTest({
        age: 40,
        retirementAge: 65,
        monthlyIncome: 55_000,
        industry: "Tech",
        riskProfile: "conservative",
        pyramid: mutated,
        expenses: expenses(),
        journey: j,
        nowYear: NOW_YEAR,
      }),
    );

    const decisions = buildActionGoalsDecisionsPayload({
      pyramid: mutated,
      expenses: expenses(),
      monthlyIncome: 55_000,
      journey: j,
      crisisStressTest: stress,
      riskProfile: "conservative",
    });

    expect(decisions.riskQuizProfile).toBe("Conservative");
    expect(decisions.profileBehaviorMismatch).toBe(true);
    expect(
      decisions.goalsApplied.every((g) => g.usedLiquidation === true),
    ).toBe(true);

    const rating = computeFinancialRating({
      pyramid: mutated,
      benchmarks: {
        medicalCoveragePercent: 80,
        criticalIllnessAmountHKD: 800_000,
        emergencyFundTargetMonths: 6,
        emergencyFundTargetHKD: 180_000,
      },
      stressTest: {
        monthlySurplusByYear: [
          { year: 1, income: 55_000, expenses: 28_000, surplus: 27_000 },
        ],
        emergencyFundProjection: {
          targetMonths: 6,
          projectedMonths: 2,
          status: "amber",
        },
        goalProjections: [],
      },
      crisisStressTest: stress,
      journey: j,
    });

    // Ranker must use post-liquidation balances from mutated pyramid.
    expect(rating.breakdown.emergencyFund).toBeLessThan(50);
    expect(rating.breakdown.crisisResilience).toBe(stress.resilienceScore);

    const goals = buildDeterministicActionGoalsFallback(
      [
        { rank: 1, category: "savings", leverType: "instant", icon: "PiggyBank", impactPoints: 16 },
        { rank: 2, category: "protection", leverType: "structural", icon: "Shield", impactPoints: 11 },
        { rank: 3, category: "goal", leverType: "behavioral", icon: "Target", impactPoints: 8 },
      ],
      decisions,
    );
    expect(goals.every((g) => !STEP_NUMBER_RE.test(g.reasoning.en))).toBe(true);
    expect(
      goals.some((g) =>
        /Wedding|Home Deposit|goal journey|stress test|emergency|surplus|protection/i.test(
          g.reasoning.en,
        ),
      ),
    ).toBe(true);
  });

  it("does not dump raw session fields — payload only has curated keys", () => {
    const stress = toCrisisStressTestSummary(
      runCrisisStressTest({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 40_000,
        industry: "Tech",
        riskProfile: "balanced",
        pyramid: pyramid(),
        expenses: expenses(),
        nowYear: NOW_YEAR,
      }),
    );
    const decisions = buildActionGoalsDecisionsPayload({
      pyramid: pyramid(),
      expenses: expenses(),
      monthlyIncome: 40_000,
      journey: journey([]),
      crisisStressTest: stress,
      riskProfile: "balanced",
    });
    expect(Object.keys(decisions).sort()).toEqual(
      [
        "crisisStressTest",
        "goalsApplied",
        "goalsGivenUp",
        "postJourneyState",
        "profileBehaviorMismatch",
        "riskQuizProfile",
        "runway",
        "squeezesAccepted",
        "squeezesRejected",
      ].sort(),
    );
  });
});
