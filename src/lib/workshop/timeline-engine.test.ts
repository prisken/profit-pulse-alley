import { describe, expect, it } from "vitest";

import {
  blendedAnnualReturn,
  LIQUID_REAL_RETURN,
  RETURN_RATES,
} from "@/lib/workshop/investment-returns";
import { advanceMonthlyIncomeForYear } from "@/lib/workshop/macro-simulation";
import {
  goalStatusAtYear,
  OVERSAVED_EF_MULTIPLIER,
  runLifeTimeline,
  type TimelineInput,
} from "@/lib/workshop/timeline-engine";
import type { GoalItem } from "@/lib/workshop/types";

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

function baseInput(overrides?: Partial<TimelineInput>): TimelineInput {
  const base: TimelineInput = {
    age: 35,
    retirementAge: 65,
    monthlyIncome: 50_000,
    monthlyExpenses: 20_000,
    emergencyFundSavedHKD: 120_000,
    investment: {
      lumpSumHKD: 200_000,
      allocation: { low: 40, mid: 40, high: 20 },
    },
    goals: [
      goal({
        id: "wedding",
        targetAge: 40,
        targetAmountHKD: 150_000,
      }),
    ],
    industry: "Tech",
    nowYear: NOW_YEAR,
  };
  if (!overrides) {
    return base;
  }
  return {
    ...base,
    ...overrides,
    investment: {
      ...base.investment,
      ...overrides.investment,
    },
  };
}

describe("real-term return constants", () => {
  it("exposes real L/M/H rates (nominal − 3%)", () => {
    expect(RETURN_RATES).toEqual({ low: -0.01, mid: 0.03, high: 0.07 });
    expect(LIQUID_REAL_RETURN).toBe(-0.03);
  });

  it("blends 50/30/20 → 0.018 real", () => {
    expect(blendedAnnualReturn({ low: 50, mid: 30, high: 20 })).toBeCloseTo(
      0.018,
      10,
    );
  });
});

describe("advanceMonthlyIncomeForYear (real career curve)", () => {
  it("grows +2% before 40, +1% until 50, flat after", () => {
    expect(
      advanceMonthlyIncomeForYear({
        monthlyIncome: 100_000,
        industry: "Tech",
        age: 35,
        year: 1,
      }),
    ).toBeCloseTo(102_000, 2);
    expect(
      advanceMonthlyIncomeForYear({
        monthlyIncome: 100_000,
        industry: "Tech",
        age: 45,
        year: 1,
      }),
    ).toBeCloseTo(101_000, 2);
    expect(
      advanceMonthlyIncomeForYear({
        monthlyIncome: 100_000,
        industry: "Tech",
        age: 55,
        year: 1,
      }),
    ).toBeCloseTo(100_000, 2);
  });
});

