/**
 * Deterministic Crisis Stress Test for Summary & Rating (Step 6).
 * Pure TypeScript — no AI, no randomness. Same inputs → same scenario & numbers.
 *
 * Also re-exports crisis-engine helpers used by pyramid-actions / legacy crisis.
 */

export {
  applyCrisis,
  applyCutOrder,
  buildCrisisImpactsFromEngine,
  computeCoverageOffset,
  type CrisisEngineContext,
} from "@/lib/workshop/crisis-engine";

import {
  applyCrisis,
  type CrisisEngineContext,
} from "@/lib/workshop/crisis-engine";
import {
  activeGoalsForJourney,
  parseGoalJourneyState,
  type GoalJourneyTimelineContext,
} from "@/lib/workshop/goal-journey";
import { runLifeTimeline, type TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  Bilingual,
  CrisisImpactResult,
  CrisisStressTestSummary,
  CrisisType,
  ExpensesState,
  GoalJourneyState,
  PyramidState,
  RiskProfile,
} from "@/lib/workshop/types";

export type CrisisStressTestScenarioId =
  | "medical"
  | "critical_illness"
  | "job_loss"
  | "market_crash"
  | "accident";

export type CrisisStressTestVerdict = "SHIELDED" | "PARTIAL" | "PENETRATED";

export type CrisisStressTestResult = {
  scenario: CrisisStressTestScenarioId;
  crisisType: CrisisType;
  shieldedAmount: number;
  penetrationAmount: number;
  affectedGoalId: string | null;
  affectedGoalLabel: Bilingual | null;
  delayYears: number | null;
  verdict: CrisisStressTestVerdict;
  /** 0–100 — single source of truth for the Crisis Resilience sub-score. */
  resilienceScore: number;
  oneTimeCostHKD: number;
  incomeHitPct: number;
  marketDropPct: number;
  durationMonths: number;
  impactResult: CrisisImpactResult;
};

export type RunCrisisStressTestInput = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  industry: string;
  riskProfile: RiskProfile;
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey?: GoalJourneyState | null;
  /** Prefer session timeline when available; otherwise rebuilt from journey. */
  timeline?: TimelineResult | null;
  nowYear?: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type IndustryBucket = "health" | "finance" | "self" | "other";

function industryBucket(industry: string): IndustryBucket {
  const s = industry.trim().toLowerCase();
  if (/health|medical|hospital|clinic|護理|醫療|醫護/.test(s)) {
    return "health";
  }
  if (/financ|bank|invest|保險|金融|銀行|證券/.test(s)) {
    return "finance";
  }
  if (/self[- ]?employ|freelance|自僱|自由/.test(s)) {
    return "self";
  }
  return "other";
}

/**
 * Pick ONE shock scenario from age band + industry + risk profile.
 * Fully deterministic — no Math.random.
 */
export function pickDeterministicCrisisScenario(input: {
  age: number;
  industry: string;
  riskProfile: RiskProfile;
}): { scenario: CrisisStressTestScenarioId; crisisType: CrisisType } {
  const age = Math.round(input.age);
  const band = age < 35 ? 0 : age < 50 ? 1 : 2;
  const ind = industryBucket(input.industry);
  const risk =
    input.riskProfile === "conservative"
      ? 0
      : input.riskProfile === "balanced"
        ? 1
        : 2;

  // Strong industry / life-stage biases first (still deterministic).
  if (ind === "health") {
    return band >= 1
      ? { scenario: "critical_illness", crisisType: "critical_illness" }
      : { scenario: "medical", crisisType: "medical" };
  }
  if (ind === "finance" && risk >= 1) {
    return { scenario: "market_crash", crisisType: "market_crash" };
  }
  if (ind === "self" || (risk === 2 && band === 0)) {
    return { scenario: "job_loss", crisisType: "job_loss" };
  }
  if (risk === 0 && band >= 1) {
    return { scenario: "critical_illness", crisisType: "critical_illness" };
  }
  if (risk === 0) {
    return { scenario: "medical", crisisType: "medical" };
  }

  const table: CrisisStressTestScenarioId[] = [
    "medical",
    "accident",
    "job_loss",
    "market_crash",
    "critical_illness",
  ];
  const idx = (band * 5 + risk * 2 + (ind === "other" ? 1 : 0)) % table.length;
  const scenario = table[idx]!;
  return { scenario, crisisType: scenario };
}

