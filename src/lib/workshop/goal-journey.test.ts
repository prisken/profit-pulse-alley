import { describe, expect, it } from "vitest";

import {
  applyGoalDecision,
  buildGoalJourneyRailItems,
  computeGoalOutlook,
  deriveGoalJourneyDecisionRecap,
  emptyGoalJourneyState,
  isRailGoalLocked,
  normalizeGoalsLayerForPyramid,
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
  it("builds rail items sorted by target age (all goals are spend goals)", () => {
    const items = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "home", targetAge: 40, targetAmountHKD: 100_000 }),
        goal({
          id: "nest",
          targetAge: 65,
          targetAmountHKD: 5_000_000,
        }),
        goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
      ],
    });
    expect(items.map((row) => row.id)).toEqual(["trip", "home", "nest"]);
  });

  it("normalizes pyramid goals: every goal kept as spend, sorted by age", () => {
    const normalized = normalizeGoalsLayerForPyramid(
      [
        goal({
          id: "nest-b",
          targetAge: 70,
          targetAmountHKD: 3_000_000,
        }),
        goal({ id: "home", targetAge: 40, targetAmountHKD: 100_000 }),
        goal({
          id: "nest-a",
          targetAge: 60,
          targetAmountHKD: 5_000_000,
        }),
        goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
      ],
      { userAge: 35, retirementAge: 65 },
    );
    expect(normalized.map((row) => row.id)).toEqual([
      "trip",
      "home",
      "nest-a",
      "nest-b",
    ]);
  });

  it("locks later rail goals until earlier decisions are applied or given up", () => {
    const items = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
        goal({ id: "home", targetAge: 40, targetAmountHKD: 100_000 }),
      ],
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

  it("accepting a squeeze mutates canonical expenses, then improves the rerun outlook", () => {
    const state = pyramid({
      investment: {
        riskAllocation: { low: 0, mid: 100, high: 0 },
        lumpSumHKD: 0,
      },
      goals: {
        goals: [goal({ id: "home", targetAge: 36, targetAmountHKD: 150_000 })],
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

    expect(beforeTimeline.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(37);
    expect(
      applied.expenses.categories.find((row) => row.key === "discretionary")?.amountHKD,
    ).toBe(750);
    expect(afterTimeline.goals.find((row) => row.goalId === "home")?.attainedAtAge).toBe(36);
  });

  it("excluded goals never appear in spend projections", () => {
    const state = pyramid({
      goals: {
        goals: [
          goal({ id: "trip", targetAge: 36, targetAmountHKD: 30_000 }),
          goal({
            id: "nest",
            targetAge: 65,
            targetAmountHKD: 5_000_000,
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
  });

  it("derives decision recap counts, chips, and monthly plan from squeezes", () => {
    const rail = buildGoalJourneyRailItems({
      goals: [
        goal({ id: "trip", targetAge: 40, targetAmountHKD: 50_000 }),
        goal({ id: "home", targetAge: 45, targetAmountHKD: 800_000 }),
      ],
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
            squeezeCutsHKD: { fun: 0, discretionary: 12_000 },
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
            targetAge: 40,
            inflatedTargetHKD: 50_000,
            attainedAtAge: 40,
            status: "green",
          },
        ],
        rows: [],
        emergencyFund: { status: "green", targetHKD: 1, targetMonths: 6 },
        retirement: {
          retirementAge: 65,
          passiveIncomeAtRetirement: 0,
          assetsAtRetirement: 0,
          assetsDepletedAtAge: null,
        },
        blendedRate: 0.03,
        engineRevision: 4,
      },
      expenses: exp,
    });

    expect(recap.onTimeCount).toBe(1);
    expect(recap.delayedCount).toBe(0);
    expect(recap.givenUpCount).toBe(1);
    expect(recap.chips).toHaveLength(2);
    expect(recap.monthlyPlan).toEqual({
      // after = 14_000 expenses; cut = 12k/12 = 1_000/mo
      beforeTotalHKD: 15_000,
      afterTotalHKD: 14_000,
    });
  });
});
