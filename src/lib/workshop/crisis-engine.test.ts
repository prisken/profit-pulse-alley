import { describe, expect, it } from "vitest";

import {
  applyCrisis,
  applyCutOrder,
  buildCrisisImpactsFromEngine,
  computeCoverageOffset,
  crisisTouchesProtection,
} from "@/lib/workshop/crisis-engine";
import { runLifeTimeline } from "@/lib/workshop/timeline-engine";
import type { ExpensesState, PyramidState } from "@/lib/workshop/types";

const NOW_YEAR = 2026;

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
          targetAmountHKD: 150_000,
          targetAge: 40,
          targetYear: NOW_YEAR + 5,
          goalType: "spend",
        },
      ],
    },
    investment: {
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 400_000,
      monthlyInvestmentHKD: 8_000,
      monthlyFunHKD: 5_000,
      ...overrides?.investment,
    },
  };
}

const expenses: ExpensesState = {
  totalHKD: 25_000,
  categories: [
    { key: "housing", icon: "Home", amountHKD: 12_000 },
    { key: "food_living", icon: "Utensils", amountHKD: 5_000 },
    { key: "transport", icon: "Bus", amountHKD: 2_000 },
    { key: "insurance", icon: "Shield", amountHKD: 2_000 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 4_000 },
  ],
};

function baseline(pyr: PyramidState = pyramid()) {
  return runLifeTimeline({
    age: 35,
    retirementAge: 65,
    monthlyIncome: 50_000,
    monthlyExpenses: expenses.totalHKD,
    monthlyFun: pyr.investment.monthlyFunHKD,
    emergencyFundSavedHKD: pyr.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: pyr.investment.lumpSumHKD,
      monthlyInvestmentHKD: pyr.investment.monthlyInvestmentHKD,
      allocation: pyr.investment.riskAllocation,
    },
    goals: pyr.goals.goals,
    industry: "Tech",
    nowYear: NOW_YEAR,
  });
}

describe("crisisTouchesProtection", () => {
  it("medical / CI / accident touch protection; others never do", () => {
    expect(crisisTouchesProtection("medical")).toBe(true);
    expect(crisisTouchesProtection("critical_illness")).toBe(true);
    expect(crisisTouchesProtection("accident")).toBe(true);
    expect(crisisTouchesProtection("job_loss")).toBe(false);
    expect(crisisTouchesProtection("market_crash")).toBe(false);
    expect(crisisTouchesProtection("family")).toBe(false);
  });
});

describe("computeCoverageOffset", () => {
  it("medical: 80% coverage offsets 80% of the bill", () => {
    const offset = computeCoverageOffset("medical", 100_000, {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 0,
    });
    expect(offset).not.toBeNull();
    expect(offset!.grossCostHKD).toBe(100_000);
    expect(offset!.coveredHKD).toBe(80_000);
    expect(offset!.uncoveredHKD).toBe(20_000);
    expect(offset!.coverageKind).toBe("medical_percent");
  });

  it("medical: 0% coverage → full bill uncovered", () => {
    const offset = computeCoverageOffset("medical", 100_000, {
      medicalCoveragePercent: 0,
      criticalIllnessAmountHKD: 1_000_000,
    });
    expect(offset!.coveredHKD).toBe(0);
    expect(offset!.uncoveredHKD).toBe(100_000);
  });

  it("critical_illness: full cover when CI ≥ cost", () => {
    const offset = computeCoverageOffset("critical_illness", 400_000, {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 500_000,
    });
    expect(offset!.coveredHKD).toBe(400_000);
    expect(offset!.uncoveredHKD).toBe(0);
    expect(offset!.coverageKind).toBe("critical_illness");
  });

  it("critical_illness: partial cover when CI < cost; zero CI → full bill", () => {
    const partial = computeCoverageOffset("critical_illness", 800_000, {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 300_000,
    });
    expect(partial!.coveredHKD).toBe(300_000);
    expect(partial!.uncoveredHKD).toBe(500_000);

    const none = computeCoverageOffset("critical_illness", 800_000, {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 0,
    });
    expect(none!.coveredHKD).toBe(0);
    expect(none!.uncoveredHKD).toBe(800_000);
  });

  it("job_loss / market_crash / family return null (no protection offset)", () => {
    const prot = {
      medicalCoveragePercent: 80,
      criticalIllnessAmountHKD: 500_000,
    };
    expect(computeCoverageOffset("job_loss", 100_000, prot)).toBeNull();
    expect(computeCoverageOffset("market_crash", 100_000, prot)).toBeNull();
    expect(computeCoverageOffset("family", 100_000, prot)).toBeNull();
  });
});

