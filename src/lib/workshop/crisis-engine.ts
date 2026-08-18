/**
 * Deterministic crisis impact engine for Workshop Pyramid Lab v3.
 * Pure TypeScript — AI supplies crisisType + params + narrative only.
 */

import { runLifeTimeline, type TimelineResult } from "@/lib/workshop/timeline-engine";
import {
  cutAvailable,
  discretionaryMonthly,
} from "@/lib/workshop/spending-cut-order";
import type {
  CrisisCoverageOffset,
  CrisisCutOrder,
  CrisisGoalDelay,
  CrisisImpact,
  CrisisImpactResult,
  CrisisState,
  CrisisType,
  ExpensesState,
  PyramidState,
} from "@/lib/workshop/types";

export type CrisisEngineContext = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  industry: string;
  pyramid: PyramidState;
  expenses: ExpensesState;
  /** Baseline timeline (pre-shock). */
  timeline: TimelineResult;
  nowYear?: number;
};

const PROTECTION_CRISIS_TYPES = new Set<CrisisType>([
  "medical",
  "critical_illness",
  "accident",
]);

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Protection coverage offset. Only medical / critical_illness / accident apply.
 * job_loss, market_crash, family → null (no protection card).
 */
export function computeCoverageOffset(
  crisisType: CrisisType,
  oneTimeCostHKD: number,
  protection: PyramidState["protection"],
): CrisisCoverageOffset | null {
  if (!PROTECTION_CRISIS_TYPES.has(crisisType)) {
    return null;
  }

  const gross = Math.max(0, roundMoney(oneTimeCostHKD));
  if (gross <= 0) {
    return {
      grossCostHKD: 0,
      coveredHKD: 0,
      uncoveredHKD: 0,
      coverageKind: "none",
    };
  }

  if (crisisType === "critical_illness") {
    const ci = Math.max(0, protection.criticalIllnessAmountHKD);
    const covered = roundMoney(Math.min(ci, gross));
    return {
      grossCostHKD: gross,
      coveredHKD: covered,
      uncoveredHKD: roundMoney(gross - covered),
      coverageKind: "critical_illness",
      ciAmountHKD: ci,
    };
  }

  // medical + accident (with medical cost): offset by medical coverage %
  const pct = clamp(protection.medicalCoveragePercent, 0, 100);
  const covered = roundMoney(gross * (pct / 100));
  return {
    grossCostHKD: gross,
    coveredHKD: covered,
    uncoveredHKD: roundMoney(gross - covered),
    coverageKind: "medical_percent",
    medicalCoveragePercent: pct,
  };
}

/**
 * Cut order: discretionary (annualised) → liquid → invested.
 * Fun is no longer part of the game (v4).
 */
export function applyCutOrder(input: {
  toAbsorbHKD: number;
  monthlyDiscretionaryHKD: number;
  liquidPoolHKD: number;
  investedPoolHKD: number;
}): CrisisCutOrder & {
  liquidRemainingHKD: number;
  investedRemainingHKD: number;
  monthlyDiscretionaryRemainingHKD: number;
} {
  let remaining = Math.max(0, roundMoney(input.toAbsorbHKD));
  const spendingCuts = cutAvailable(
    {
      totalHKD: Math.max(0, input.monthlyDiscretionaryHKD),
      categories: [
        {
          key: "discretionary",
          icon: "Sparkles",
          amountHKD: Math.max(0, input.monthlyDiscretionaryHKD),
        },
      ],
    },
    remaining,
  );
  const funAbsorbedHKD = 0;
  const discretionaryAbsorbedHKD = spendingCuts.squeezeCutsHKD.discretionary;
  remaining = spendingCuts.remainingHKD;
  const monthlyDiscretionaryRemainingHKD =
    spendingCuts.monthlyDiscretionaryRemainingHKD;

  const liquidAbsorbedHKD = roundMoney(
    Math.min(Math.max(0, input.liquidPoolHKD), remaining),
  );
  remaining = roundMoney(remaining - liquidAbsorbedHKD);
  const liquidRemainingHKD = roundMoney(
    Math.max(0, input.liquidPoolHKD) - liquidAbsorbedHKD,
  );

  const investedAbsorbedHKD = roundMoney(
    Math.min(Math.max(0, input.investedPoolHKD), remaining),
  );
  remaining = roundMoney(remaining - investedAbsorbedHKD);
  const investedRemainingHKD = roundMoney(
    Math.max(0, input.investedPoolHKD) - investedAbsorbedHKD,
  );

  return {
    funAbsorbedHKD,
    discretionaryAbsorbedHKD,
    liquidAbsorbedHKD,
    investedAbsorbedHKD,
    remainingUncoveredHKD: remaining,
    liquidRemainingHKD,
    investedRemainingHKD,
    monthlyDiscretionaryRemainingHKD,
  };
}

