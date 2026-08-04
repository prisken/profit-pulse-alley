import { describe, expect, it } from "vitest";

import { bilingualBoth } from "@/lib/workshop/bilingual";
import {
  CPI_INFLATION,
  GROWTH_MARKET_RETURN,
  GROWTH_SHOCK_EVERY_N_YEARS,
  GROWTH_SHOCK_RETURN,
  INFLATION_RATE,
  applyCrisisImpactsToStressTest,
  applyCrisisToTimeline,
  runGoalStressTest,
  simulateMacroTimeline,
} from "@/lib/workshop/macro-simulation";
import type {
  ExpensesState,
  PyramidState,
} from "@/lib/workshop/types";

describe("simulateMacroTimeline", () => {
  it("erodes foundation monotonically under CPI when cash is untouched (flat industry)", () => {
    const result = simulateMacroTimeline({
      age: 40,
      industry: "Civil Service",
      monthlyIncome: 50_000,
      years: 10,
      pyramid: {
        foundation: 300_000,
        core: 100_000,
        growth: 200_000,
        apex: 0,
      },
    });

    expect(result.yearByYear.length).toBeGreaterThan(1);

    const foundations = result.yearByYear.map((row) => row.foundation);
    for (let i = 1; i < foundations.length; i += 1) {
      expect(foundations[i]!).toBeLessThan(foundations[i - 1]!);
    }

    // Year-1 foundation should match one CPI erosion step from the start.
    const year1 = result.yearByYear.find((row) => row.year === 1);
    expect(year1).toBeDefined();
    expect(year1!.foundation).toBeCloseTo(300_000 / (1 + CPI_INFLATION), 2);
  });

  it("applies a visible growth-layer dip on deterministic shock years", () => {
    const startGrowth = 500_000;
    const result = simulateMacroTimeline({
      age: 35,
      industry: "Civil Service",
      monthlyIncome: 40_000,
      years: 12,
      pyramid: {
        foundation: 50_000,
        core: 50_000,
        growth: startGrowth,
        apex: 0,
      },
    });

    const byYear = new Map(result.yearByYear.map((row) => [row.year, row]));

    // Rebuild growth path to assert shock-year behavior at years 6 and 12.
    let growth = startGrowth;
    const growthBySimYear = new Map<number, number>();
    for (let year = 1; year <= 12; year += 1) {
      const ret =
        year % GROWTH_SHOCK_EVERY_N_YEARS === 0
          ? GROWTH_SHOCK_RETURN
          : GROWTH_MARKET_RETURN;
      growth = growth * (1 + ret);
      growthBySimYear.set(year, growth);
    }

    const year5 = byYear.get(5);
    const year7 = byYear.get(7);
    expect(year5).toBeDefined();
    expect(year7).toBeDefined();

    // Between year 5 and 7 sits shock year 6 (−18%). Net growth should dip
    // versus a pure +6% path across that window.
    const purePathFrom5to7 = year5!.growth * (1 + GROWTH_MARKET_RETURN) ** 2;
    expect(year7!.growth).toBeLessThan(purePathFrom5to7);

    // Shock magnitude is large enough to be visible vs prior snapshot year.
    expect(year7!.growth).toBeLessThan(year5!.growth * 1.02);

    expect(growthBySimYear.get(6)!).toBeCloseTo(
      startGrowth *
        (1 + GROWTH_MARKET_RETURN) ** 5 *
        (1 + GROWTH_SHOCK_RETURN),
      2,
    );
  });

  it("only returns snapshot years within the requested horizon", () => {
    const result = simulateMacroTimeline({
      age: 30,
      industry: "Tech",
      monthlyIncome: 60_000,
      years: 5,
      pyramid: {
        foundation: 100_000,
        core: 80_000,
        growth: 120_000,
        apex: 0,
      },
    });

    expect(result.yearByYear.map((row) => row.year)).toEqual([1, 3, 5]);
  });
});