function buildShockParams(
  scenario: CrisisStressTestScenarioId,
  monthlyIncome: number,
): {
  oneTimeCostHKD: number;
  durationMonths: number;
  incomeHitPct: number;
  marketDropPct: number;
} {
  const income = Math.max(0, monthlyIncome);
  switch (scenario) {
    case "medical":
      return {
        oneTimeCostHKD: roundMoney(clamp(income * 8, 50_000, 800_000)),
        durationMonths: 3,
        incomeHitPct: 10,
        marketDropPct: 0,
      };
    case "critical_illness":
      return {
        oneTimeCostHKD: roundMoney(clamp(income * 18, 200_000, 2_000_000)),
        durationMonths: 12,
        incomeHitPct: 20,
        marketDropPct: 0,
      };
    case "job_loss":
      return {
        oneTimeCostHKD: roundMoney(clamp(income, 0, 100_000)),
        durationMonths: 6,
        incomeHitPct: 80,
        marketDropPct: 0,
      };
    case "market_crash":
      return {
        oneTimeCostHKD: 0,
        durationMonths: 6,
        incomeHitPct: 0,
        marketDropPct: 35,
      };
    case "accident":
      return {
        oneTimeCostHKD: roundMoney(clamp(income * 6, 30_000, 500_000)),
        durationMonths: 4,
        incomeHitPct: 15,
        marketDropPct: 0,
      };
    default: {
      const _exhaustive: never = scenario;
      return _exhaustive;
    }
  }
}

function delayYearsFromGoal(delay: {
  beforeAge: number | null;
  afterAge: number | null;
}): number | null {
  if (delay.beforeAge != null && delay.afterAge != null) {
    const years = delay.afterAge - delay.beforeAge;
    return years > 0 ? years : null;
  }
  if (delay.beforeAge != null && delay.afterAge == null) {
    return Math.max(1, Math.ceil((90 - delay.beforeAge) / 5));
  }
  return null;
}

function deriveVerdictAndScore(input: {
  impact: CrisisImpactResult;
  monthlyIncome: number;
  pyramid: PyramidState;
}): Pick<
  CrisisStressTestResult,
  | "shieldedAmount"
  | "penetrationAmount"
  | "affectedGoalId"
  | "affectedGoalLabel"
  | "delayYears"
  | "verdict"
  | "resilienceScore"
> {
  const { impact, monthlyIncome, pyramid } = input;
  const income = Math.max(1, monthlyIncome);
  const coverage = impact.coverage;
  const gross = coverage?.grossCostHKD ?? impact.oneTimeCostHKD;
  const shieldedAmount = roundMoney(coverage?.coveredHKD ?? 0);
  const penetrationAmount = roundMoney(
    impact.cutOrder.liquidAbsorbedHKD +
      impact.cutOrder.investedAbsorbedHKD +
      impact.cutOrder.remainingUncoveredHKD +
      impact.marketDropHKD,
  );
  const coverRatio = gross > 0 ? shieldedAmount / gross : 1;

  let affectedGoalId: string | null = null;
  let affectedGoalLabel: Bilingual | null = null;
  let delayYears: number | null = null;
  for (const row of impact.goalDelays) {
    const years = delayYearsFromGoal(row);
    if (years == null) {
      continue;
    }
    if (delayYears == null || years > delayYears) {
      delayYears = years;
      affectedGoalId = row.goalId;
      affectedGoalLabel =
        row.label ??
        pyramid.goals.goals.find((g) => g.id === row.goalId)?.label ??
        null;
    }
  }

  // v6: measure the dent, not the touch.
  // - penetrationRatio: how big the residual shock is vs total liquid+invested
  // - investedDrawdownPct: how deep into the invested pool the shock went
  // A small drawdown (≤10% of invested) with good coverage is NOT a failure.
  const liquidAtStart = Math.max(0, pyramid.emergencyFund.savedAmountHKD);
  const investedAtStart = Math.max(0, pyramid.investment.lumpSumHKD);
  const assetsAtStart = Math.max(1, liquidAtStart + investedAtStart);
  const penetrationRatio = penetrationAmount / assetsAtStart;
  const investedDrawdownPct =
    investedAtStart > 0
      ? impact.cutOrder.investedAbsorbedHKD / investedAtStart
      : 0;

  const heavyPenetration = penetrationAmount > income * 6;
  const weakCover = gross > 0 && coverRatio < 0.25;

  let verdict: CrisisStressTestVerdict;
  if (
    coverRatio >= 0.6 &&
    penetrationRatio <= 0.15 &&
    delayYears == null &&
    investedDrawdownPct <= 0.1
  ) {
    verdict = "SHIELDED";
  } else if (
    weakCover ||
    (gross > 0 && coverRatio < 0.4) ||
    penetrationRatio > 0.6 ||
    (delayYears != null && delayYears >= 2) ||
    heavyPenetration ||
    (investedDrawdownPct > 0.5 && coverRatio < 0.6)
  ) {
    verdict = "PENETRATED";
  } else {
    verdict = "PARTIAL";
  }

  // Name a representative goal on SHIELDED when nothing was delayed.
  if (verdict === "SHIELDED" && !affectedGoalLabel) {
    const first = pyramid.goals.goals[0];
    if (first) {
      affectedGoalId = first.id;
      affectedGoalLabel = first.label;
    }
  }

  // Keep badge colour bands and gauge sub-score aligned forever.
  const drawdownPenalty = Math.min(10, investedDrawdownPct * 25);
  let resilienceScore: number;
  if (verdict === "SHIELDED") {
    resilienceScore = Math.round(clamp(88 + coverRatio * 12, 85, 100));
  } else if (verdict === "PARTIAL") {
    resilienceScore = Math.round(
      clamp(
        55 +
          coverRatio * 15 -
          Math.min(12, penetrationAmount / 100_000) -
          drawdownPenalty,
        45,
        78,
      ),
    );
  } else {
    resilienceScore = Math.round(
      clamp(
        28 +
          coverRatio * 10 -
          Math.min(18, penetrationAmount / 120_000) -
          drawdownPenalty * 0.8,
        10,
        45,
      ),
    );
  }

  return {
    shieldedAmount,
    penetrationAmount,
    affectedGoalId,
    affectedGoalLabel,
    delayYears,
    verdict,
    resilienceScore,
  };
}