function livingExpensesWithoutDiscretionary(
  expenses: ExpensesState,
  discretionaryMonthlyHKD: number,
): number {
  const total = Math.max(0, expenses.totalHKD);
  return Math.max(0, roundMoney(total - discretionaryMonthlyHKD));
}

/**
 * Apply a validated crisis to the baseline timeline.
 * Protection is only touched by medical / critical_illness / accident.
 */
export function applyCrisis(
  timeline: TimelineResult,
  context: Omit<CrisisEngineContext, "timeline">,
  crisis: Pick<
    CrisisState,
    | "crisisType"
    | "oneTimeCostHKD"
    | "durationMonths"
    | "monthlyIncomeImpactPercent"
    | "incomeHitPct"
    | "marketDropPct"
  >,
): CrisisImpactResult {
  const crisisType = crisis.crisisType;
  const oneTimeCostHKD = Math.max(0, Math.round(crisis.oneTimeCostHKD ?? 0));
  const incomeHitPct = clamp(
    crisis.incomeHitPct ?? crisis.monthlyIncomeImpactPercent ?? 0,
    0,
    100,
  );
  const durationMonths = Math.max(1, Math.round(crisis.durationMonths ?? 1));
  const marketDropPct =
    crisisType === "market_crash"
      ? clamp(crisis.marketDropPct ?? 0, 0, 80)
      : 0;

  const coverage = computeCoverageOffset(
    crisisType,
    oneTimeCostHKD,
    context.pyramid.protection,
  );

  const uncoveredOneTime = coverage?.uncoveredHKD ?? oneTimeCostHKD;

  const liquid = Math.max(0, context.pyramid.emergencyFund.savedAmountHKD);
  let invested = Math.max(0, context.pyramid.investment.lumpSumHKD);

  let marketDropHKD = 0;
  if (marketDropPct > 0 && invested > 0) {
    marketDropHKD = roundMoney(invested * (marketDropPct / 100));
    invested = roundMoney(invested - marketDropHKD);
  }

  const monthlyDisc = discretionaryMonthly(context.expenses);

  const cut = applyCutOrder({
    toAbsorbHKD: uncoveredOneTime,
    monthlyDiscretionaryHKD: monthlyDisc,
    liquidPoolHKD: liquid,
    investedPoolHKD: invested,
  });

  const livingBase = livingExpensesWithoutDiscretionary(
    context.expenses,
    monthlyDisc,
  );
  const shockedLiving = roundMoney(
    livingBase + cut.monthlyDiscretionaryRemainingHKD,
  );

  // Keep the shocked re-run on the same active goals as the baseline timeline
  // (given-up goals are already excluded upstream via goal journey).
  const activeGoalIds = new Set(timeline.goals.map((g) => g.goalId));
  const shockedGoals = context.pyramid.goals.goals.filter((g) =>
    activeGoalIds.has(g.id),
  );

  const shockedTimeline = runLifeTimeline({
    age: context.age,
    retirementAge: context.retirementAge,
    monthlyIncome: context.monthlyIncome,
    monthlyExpenses: shockedLiving,
    emergencyFundSavedHKD: cut.liquidRemainingHKD,
    investment: {
      lumpSumHKD: cut.investedRemainingHKD,
      allocation: context.pyramid.investment.riskAllocation,
    },
    goals: shockedGoals,
    industry: context.industry,
    nowYear: context.nowYear ?? timeline.rows[0]?.year,
    incomeShock:
      incomeHitPct > 0
        ? { hitPct: incomeHitPct, durationMonths }
        : undefined,
  });

  const goalDelays: CrisisGoalDelay[] = timeline.goals.map((before) => {
    const after = shockedTimeline.goals.find((g) => g.goalId === before.goalId);
    const fromPyramid = context.pyramid.goals.goals.find(
      (g) => g.id === before.goalId,
    );
    return {
      goalId: before.goalId,
      label: fromPyramid?.label ?? {
        en: before.goalId,
        zhHant: before.goalId,
      },
      beforeAge: before.attainedAtAge,
      afterAge: after?.attainedAtAge ?? null,
    };
  }).filter((row) => {
    return (
      row.beforeAge !== row.afterAge ||
      (row.beforeAge != null && row.afterAge == null)
    );
  });

  return {
    crisisType,
    coverage,
    cutOrder: {
      funAbsorbedHKD: cut.funAbsorbedHKD,
      discretionaryAbsorbedHKD: cut.discretionaryAbsorbedHKD,
      liquidAbsorbedHKD: cut.liquidAbsorbedHKD,
      investedAbsorbedHKD: cut.investedAbsorbedHKD,
      remainingUncoveredHKD: cut.remainingUncoveredHKD,
    },
    marketDropHKD,
    incomeHitPct,
    durationMonths,
    oneTimeCostHKD,
    efStatusBefore: timeline.emergencyFund.status,
    efStatusAfter: shockedTimeline.emergencyFund.status,
    assetsDepletedAtAgeBefore: timeline.retirement.assetsDepletedAtAge,
    assetsDepletedAtAgeAfter: shockedTimeline.retirement.assetsDepletedAtAge,
    goalDelays,
  };
}