describe("applyCrisisToTimeline", () => {
  it("drains foundation before core and records zero months", () => {
    const result = applyCrisisToTimeline({
      monthlyIncome: 50_000,
      yearByYear: [
        {
          year: 1,
          netWorth: 200_000,
          foundation: 80_000,
          core: 40_000,
          growth: 80_000,
          monthsOfEmergencyCover: 4,
        },
      ],
      crisis: {
        monthlyIncomeImpactPercent: 100,
        oneTimeCostHKD: 30_000,
        durationMonths: 6,
      },
    });

    // Month 0 after 30k one-time: foundation 50k, core 40k
    expect(result.shockTimeline[0]).toMatchObject({
      month: 0,
      foundation: 50_000,
      core: 40_000,
      foundationDepleted: false,
      coreDepleted: false,
    });

    // 50k/mo shortfall — foundation gone in month 1, core drains next
    expect(result.foundationZeroAtMonth).toBe(1);
    expect(result.coreZeroAtMonth).toBe(2);
    expect(result.shockTimeline.find((m) => m.month === 2)?.core).toBe(0);
  });

  it("liquidates growth when foundation and core cannot cover the shortfall", () => {
    const result = applyCrisisToTimeline({
      monthlyIncome: 40_000,
      yearByYear: [
        {
          year: 1,
          netWorth: 130_000,
          foundation: 10_000,
          core: 10_000,
          growth: 100_000,
          monthsOfEmergencyCover: 1,
        },
      ],
      crisis: {
        monthlyIncomeImpactPercent: 100,
        oneTimeCostHKD: 25_000,
        durationMonths: 2,
      },
    });

    // Month 0: 25k cost drains 10k foundation + 10k core + 5k growth
    expect(result.shockTimeline[0]?.growthLiquidated).toBe(5_000);
    expect(result.totalGrowthLiquidated).toBeGreaterThan(0);
    expect(result.shockTimeline[0]?.growth).toBe(95_000);
  });

  it("keeps layers above zero when shock is small", () => {
    const result = applyCrisisToTimeline({
      monthlyIncome: 40_000,
      yearByYear: [
        {
          year: 1,
          netWorth: 500_000,
          foundation: 200_000,
          core: 100_000,
          growth: 200_000,
          monthsOfEmergencyCover: 8,
        },
      ],
      crisis: {
        monthlyIncomeImpactPercent: 10,
        oneTimeCostHKD: 5_000,
        durationMonths: 3,
      },
    });

    expect(result.foundationZeroAtMonth).toBeNull();
    expect(result.coreZeroAtMonth).toBeNull();
    const last = result.shockTimeline[result.shockTimeline.length - 1]!;
    expect(last.foundation).toBeGreaterThan(0);
    expect(last.core).toBeGreaterThan(0);
    expect(result.totalGrowthLiquidated).toBe(0);
  });
});

function makeExpenses(totalMonthly: number): ExpensesState {
  const share = Math.round(totalMonthly / 5);
  const categories: ExpensesState["categories"] = [
    { key: "housing", icon: "Home", amountHKD: share },
    { key: "food_living", icon: "UtensilsCrossed", amountHKD: share },
    { key: "transport", icon: "Bus", amountHKD: share },
    { key: "insurance", icon: "Shield", amountHKD: share },
    {
      key: "discretionary",
      icon: "Sparkles",
      amountHKD: totalMonthly - share * 4,
    },
  ];
  return {
    categories,
    totalHKD: categories.reduce((sum, cat) => sum + cat.amountHKD, 0),
  };
}

function makePyramid(overrides?: {
  emergencyFundHKD?: number;
  goals?: PyramidState["goals"]["goals"];
}): PyramidState {
  return {
    protection: {
      medicalCoveragePercent: 70,
      criticalIllnessAmountHKD: 500_000,
    },
    emergencyFund: {
      savedAmountHKD: overrides?.emergencyFundHKD ?? 0,
    },
    goals: {
      goals: overrides?.goals ?? [
        {
          id: "wedding",
          icon: "Heart",
          label: bilingualBoth("Wedding"),
          targetAmountHKD: 200_000,
          targetAge: 40,
          targetYear: new Date().getFullYear() + 5,
          goalType: "spend",
        },
      ],
    },
    investment: {
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 5_000,
      monthlyInvestmentHKD: 0,
      monthlyFunHKD: 2_000,
    },
  };
}