describe("applyCutOrder", () => {
  it("absorbs fun → discretionary → liquid → invested in order", () => {
    // fun annual 60k, disc annual 48k, liquid 100k, invested 200k
    const cut = applyCutOrder({
      toAbsorbHKD: 250_000,
      monthlyFunHKD: 5_000,
      monthlyDiscretionaryHKD: 4_000,
      liquidPoolHKD: 100_000,
      investedPoolHKD: 200_000,
    });
    expect(cut.funAbsorbedHKD).toBe(60_000);
    expect(cut.discretionaryAbsorbedHKD).toBe(48_000);
    expect(cut.liquidAbsorbedHKD).toBe(100_000);
    // 250k - 60k - 48k - 100k = 42k from invested
    expect(cut.investedAbsorbedHKD).toBe(42_000);
    expect(cut.remainingUncoveredHKD).toBe(0);
    expect(cut.investedRemainingHKD).toBe(158_000);
  });

  it("records remaining when pools are insufficient", () => {
    const cut = applyCutOrder({
      toAbsorbHKD: 500_000,
      monthlyFunHKD: 1_000,
      monthlyDiscretionaryHKD: 1_000,
      liquidPoolHKD: 10_000,
      investedPoolHKD: 10_000,
    });
    expect(cut.funAbsorbedHKD).toBe(12_000);
    expect(cut.discretionaryAbsorbedHKD).toBe(12_000);
    expect(cut.liquidAbsorbedHKD).toBe(10_000);
    expect(cut.investedAbsorbedHKD).toBe(10_000);
    expect(cut.remainingUncoveredHKD).toBe(456_000);
  });
});