/** Whether this crisis type may produce a protection coverage card. */
export function crisisTouchesProtection(crisisType: CrisisType): boolean {
  return PROTECTION_CRISIS_TYPES.has(crisisType);
}

/**
 * Build CrisisImpact cards from engine output + optional AI headlines.
 * Non-protection types never emit a protection-layer card.
 */
export function buildCrisisImpactsFromEngine(
  result: CrisisImpactResult,
  headlines: Partial<
    Record<
      NonNullable<CrisisImpact["stageId"]>,
      { en: string; zhHant: string }
    >
  > = {},
): CrisisImpact[] {
  const impacts: CrisisImpact[] = [];

  const coverage = result.coverage;
  if (
    crisisTouchesProtection(result.crisisType) &&
    coverage &&
    coverage.grossCostHKD > 0
  ) {
    impacts.push({
      layer: "protection",
      stageId: "coverage",
      icon: coverage.coveredHKD > 0 ? "ShieldCheck" : "ShieldOff",
      headline: headlines.coverage ?? {
        en:
          coverage.coveredHKD > 0
            ? "Protection offset the bill"
            : "Protection gap on this bill",
        zhHant:
          coverage.coveredHKD > 0 ? "保障抵銷了部分帳單" : "此帳單保障缺口",
      },
      detailHKD: coverage.uncoveredHKD,
    });
  }

  if (result.cutOrder.funAbsorbedHKD > 0) {
    // Legacy sessions only — fun is not part of the game anymore (v4).
    impacts.push({
      layer: "goals",
      stageId: "fun",
      icon: "Sparkles",
      headline: headlines.fun ?? {
        en: "Fun budget absorbed the hit",
        zhHant: "娛樂預算吸收了衝擊",
      },
      detailHKD: result.cutOrder.funAbsorbedHKD,
    });
  }

  if (result.cutOrder.discretionaryAbsorbedHKD > 0) {
    impacts.push({
      layer: "goals",
      stageId: "discretionary",
      icon: "ShoppingBag",
      headline: headlines.discretionary ?? {
        en: "Discretionary spend cut",
        zhHant: "削減可選開支",
      },
      detailHKD: result.cutOrder.discretionaryAbsorbedHKD,
    });
  }

  if (result.cutOrder.liquidAbsorbedHKD > 0) {
    impacts.push({
      layer: "emergencyFund",
      stageId: "liquid",
      icon: "PiggyBank",
      headline: headlines.liquid ?? {
        en: "Cash / emergency fund drawn down",
        zhHant: "動用現金／應急儲備",
      },
      detailHKD: result.cutOrder.liquidAbsorbedHKD,
    });
  }

  if (result.marketDropHKD > 0) {
    impacts.push({
      layer: "investment",
      stageId: "market",
      icon: "TrendingDown",
      headline: headlines.market ?? {
        en: "Invested assets marked down",
        zhHant: "投資資產市值下跌",
      },
      detailHKD: result.marketDropHKD,
    });
  }

  if (result.cutOrder.investedAbsorbedHKD > 0) {
    impacts.push({
      layer: "investment",
      stageId: "invested",
      icon: "Landmark",
      headline: headlines.invested ?? {
        en: "Investments liquidated",
        zhHant: "變現投資資產",
      },
      detailHKD: result.cutOrder.investedAbsorbedHKD,
    });
  }

  if (result.incomeHitPct > 0) {
    impacts.push({
      layer: "investment",
      stageId: "income",
      icon: "Wallet",
      headline: headlines.income ?? {
        en: "Income reduced during the shock",
        zhHant: "衝擊期間收入下降",
      },
      detailMonths: result.durationMonths,
    });
  }

  if (result.goalDelays.length > 0) {
    const months = result.goalDelays.reduce((max, g) => {
      if (g.beforeAge == null || g.afterAge == null) {
        return Math.max(max, 12);
      }
      return Math.max(max, (g.afterAge - g.beforeAge) * 12);
    }, 0);
    impacts.push({
      layer: "goals",
      stageId: "goals",
      icon: "Target",
      headline: headlines.goals ?? {
        en: "Goal timeline slips",
        zhHant: "目標時間表延遲",
      },
      detailMonths: Math.max(1, Math.round(months)),
    });
  }

  return impacts;
}
