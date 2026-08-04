import { describe, expect, it } from "vitest";

import {
  applyGoalDecision,
  buildGoalJourneyRailItems,
  computeGoalOutlook,
  deriveGoalJourneyDecisionRecap,
  emptyGoalJourneyState,
  isRailGoalLocked,
  rerunTimelineForJourney,
} from "@/lib/workshop/goal-journey";
import { solveSqueeze } from "@/lib/workshop/squeeze-solver";
import type {
  ExpensesState,
  GoalItem,
  PyramidState,
} from "@/lib/workshop/types";

const NOW_YEAR = 2026;

function goal(
  partial: Partial<GoalItem> & Pick<GoalItem, "id" | "targetAge" | "targetAmountHKD">,
): GoalItem {
  return {
    icon: "Target",
    label: { en: partial.id, zhHant: partial.id },
    targetYear: NOW_YEAR + (partial.targetAge - 35),
    goalType: "spend",
    ...partial,
  };
}

function pyramid(overrides?: Partial<PyramidState>): PyramidState {
  const base: PyramidState = {
    protection: {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 500_000,
    },
    emergencyFund: { savedAmountHKD: 0 },
    goals: { goals: [] },
    investment: {
      riskAllocation: { low: 0, mid: 100, high: 0 },
      lumpSumHKD: 0,
      monthlyInvestmentHKD: 0,
      monthlyFunHKD: 0,
    },
  };
  return {
    ...base,
    ...overrides,
    protection: { ...base.protection, ...overrides?.protection },
    emergencyFund: { ...base.emergencyFund, ...overrides?.emergencyFund },
    goals: overrides?.goals ?? base.goals,
    investment: { ...base.investment, ...overrides?.investment },
  };
}

function expenses(overrides?: Partial<ExpensesState>): ExpensesState {
  const categories = overrides?.categories ?? [
    { key: "housing", icon: "Home", amountHKD: 8_000 },
    { key: "food_living", icon: "UtensilsCrossed", amountHKD: 3_000 },
    { key: "transport", icon: "Bus", amountHKD: 1_000 },
    { key: "insurance", icon: "Shield", amountHKD: 0 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 3_000 },
  ];
  return {
    categories,
    totalHKD:
      overrides?.totalHKD ??
      categories.reduce((sum, row) => sum + row.amountHKD, 0),
  };
}