describe("applyCrisis", () => {
  it("job_loss never produces a protection coverage card or protection impact", () => {
    const pyr = pyramid();
    const result = applyCrisis(
      baseline(pyr),
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
      },
      {
        crisisType: "job_loss",
        oneTimeCostHKD: 50_000,
        durationMonths: 6,
        monthlyIncomeImpactPercent: 80,
        incomeHitPct: 80,
      },
    );

    expect(result.coverage).toBeNull();
    const impacts = buildCrisisImpactsFromEngine(result);
    expect(impacts.every((i) => i.layer !== "protection")).toBe(true);
    expect(impacts.some((i) => i.stageId === "coverage")).toBe(false);
  });

  it("medical with 80% coverage shows explicit offset; only uncovered hits cut order", () => {
    const pyr = pyramid({
      protection: {
        medicalCoveragePercent: 80,
        criticalIllnessAmountHKD: 0,
      },
    });
    const result = applyCrisis(
      baseline(pyr),
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
      },
      {
        crisisType: "medical",
        oneTimeCostHKD: 100_000,
        durationMonths: 3,
        monthlyIncomeImpactPercent: 0,
        incomeHitPct: 0,
      },
    );

    expect(result.coverage).not.toBeNull();
    expect(result.coverage!.coveredHKD).toBe(80_000);
    expect(result.coverage!.uncoveredHKD).toBe(20_000);
    // Only 20k flows through cut order (fun first)
    expect(result.cutOrder.funAbsorbedHKD).toBe(20_000);
    expect(result.cutOrder.liquidAbsorbedHKD).toBe(0);

    const impacts = buildCrisisImpactsFromEngine(result);
    expect(impacts.some((i) => i.stageId === "coverage")).toBe(true);
  });

  it("critical_illness with no CI → full bill through cut order into savings", () => {
    const pyr = pyramid({
      protection: {
        medicalCoveragePercent: 90,
        criticalIllnessAmountHKD: 0,
      },
      investment: {
        riskAllocation: { low: 100, mid: 0, high: 0 },
        lumpSumHKD: 50_000,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 1_000, // 12k/yr
      },
      emergencyFund: { savedAmountHKD: 80_000 },
    });
    // disc 4k * 12 = 48k; fun 12k; liquid 80k; invested 50k
    const result = applyCrisis(
      baseline(pyr),
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
      },
      {
        crisisType: "critical_illness",
        oneTimeCostHKD: 200_000,
        durationMonths: 6,
        monthlyIncomeImpactPercent: 0,
        incomeHitPct: 0,
      },
    );

    expect(result.coverage!.coveredHKD).toBe(0);
    expect(result.coverage!.uncoveredHKD).toBe(200_000);
    expect(result.cutOrder.funAbsorbedHKD).toBe(12_000);
    expect(result.cutOrder.discretionaryAbsorbedHKD).toBe(48_000);
    expect(result.cutOrder.liquidAbsorbedHKD).toBe(80_000);
    expect(result.cutOrder.investedAbsorbedHKD).toBe(50_000);
    expect(result.cutOrder.remainingUncoveredHKD).toBe(10_000);
  });

  it("market_crash hits investedPool only (no protection, drop = pct × invested)", () => {
    const pyr = pyramid({
      investment: {
        riskAllocation: { low: 20, mid: 40, high: 40 },
        lumpSumHKD: 500_000,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 2_000,
      },
    });
    const result = applyCrisis(
      baseline(pyr),
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
      },
      {
        crisisType: "market_crash",
        oneTimeCostHKD: 0,
        durationMonths: 6,
        monthlyIncomeImpactPercent: 0,
        incomeHitPct: 0,
        marketDropPct: 30,
      },
    );

    expect(result.coverage).toBeNull();
    expect(result.marketDropHKD).toBe(150_000);
    expect(result.cutOrder.liquidAbsorbedHKD).toBe(0);
    expect(result.cutOrder.investedAbsorbedHKD).toBe(0);

    const impacts = buildCrisisImpactsFromEngine(result);
    expect(impacts.every((i) => i.layer !== "protection")).toBe(true);
    expect(impacts.some((i) => i.stageId === "market")).toBe(true);
  });

  it("recomputes goal delays on the shocked timeline", () => {
    const pyr = pyramid({
      emergencyFund: { savedAmountHKD: 10_000 },
      investment: {
        riskAllocation: { low: 0, mid: 100, high: 0 },
        lumpSumHKD: 10_000,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 0,
      },
      goals: {
        goals: [
          {
            id: "wedding",
            icon: "Heart",
            label: { en: "Wedding", zhHant: "婚禮" },
            targetAmountHKD: 400_000,
            targetAge: 38,
            targetYear: NOW_YEAR + 3,
            goalType: "spend",
          },
        ],
      },
    });
    const before = baseline(pyr);
    const result = applyCrisis(
      before,
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
      },
      {
        crisisType: "job_loss",
        oneTimeCostHKD: 0,
        durationMonths: 24,
        monthlyIncomeImpactPercent: 100,
        incomeHitPct: 100,
      },
    );

    // Multi-year income wipe should delay the spend goal or move depletion/EF status.
    expect(
      result.goalDelays.length > 0 ||
        result.efStatusAfter !== result.efStatusBefore ||
        result.assetsDepletedAtAgeAfter !== result.assetsDepletedAtAgeBefore,
    ).toBe(true);
  });

  it("shocked timeline caps invested contributions by reduced surplus", () => {
    const pyr = pyramid({
      investment: {
        riskAllocation: { low: 100, mid: 0, high: 0 },
        lumpSumHKD: 100_000,
        monthlyInvestmentHKD: 20_000,
        monthlyFunHKD: 0,
      },
    });
    const before = baseline(pyr);
    const firstYearContribution = before.rows[0]!.investedContributionHKD;
    expect(firstYearContribution).toBeGreaterThan(0);

    const result = applyCrisis(
      before,
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
        nowYear: NOW_YEAR,
      },
      {
        crisisType: "job_loss",
        oneTimeCostHKD: 0,
        durationMonths: 12,
        monthlyIncomeImpactPercent: 80,
        incomeHitPct: 80,
      },
    );

    // Engine re-run uses min(monthlyInvest×12, surplus); income shock shrinks surplus.
    expect(result.incomeHitPct).toBe(80);
    // Contribution cannot exceed shocked surplus — baseline had room to invest;
    // after an 80% income hit with ~25k expenses, surplus is tight or negative.
    const shocked = runLifeTimeline({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 50_000,
      monthlyExpenses: expenses.totalHKD,
      monthlyFun: 0,
      emergencyFundSavedHKD: pyr.emergencyFund.savedAmountHKD,
      investment: {
        lumpSumHKD: pyr.investment.lumpSumHKD,
        monthlyInvestmentHKD: 20_000,
        allocation: { low: 100, mid: 0, high: 0 },
      },
      goals: pyr.goals.goals,
      industry: "Tech",
      nowYear: NOW_YEAR,
      incomeShock: { hitPct: 80, durationMonths: 12 },
    });
    expect(shocked.rows[0]!.investedContributionHKD).toBeLessThan(
      firstYearContribution,
    );
  });
});