/** Naive flat-cost completion year using the same surplus path (no goal inflation). */
function flatGoalProjectedYear(
  surplusByYear: Array<{ year: number; surplus: number }>,
  baseTargetHKD: number,
  nowYear: number,
): number | null {
  let accumulated = 0;
  for (const row of surplusByYear) {
    if (row.surplus > 0) {
      accumulated += row.surplus * 12;
    }
    if (accumulated + 1e-6 >= baseTargetHKD) {
      return nowYear + row.year;
    }
  }
  return null;
}

describe("runGoalStressTest", () => {
  it("marks a goal green when surplus is ample relative to the target date", () => {
    const nowYear = new Date().getFullYear();
    // Civil Service EF target = 3 months. Seed EF already full so surplus
    // waterfalls straight to the goal.
    const expenses = makeExpenses(20_000);
    const result = runGoalStressTest({
      age: 35,
      industry: "Civil Service",
      monthlyIncome: 80_000,
      expenses,
      horizonYears: 15,
      pyramid: makePyramid({
        emergencyFundHKD: 3 * 20_000 + 50_000,
        goals: [
          {
            id: "wedding",
            icon: "Heart",
            label: bilingualBoth("Wedding"),
            targetAmountHKD: 400_000,
            targetAge: 40,
            targetYear: nowYear + 8,
            goalType: "spend",
          },
        ],
      }),
    });

    expect(result.monthlySurplusByYear.length).toBe(15);
    expect(result.monthlySurplusByYear[0]!.surplus).toBeGreaterThan(0);

    const goal = result.goalProjections[0]!;
    expect(goal.projectedYear).not.toBeNull();
    expect(goal.projectedYear!).toBeLessThanOrEqual(goal.targetYear);
    expect(goal.status).toBe("green");
    expect(result.emergencyFundProjection.status).toBe("green");
    expect(result.emergencyFundProjection.projectedMonths).toBe(0);
  });

  it("marks a goal red / null when surplus is negative or too thin", () => {
    const nowYear = new Date().getFullYear();
    const result = runGoalStressTest({
      age: 40,
      industry: "Civil Service",
      monthlyIncome: 30_000,
      expenses: makeExpenses(35_000),
      horizonYears: 20,
      pyramid: makePyramid({
        emergencyFundHKD: 0,
        goals: [
          {
            id: "home",
            icon: "Home",
            label: bilingualBoth("Home deposit"),
            targetAmountHKD: 2_000_000,
            targetAge: 40,
            targetYear: nowYear + 5,
            goalType: "spend",
          },
        ],
      }),
    });

    expect(result.monthlySurplusByYear[0]!.surplus).toBeLessThan(0);

    const goal = result.goalProjections[0]!;
    expect(goal.projectedYear).toBeNull();
    expect(goal.status).toBe("red");
    expect(result.emergencyFundProjection.status).toBe("red");
  });

  it("delays projected completion vs a flat-cost naive calc because targets inflate at 3%/year", () => {
    const nowYear = new Date().getFullYear();
    // Sized so flat-cost hits around year 5 while inflated cost needs year 6+.
    const baseTarget = 3_500_000;
    const expenses = makeExpenses(20_000);
    const result = runGoalStressTest({
      age: 32,
      industry: "Civil Service",
      monthlyIncome: 80_000,
      expenses,
      horizonYears: 30,
      pyramid: makePyramid({
        emergencyFundHKD: 3 * 20_000 + 100_000,
        goals: [
          {
            id: "education",
            icon: "GraduationCap",
            label: bilingualBoth("Kids education"),
            targetAmountHKD: baseTarget,
            targetAge: 40,
            targetYear: nowYear + 25,
            goalType: "spend",
          },
        ],
      }),
    });

    const goal = result.goalProjections[0]!;
    expect(goal.projectedYear).not.toBeNull();

    const flatYear = flatGoalProjectedYear(
      result.monthlySurplusByYear,
      baseTarget,
      nowYear,
    );
    expect(flatYear).not.toBeNull();

    // Inflating the goal cost must take strictly longer than paying today's
    // nominal sticker price with the same surplus stream.
    expect(goal.projectedYear!).toBeGreaterThan(flatYear!);

    // Spot-check: year-N inflated target exceeds the flat sticker.
    const sampleYear = Math.max(1, goal.projectedYear! - nowYear - 1);
    const inflatedAtSample = baseTarget * (1 + INFLATION_RATE) ** sampleYear;
    expect(inflatedAtSample).toBeGreaterThan(baseTarget);

    // Expenses themselves also inflate at the named constant.
    const y1 = result.monthlySurplusByYear[0]!;
    const y2 = result.monthlySurplusByYear[1]!;
    expect(y2.expenses).toBeCloseTo(y1.expenses * (1 + INFLATION_RATE), 2);
  });

  it("waterfalls surplus to the soonest targetYear goal before later ones", () => {
    const nowYear = new Date().getFullYear();
    const expenses = makeExpenses(10_000);
    const result = runGoalStressTest({
      age: 30,
      industry: "Civil Service",
      monthlyIncome: 60_000,
      expenses,
      horizonYears: 12,
      pyramid: makePyramid({
        emergencyFundHKD: 3 * 10_000 + 50_000,
        goals: [
          {
            id: "late",
            icon: "Plane",
            label: bilingualBoth("Sabbatical"),
            targetAmountHKD: 300_000,
            targetAge: 40,
            targetYear: nowYear + 10,
            goalType: "spend",
          },
          {
            id: "soon",
            icon: "Heart",
            label: bilingualBoth("Wedding"),
            targetAmountHKD: 300_000,
            targetAge: 40,
            targetYear: nowYear + 3,
            goalType: "spend",
          },
        ],
      }),
    });

    const soon = result.goalProjections.find((g) => g.goalId === "soon")!;
    const late = result.goalProjections.find((g) => g.goalId === "late")!;
    expect(soon.projectedYear).not.toBeNull();
    expect(late.projectedYear).not.toBeNull();
    expect(soon.projectedYear!).toBeLessThanOrEqual(late.projectedYear!);
  });
});