describe("runLifeTimeline", () => {
  it("is deterministic for the same input", () => {
    const input = baseInput();
    const a = runLifeTimeline(input);
    const b = runLifeTimeline(input);
    expect(a).toEqual(b);
  });

  it("stops salary exactly at retirementAge and starts passive income", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 63,
        retirementAge: 65,
        investment: {
          lumpSumHKD: 1_000_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
      }),
    );

    const at64 = result.rows.find((r) => r.age === 64)!;
    const at65 = result.rows.find((r) => r.age === 65)!;

    expect(at64.salaryIncome).toBeGreaterThan(0);
    expect(at64.passiveIncome).toBe(0);

    expect(at65.salaryIncome).toBe(0);
    expect(at65.passiveIncome).toBeGreaterThan(0);
    expect(result.retirement.passiveIncomeAtRetirement).toBe(at65.passiveIncome);
    expect(result.retirement.retirementAge).toBe(65);
  });

  it("compounds investedPool at real L/M/H rates during working years", () => {
    const years = 5;
    const start = 100_000;

    const low = runLifeTimeline(
      baseInput({
        age: 30,
        retirementAge: 30 + years + 5,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFundSavedHKD: 0,
        goals: [],
        investment: {
          lumpSumHKD: start,
          allocation: { low: 100, mid: 0, high: 0 },
        },
      }),
    );
    const mid = runLifeTimeline(
      baseInput({
        age: 30,
        retirementAge: 30 + years + 5,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFundSavedHKD: 0,
        goals: [],
        investment: {
          lumpSumHKD: start,
          allocation: { low: 0, mid: 100, high: 0 },
        },
      }),
    );
    const high = runLifeTimeline(
      baseInput({
        age: 30,
        retirementAge: 30 + years + 5,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFundSavedHKD: 0,
        goals: [],
        investment: {
          lumpSumHKD: start,
          allocation: { low: 0, mid: 0, high: 100 },
        },
      }),
    );

    const at = (rows: typeof low.rows, age: number) =>
      rows.find((r) => r.age === age)!.investedPool;

    const checkAge = 30 + years - 1;
    expect(at(low.rows, checkAge)).toBeCloseTo(start * 0.99 ** years, 2);
    expect(at(mid.rows, checkAge)).toBeCloseTo(start * 1.03 ** years, 2);
    expect(at(high.rows, checkAge)).toBeCloseTo(start * 1.07 ** years, 2);
  });

  it("decays idle liquid at −3% real per year", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 40,
        retirementAge: 65,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFundSavedHKD: 100_000,
        goals: [],
        investment: {
          lumpSumHKD: 0,
          allocation: { low: 100, mid: 0, high: 0 },
        },
      }),
    );
    const at40 = result.rows.find((r) => r.age === 40)!;
    expect(at40.liquidPool).toBeCloseTo(100_000 * 0.97, 2);
  });

  it("holds expenses flat in real terms (no inflation, no fun line)", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 80_000,
        monthlyExpenses: 20_000,
        goals: [],
      }),
    );
    const at35 = result.rows.find((r) => r.age === 35)!;
    const at50 = result.rows.find((r) => r.age === 50)!;
    expect(at35.expenses).toBeCloseTo(20_000 * 12, 2);
    expect(at50.expenses).toBeCloseTo(at35.expenses, 2);
  });

  it("sends the full working-year surplus to liquid (no monthly-investing input)", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        monthlyExpenses: 20_000,
        emergencyFundSavedHKD: 100_000,
        goals: [],
        investment: {
          lumpSumHKD: 0,
          allocation: { low: 100, mid: 0, high: 0 },
        },
      }),
    );

    const row = result.rows.find((r) => r.age === 35)!;
    // Surplus = (600k − 240k) = 360k → all liquid; invested stays 0.
    expect(row.surplus).toBeCloseTo(360_000, 2);
    expect(row.liquidPool).toBeCloseTo(100_000 * 0.97 + 360_000, 2);
    expect(row.investedPool).toBeCloseTo(0, 2);
  });

  it("keeps lump-sum capital invested at the blended return (no contributions)", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        monthlyExpenses: 20_000,
        emergencyFundSavedHKD: 0,
        goals: [],
        investment: {
          lumpSumHKD: 100_000,
          allocation: { low: 100, mid: 0, high: 0 },
        },
      }),
    );

    const row = result.rows.find((r) => r.age === 35)!;
    expect(row.liquidPool).toBeCloseTo(360_000, 2);
    expect(row.investedPool).toBeCloseTo(100_000 * (1 - 0.01), 2);
  });

  it("liquidates invested when liquid is short for an opted-in spend goal", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 10_000,
        monthlyExpenses: 9_000,
        emergencyFundSavedHKD: 20_000,
        investment: {
          lumpSumHKD: 200_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
        goals: [
          goal({
            id: "car",
            targetAge: 36,
            targetAmountHKD: 100_000,
            allowLiquidation: true,
          }),
        ],
      }),
    );

    const atPay = result.rows.find((r) => r.age === 36)!;
    const goalProj = result.goals.find((g) => g.goalId === "car")!;

    expect(goalProj.attainedAtAge).toBe(36);
    expect(atPay.investedLiquidatedHKD).toBeGreaterThan(0);
    expect(atPay.liquidPool).toBe(0);
  });

  it("keeps a spend goal liquid-only unless it opts into liquidation", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 10_000,
        monthlyExpenses: 9_000,
        emergencyFundSavedHKD: 20_000,
        investment: {
          lumpSumHKD: 200_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
        goals: [
          goal({
            id: "car",
            targetAge: 36,
            targetAmountHKD: 1_000_000,
          }),
        ],
      }),
    );

    const atPay = result.rows.find((r) => r.age === 36)!;
    const goalProj = result.goals.find((g) => g.goalId === "car")!;

    expect(goalProj.attainedAtAge).toBeNull();
    expect(goalProj.status).toBe("red");
    expect(atPay.investedLiquidatedHKD).toBe(0);
    expect(atPay.investedPool).toBeGreaterThan(0);
  });

  it("treats every goal as a spend goal — never deducted pre-target, funded at target age", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 60,
        retirementAge: 65,
        monthlyIncome: 40_000,
        monthlyExpenses: 20_000,
        emergencyFundSavedHKD: 100_000,
        investment: {
          lumpSumHKD: 500_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
        goals: [
          goal({
            id: "nest",
            targetAge: 65,
            targetAmountHKD: 50_000_000,
          }),
        ],
      }),
    );

    const projection = result.goals.find((row) => row.goalId === "nest")!;
    expect(projection.targetAge).toBe(65);
    expect(projection.inflatedTargetHKD).toBe(50_000_000);
    // Way out of reach → never attained, red.
    expect(projection.attainedAtAge).toBeNull();
    expect(projection.status).toBe("red");

    const at65 = result.rows.find((r) => r.age === 65)!;
    expect(at65.investedLiquidatedHKD).toBe(0);
    expect(at65.liquidPool + at65.investedPool).toBeGreaterThan(100_000);
  });

  it("high saver sustains past 90 with invested pool in a plausible real band", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyIncome: 130_000,
        monthlyExpenses: 65_000,
        emergencyFundSavedHKD: 200_000,
        investment: {
          lumpSumHKD: 2_000_000,
          allocation: { low: 0, mid: 20, high: 80 },
        },
        goals: [],
      }),
    );

    expect(result.retirement.assetsDepletedAtAge).toBeNull();
    const at90 = result.rows.find((r) => r.age === 90)!;
    expect(at90.liquidPool + at90.investedPool).toBeGreaterThan(0);
    // Guard against accidental reversion to nominal compounding (~much higher).
    expect(at90.investedPool).toBeGreaterThanOrEqual(5_000_000);
    expect(at90.investedPool).toBeLessThanOrEqual(60_000_000);
  });

  it("keeps goal targets in today's HKD (no inflation)", () => {
    const amount = 100_000;
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        monthlyIncome: 100_000,
        monthlyExpenses: 5_000,
        emergencyFundSavedHKD: 1_000_000,
        goals: [
          goal({
            id: "flat",
            targetAge: 40,
            targetAmountHKD: amount,
          }),
        ],
      }),
    );

    expect(result.goals[0]!.inflatedTargetHKD).toBeCloseTo(amount, 2);
  });

  it("covers retirement shortfall from liquid then invested", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 64,
        retirementAge: 65,
        monthlyIncome: 0,
        monthlyExpenses: 30_000,
        emergencyFundSavedHKD: 50_000,
        investment: {
          lumpSumHKD: 200_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
        goals: [],
      }),
    );

    const at65 = result.rows.find((r) => r.age === 65)!;
    expect(at65.liquidPool).toBe(0);
    expect(at65.investedPool).toBeLessThan(200_000);
    expect(at65.salaryIncome).toBe(0);
  });

  it("sets assetsDepletedAtAge when both pools exhaust in retirement", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 70,
        retirementAge: 65,
        monthlyIncome: 0,
        monthlyExpenses: 40_000,
        emergencyFundSavedHKD: 10_000,
        investment: {
          lumpSumHKD: 20_000,
          allocation: { low: 0, mid: 100, high: 0 },
        },
        goals: [],
      }),
    );

    expect(result.retirement.assetsDepletedAtAge).not.toBeNull();
    expect(result.retirement.assetsDepletedAtAge!).toBeGreaterThanOrEqual(70);
    const depleted = result.rows.find(
      (r) => r.age === result.retirement.assetsDepletedAtAge,
    )!;
    expect(depleted.liquidPool).toBe(0);
    expect(depleted.investedPool).toBe(0);
  });

  it("marks oversaved EF with opportunity cost vs cash real decay", () => {
    const saved = Math.round(120_000 * OVERSAVED_EF_MULTIPLIER) + 50_000;
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        retirementAge: 65,
        monthlyExpenses: 20_000,
        emergencyFundSavedHKD: saved,
        goals: [],
      }),
    );

    expect(result.emergencyFund.status).toBe("oversaved");
    expect(result.emergencyFund.excessHKD).toBeGreaterThan(0);
    expect(result.emergencyFund.opportunityCostHKD).toBeGreaterThan(0);
  });
});