function resolveBaselineTimeline(
  input: RunCrisisStressTestInput,
): TimelineResult {
  if (input.timeline && input.timeline.rows.length > 0) {
    return input.timeline;
  }

  const journey = input.journey ?? parseGoalJourneyState(null);
  const ctx: GoalJourneyTimelineContext = {
    age: input.age,
    retirementAge: input.retirementAge,
    monthlyIncome: input.monthlyIncome,
    industry: input.industry,
    nowYear: input.nowYear,
    pyramid: input.pyramid,
    expenses: input.expenses,
    journey,
  };

  return runLifeTimeline({
    age: ctx.age,
    retirementAge: Math.min(80, Math.max(ctx.age + 1, Math.round(ctx.retirementAge))),
    monthlyIncome: ctx.monthlyIncome,
    monthlyExpenses: ctx.expenses.totalHKD,
    emergencyFundSavedHKD: ctx.pyramid.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: ctx.pyramid.investment.lumpSumHKD,
      allocation: ctx.pyramid.investment.riskAllocation,
    },
    goals: activeGoalsForJourney(ctx.pyramid, ctx.journey),
    industry: ctx.industry,
    nowYear: ctx.nowYear,
  });
}

/**
 * Run the silent Summary crisis stress test against the final mutated plan.
 */
export function runCrisisStressTest(
  input: RunCrisisStressTestInput,
): CrisisStressTestResult {
  const { scenario, crisisType } = pickDeterministicCrisisScenario({
    age: input.age,
    industry: input.industry,
    riskProfile: input.riskProfile,
  });
  const params = buildShockParams(scenario, input.monthlyIncome);
  const timeline = resolveBaselineTimeline(input);

  const engineContext: Omit<CrisisEngineContext, "timeline"> = {
    age: input.age,
    retirementAge: Math.min(
      80,
      Math.max(input.age + 1, Math.round(input.retirementAge)),
    ),
    monthlyIncome: input.monthlyIncome,
    industry: input.industry,
    pyramid: input.pyramid,
    expenses: input.expenses,
    nowYear: input.nowYear ?? timeline.rows[0]?.year,
  };

  const impactResult = applyCrisis(timeline, engineContext, {
    crisisType,
    oneTimeCostHKD: params.oneTimeCostHKD,
    durationMonths: params.durationMonths,
    monthlyIncomeImpactPercent: params.incomeHitPct,
    incomeHitPct: params.incomeHitPct,
    marketDropPct: params.marketDropPct,
  });

  const derived = deriveVerdictAndScore({
    impact: impactResult,
    monthlyIncome: input.monthlyIncome,
    pyramid: input.pyramid,
  });

  return {
    scenario,
    crisisType,
    ...derived,
    oneTimeCostHKD: params.oneTimeCostHKD,
    incomeHitPct: params.incomeHitPct,
    marketDropPct: params.marketDropPct,
    durationMonths: params.durationMonths,
    impactResult,
  };
}

/** Map stress-test verdict → Crisis Resilience pillar (0–100). */
export function scoreCrisisResilienceFromStressTest(
  result: CrisisStressTestResult | null | undefined,
): number | null {
  if (!result) {
    return null;
  }
  return clamp(Math.round(result.resilienceScore), 0, 100);
}

/** Slim snapshot for SummaryState / goalsJson (no impactResult payload). */
export function toCrisisStressTestSummary(
  result: CrisisStressTestResult,
): CrisisStressTestSummary {
  return {
    scenario: result.scenario,
    crisisType: result.crisisType,
    shieldedAmount: result.shieldedAmount,
    penetrationAmount: result.penetrationAmount,
    affectedGoalId: result.affectedGoalId,
    affectedGoalLabel: result.affectedGoalLabel,
    delayYears: result.delayYears,
    verdict: result.verdict,
    resilienceScore: result.resilienceScore,
    oneTimeCostHKD: result.oneTimeCostHKD,
    incomeHitPct: result.incomeHitPct,
    marketDropPct: result.marketDropPct,
    durationMonths: result.durationMonths,
  };
}