describe("goal journey", () => {
  it("builds rail items with spend goals by age and retirement always last", () => {
    const items = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "home", targetAge: 40, targetAmountHKD: 100_000 }),
        goal({
          id: "nest",
          targetAge: 65,
          targetAmountHKD: 5_000_000,
          goalType: "retirementTarget",
        }),
        goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
      ],
      retirementAge: 65,
      userAge: 35,
    });
    expect(items.map((row) => row.id)).toEqual(["trip", "home", "nest"]);
  });

  it("locks later rail goals until earlier decisions are applied or given up", () => {
    const items = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
        goal({ id: "home", targetAge: 40, targetAmountHKD: 100_000 }),
      ],
      retirementAge: 65,
      userAge: 35,
    });
    expect(isRailGoalLocked(items, emptyGoalJourneyState(), 0)).toBe(false);
    expect(isRailGoalLocked(items, emptyGoalJourneyState(), 1)).toBe(true);
    expect(
      isRailGoalLocked(items, {
        decisions: [
          {
            goalId: "trip",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }, 1),
    ).toBe(false);
  });

  it("giving up an earlier goal frees resources for later goals in the same concurrent rerun", () => {
    const state = pyramid({
      goals: {
        goals: [
          goal({ id: "trip", targetAge: 36, targetAmountHKD: 60_000 }),
          goal({ id: "home", targetAge: 37, targetAmountHKD: 150_000 }),
        ],
      },
    });

    const before = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 20_000,
      industry: "Tech",
      pyramid: state,
      expenses: expenses({ totalHKD: 15_000 }),
      journey: emptyGoalJourneyState(),
      nowYear: NOW_YEAR,
    });

    const after = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 20_000,
      industry: "Tech",
      pyramid: state,
      expenses: expenses({ totalHKD: 15_000 }),
      journey: {
        decisions: [
          {
            goalId: "trip",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      nowYear: NOW_YEAR,
    });

    expect(before.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(38);
    expect(after.goals.find((row) => row.goalId === "trip")).toBeUndefined();
    expect(after.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(37);
  });

  it("keeps a goal liquid-only until the user applies liquidation", () => {
    const state = pyramid({
      investment: {
        riskAllocation: { low: 0, mid: 100, high: 0 },
        lumpSumHKD: 200_000,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 0,
      },
      emergencyFund: { savedAmountHKD: 20_000 },
      goals: {
        goals: [goal({ id: "car", targetAge: 36, targetAmountHKD: 100_000 })],
      },
    });

    const baseJourney = emptyGoalJourneyState();
    const before = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 10_000,
      industry: "Tech",
      pyramid: state,
      expenses: expenses({ totalHKD: 9_000 }),
      journey: baseJourney,
      nowYear: NOW_YEAR,
    });

    const applied = applyGoalDecision(
      {
        pyramid: state,
        expenses: expenses({ totalHKD: 9_000 }),
        journey: baseJourney,
      },
      "car",
      {
        goalId: "car",
        status: "applied",
        allowLiquidation: true,
        acceptedSqueeze: false,
      },
    );

    const after = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 10_000,
      industry: "Tech",
      pyramid: applied.pyramid,
      expenses: applied.expenses,
      journey: applied.journey,
      nowYear: NOW_YEAR,
    });

    expect(before.goals.find((row) => row.goalId === "car")?.attainedAtAge).toBe(40);
    expect(before.rows.find((row) => row.age === 36)?.investedLiquidatedHKD).toBe(0);
    expect(after.goals.find((row) => row.goalId === "car")?.attainedAtAge).toBe(36);
    expect(after.rows.find((row) => row.age === 36)?.investedLiquidatedHKD).toBeGreaterThan(0);
  });

  it("accepting a squeeze mutates canonical fun and expenses, then improves the rerun outlook", () => {
    const state = pyramid({
      investment: {
        riskAllocation: { low: 0, mid: 100, high: 0 },
        lumpSumHKD: 0,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 2_000,
      },
      goals: {
        goals: [goal({ id: "home", targetAge: 36, targetAmountHKD: 120_000 })],
      },
    });
    const monthlyExpenses = expenses();
    const journey = emptyGoalJourneyState();

    const beforeTimeline = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 20_000,
      industry: "Tech",
      pyramid: state,
      expenses: monthlyExpenses,
      journey,
      nowYear: NOW_YEAR,
    });
    const beforeOutlook = computeGoalOutlook(
      beforeTimeline,
      state.goals.goals[0]!,
    );
    const recommendation = solveSqueeze({
      requiredExtraMonthlyHKD: beforeOutlook.requiredExtraMonthlyHKD,
      monthsLate: beforeOutlook.monthsLate,
      targetAge: 36,
      monthlyIncomeHKD: 20_000,
      expenses: monthlyExpenses,
      monthlyFunHKD: state.investment.monthlyFunHKD,
      monthlyInvestmentHKD: state.investment.monthlyInvestmentHKD,
    });

    expect(recommendation).not.toBeNull();

    const applied = applyGoalDecision(
      {
        pyramid: state,
        expenses: monthlyExpenses,
        journey,
        squeezeRecommendation: recommendation,
      },
      "home",
      {
        goalId: "home",
        status: "applied",
        allowLiquidation: false,
        acceptedSqueeze: true,
      },
    );

    const afterTimeline = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 20_000,
      industry: "Tech",
      pyramid: applied.pyramid,
      expenses: applied.expenses,
      journey: applied.journey,
      nowYear: NOW_YEAR,
    });

    expect(beforeTimeline.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(38);
    expect(applied.pyramid.investment.monthlyFunHKD).toBe(0);
    expect(
      applied.expenses.categories.find((row) => row.key === "discretionary")?.amountHKD,
    ).toBe(1310);
    expect(afterTimeline.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(36);
  });

  it("excluded goals never appear in spend projections or retirement targets", () => {
    const state = pyramid({
      goals: {
        goals: [
          goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
          goal({
            id: "nest",
            targetAge: 65,
            targetAmountHKD: 5_000_000,
            goalType: "retirementTarget",
          }),
        ],
      },
    });

    const timeline = rerunTimelineForJourney({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 20_000,
      industry: "Tech",
      pyramid: state,
      expenses: expenses({ totalHKD: 15_000 }),
      journey: {
        decisions: [
          {
            goalId: "trip",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
          {
            goalId: "nest",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      nowYear: NOW_YEAR,
    });

    expect(timeline.goals.find((row) => row.goalId === "trip")).toBeUndefined();
    expect(timeline.goals.find((row) => row.goalId === "nest")).toBeUndefined();
    expect(timeline.retirementTargets.find((row) => row.goalId === "nest")).toBeUndefined();
  });

  it("derives decision recap counts, chips, and monthly plan from squeezes", () => {
    const rail = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "trip", targetAge: 40, targetAmountHKD: 50_000 }),
        goal({ id: "home", targetAge: 45, targetAmountHKD: 800_000 }),
      ],
      retirementAge: 65,
      userAge: 35,
    });
    const exp = expenses({
      categories: [
        { key: "housing", icon: "Home", amountHKD: 8_000 },
        { key: "food_living", icon: "UtensilsCrossed", amountHKD: 3_000 },
        { key: "transport", icon: "Bus", amountHKD: 1_000 },
        { key: "insurance", icon: "Shield", amountHKD: 0 },
        { key: "discretionary", icon: "Sparkles", amountHKD: 2_000 },
      ],
    });
    const recap = deriveGoalJourneyDecisionRecap({
      railItems: rail,
      journey: {
        decisions: [
          {
            goalId: "trip",
            status: "applied",
            allowLiquidation: false,
            acceptedSqueeze: true,
            squeezeCutsHKD: { fun: 24_000, discretionary: 12_000 },
          },
          {
            goalId: "home",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      timeline: {
        goals: [
          {
            goalId: "trip",
            goalType: "spend",
            targetAge: 40,
            inflatedTargetHKD: 50_000,
            attainedAtAge: 40,
            status: "green",
          },
        ],
        rows: [],
        retirementTargets: [],
        emergencyFund: { status: "green", targetHKD: 1, targetMonths: 6 },
        retirement: {
          retirementAge: 65,
          passiveIncomeAtRetirement: 0,
          assetsAtRetirement: 0,
          assetsDepletedAtAge: null,
        },
        blendedRate: 0.03,
        engineRevision: 3,
      },
      expenses: exp,
      monthlyFunHKD: 1_000,
    });

    expect(recap.onTimeCount).toBe(1);
    expect(recap.delayedCount).toBe(0);
    expect(recap.givenUpCount).toBe(1);
    expect(recap.chips).toHaveLength(2);
    expect(recap.monthlyPlan).toEqual({
      // after = 14_000 expenses + 1_000 fun; cuts = (24k+12k)/12 = 3_000
      beforeTotalHKD: 18_000,
      afterTotalHKD: 15_000,
    });
  });
});