describe("goalStatusAtYear", () => {
  it("marks spend goals attained / on_track / late / never", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 35,
        monthlyIncome: 80_000,
        monthlyExpenses: 10_000,
        emergencyFundSavedHKD: 500_000,
        goals: [
          goal({ id: "car", targetAge: 40, targetAmountHKD: 80_000 }),
        ],
      }),
    );

    const statuses = (year: number) =>
      Object.fromEntries(
        goalStatusAtYear(result, year).map((s) => [s.goalId, s.status]),
      );

    expect(statuses(NOW_YEAR).car).toBe("on_track");
    const attained = result.goals[0]!.attainedAtAge!;
    const attainedYear = NOW_YEAR + (attained - 35);
    expect(statuses(attainedYear).car).toBe("attained");
  });

  it("treats a fully-funded spend goal as attained on time", () => {
    const result = runLifeTimeline(
      baseInput({
        age: 60,
        retirementAge: 65,
        monthlyIncome: 100_000,
        monthlyExpenses: 20_000,
        emergencyFundSavedHKD: 2_000_000,
        investment: {
          lumpSumHKD: 5_000_000,
          allocation: { low: 40, mid: 40, high: 20 },
        },
        goals: [
          goal({
            id: "nest",
            targetAge: 65,
            targetAmountHKD: 1_000_000,
          }),
        ],
      }),
    );

    const projection = result.goals.find((row) => row.goalId === "nest")!;
    expect(projection.status).toBe("green");
    const before = goalStatusAtYear(result, NOW_YEAR);
    expect(before[0]!.status).toBe("on_track");
  });
});