describe("journey-aware crisis plan", () => {
  it("never references a given-up goal when the baseline timeline excluded it", () => {
    const pyr = pyramid({
      goals: {
        goals: [
          {
            id: "wedding",
            icon: "Heart",
            label: { en: "Wedding", zhHant: "婚禮" },
            targetAmountHKD: 150_000,
            targetAge: 40,
            targetYear: NOW_YEAR + 5,
            goalType: "spend",
          },
          {
            id: "yacht",
            icon: "Ship",
            label: { en: "Yacht", zhHant: "遊艇" },
            targetAmountHKD: 2_000_000,
            targetAge: 50,
            targetYear: NOW_YEAR + 15,
            goalType: "spend",
          },
        ],
      },
    });
    // Baseline mirrors goal-journey exclusion: yacht was given up.
    const before = runLifeTimeline({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 50_000,
      monthlyExpenses: expenses.totalHKD,
      monthlyFun: pyr.investment.monthlyFunHKD,
      emergencyFundSavedHKD: pyr.emergencyFund.savedAmountHKD,
      investment: {
        lumpSumHKD: pyr.investment.lumpSumHKD,
        monthlyInvestmentHKD: pyr.investment.monthlyInvestmentHKD,
        allocation: pyr.investment.riskAllocation,
      },
      goals: pyr.goals.goals.filter((g) => g.id !== "yacht"),
      industry: "Tech",
      nowYear: NOW_YEAR,
    });

    const result = applyCrisis(
      before,
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: pyr,
        expenses,
        nowYear: NOW_YEAR,
      },
      {
        crisisType: "medical",
        oneTimeCostHKD: 200_000,
        durationMonths: 6,
        monthlyIncomeImpactPercent: 0,
        incomeHitPct: 0,
      },
    );

    expect(before.goals.some((g) => g.goalId === "yacht")).toBe(false);
    expect(result.goalDelays.some((g) => g.goalId === "yacht")).toBe(false);
  });

  it("uses post-squeeze expense and fun numbers in the cut order", () => {
    const fullFun = pyramid({
      investment: { monthlyFunHKD: 5_000 },
    });
    const squeezedFun = pyramid({
      investment: { monthlyFunHKD: 1_000 },
    });
    const fullExpenses: ExpensesState = {
      ...expenses,
      totalHKD: 25_000,
      categories: expenses.categories.map((row) =>
        row.key === "discretionary" ? { ...row, amountHKD: 4_000 } : row,
      ),
    };
    const squeezedExpenses: ExpensesState = {
      totalHKD: 22_000,
      categories: expenses.categories.map((row) =>
        row.key === "discretionary" ? { ...row, amountHKD: 1_000 } : row,
      ),
    };

    const beforeTimeline = baseline(fullFun);
    const afterTimeline = runLifeTimeline({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 50_000,
      monthlyExpenses: squeezedExpenses.totalHKD,
      monthlyFun: squeezedFun.investment.monthlyFunHKD,
      emergencyFundSavedHKD: squeezedFun.emergencyFund.savedAmountHKD,
      investment: {
        lumpSumHKD: squeezedFun.investment.lumpSumHKD,
        monthlyInvestmentHKD: squeezedFun.investment.monthlyInvestmentHKD,
        allocation: squeezedFun.investment.riskAllocation,
      },
      goals: squeezedFun.goals.goals,
      industry: "Tech",
      nowYear: NOW_YEAR,
    });

    const shock = {
      crisisType: "accident" as const,
      oneTimeCostHKD: 180_000,
      durationMonths: 3,
      monthlyIncomeImpactPercent: 0,
      incomeHitPct: 0,
    };

    const beforeCrisis = applyCrisis(
      beforeTimeline,
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: fullFun,
        expenses: fullExpenses,
        nowYear: NOW_YEAR,
      },
      shock,
    );
    const afterCrisis = applyCrisis(
      afterTimeline,
      {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Tech",
        pyramid: squeezedFun,
        expenses: squeezedExpenses,
        nowYear: NOW_YEAR,
      },
      shock,
    );

    // Post-squeeze plan has less fun cushion → fun absorbs less of the same bill,
    // so discretionary and/or liquid take more of the hit.
    expect(afterCrisis.cutOrder.funAbsorbedHKD).toBeLessThan(
      beforeCrisis.cutOrder.funAbsorbedHKD,
    );
    expect(
      afterCrisis.cutOrder.discretionaryAbsorbedHKD +
        afterCrisis.cutOrder.liquidAbsorbedHKD,
    ).toBeGreaterThan(
      beforeCrisis.cutOrder.discretionaryAbsorbedHKD +
        beforeCrisis.cutOrder.liquidAbsorbedHKD,
    );
    // Engine inputs are the mutated monthly fun / discretionary amounts.
    expect(afterCrisis.cutOrder.funAbsorbedHKD).toBeLessThanOrEqual(12_000);
    expect(beforeCrisis.cutOrder.funAbsorbedHKD).toBeGreaterThan(12_000);
  });
});