describe("applyCrisisImpactsToStressTest", () => {
  it("delays at least one goal when surplus is hit by a severe crisis", () => {
    const nowYear = new Date().getFullYear();
    const expenses = makeExpenses(20_000);
    const baseline = runGoalStressTest({
      age: 35,
      industry: "Civil Service",
      monthlyIncome: 80_000,
      expenses,
      horizonYears: 20,
      pyramid: makePyramid({
        emergencyFundHKD: 3 * 20_000 + 50_000,
        goals: [
          {
            id: "wedding",
            icon: "Heart",
            label: bilingualBoth("Wedding"),
            targetAmountHKD: 1_200_000,
            targetAge: 40,
            targetYear: nowYear + 10,
            goalType: "spend",
          },
        ],
      }),
    });

    const before = baseline.goalProjections[0]!;
    expect(before.projectedYear).not.toBeNull();

    const shocked = applyCrisisImpactsToStressTest(baseline, {
      crisisType: "market_crash",
      title: bilingualBoth("Test crash"),
      description: bilingualBoth("Synthetic shock for unit test."),
      riskProfile: "aggressive",
      monthlyIncomeImpactPercent: 80,
      oneTimeCostHKD: 200_000,
      durationMonths: 24,
      impacts: [
        {
          layer: "investment",
          icon: "TrendingDown",
          headline: bilingualBoth("Forced sale"),
          detailHKD: 200_000,
        },
        {
          layer: "goals",
          icon: "Target",
          headline: bilingualBoth("Goal delay"),
          detailMonths: 24,
        },
      ],
    });

    const after = shocked.goalProjections[0]!;
    const delayed =
      after.projectedYear === null ||
      (before.projectedYear !== null &&
        after.projectedYear !== null &&
        after.projectedYear > before.projectedYear);
    expect(delayed).toBe(true);

    // Crisis years should show reduced surplus vs baseline.
    expect(shocked.monthlySurplusByYear[0]!.surplus).toBeLessThan(
      baseline.monthlySurplusByYear[0]!.surplus,
    );
  });
});
