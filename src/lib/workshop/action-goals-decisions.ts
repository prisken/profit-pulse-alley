/**
 * Curated Action Goals decisions payload for DeepSeek.
 * Pure TypeScript — computed before the AI call; never dumps raw session JSON.
 */

import {
  buildFallbackReasoning,
  type DecisionsPayload,
} from "@/lib/workshop/action-goal-fallbacks";
import { deriveRiskQuizJourneyConsistency } from "@/lib/workshop/risk-quiz-consistency";
import type {
  ActionGoal,
  Bilingual,
  CrisisStressTestSummary,
  ExpensesState,
  GoalItem,
  GoalJourneyState,
  PyramidState,
  RiskProfile,
} from "@/lib/workshop/types";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";

export type ActionGoalsLiquidationSource = "investments" | "emergencyFund" | null;

export type ActionGoalsDecisionsPayload = {
  goalsApplied: Array<{
    name: string;
    targetAge: number;
    usedLiquidation: boolean;
    liquidationSource: ActionGoalsLiquidationSource;
  }>;
  goalsGivenUp: Array<{
    name: string;
    targetAge: number;
  }>;
  squeezesAccepted: Array<{
    category: "fun" | "discretionary";
    monthlyAmount: number;
  }>;
  squeezesRejected: Array<{
    category: "fun" | "discretionary";
    monthlyAmount: number;
  }>;
  postJourneyState: {
    remainingMonthlySurplus: number;
    emergencyFundMonthsRemaining: number;
    investmentBalanceRemaining: number;
  };
  crisisStressTest: {
    scenario: CrisisStressTestSummary["scenario"];
    verdict: CrisisStressTestSummary["verdict"];
    penetrationAmount: number;
    affectedGoal: string | null;
    delayYears: number | null;
  };
  riskQuizProfile: "Conservative" | "Balanced" | "Aggressive";
  profileBehaviorMismatch: boolean;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function goalName(goal: GoalItem | undefined, goalId: string): string {
  if (!goal) {
    return goalId;
  }
  return goal.label.en.trim() || goal.label.zhHant.trim() || goalId;
}

function riskQuizProfileLabel(
  profile: RiskProfile,
): ActionGoalsDecisionsPayload["riskQuizProfile"] {
  if (profile === "conservative") {
    return "Conservative";
  }
  if (profile === "aggressive") {
    return "Aggressive";
  }
  return "Balanced";
}

/**
 * Same derivation as the Risk Quiz consistency line: true when the quiz
 * profile and goal-journey behavior diverge (not merely "aligned").
 */
export function isProfileBehaviorMismatch(
  profile: RiskProfile,
  journey: GoalJourneyState | null | undefined,
): boolean {
  const result = deriveRiskQuizJourneyConsistency(profile, journey);
  if (!result) {
    return false;
  }
  return result.messageKey !== "workshop.riskQuiz.consistencyAligned";
}

function aggregateSqueezeCuts(
  decisions: GoalJourneyState["decisions"],
  accepted: boolean,
): ActionGoalsDecisionsPayload["squeezesAccepted"] {
  let funMonthly = 0;
  let discMonthly = 0;

  for (const row of decisions) {
    if (row.status !== "applied") {
      continue;
    }
    if (row.acceptedSqueeze !== accepted) {
      continue;
    }
    const cuts = row.squeezeCutsHKD;
    if (!cuts) {
      continue;
    }
    // squeezeCutsHKD is stored as annual amounts (see applyGoalJourneyDecisionAction).
    funMonthly += Math.max(0, cuts.fun) / 12;
    discMonthly += Math.max(0, cuts.discretionary) / 12;
  }

  const out: ActionGoalsDecisionsPayload["squeezesAccepted"] = [];
  if (funMonthly > 0) {
    out.push({ category: "fun", monthlyAmount: roundMoney(funMonthly) });
  }
  if (discMonthly > 0) {
    out.push({
      category: "discretionary",
      monthlyAmount: roundMoney(discMonthly),
    });
  }
  return out;
}

function emergencyFundMonthsRemaining(
  pyramid: PyramidState,
  expenses: ExpensesState,
  timeline: TimelineResult | null,
): number {
  const saved = Math.max(0, pyramid.emergencyFund.savedAmountHKD);
  if (timeline && timeline.emergencyFund.targetMonths > 0) {
    const targetHKD = Math.max(0, timeline.emergencyFund.targetHKD);
    if (targetHKD > 0) {
      return roundMoney(
        (saved / targetHKD) * timeline.emergencyFund.targetMonths,
      );
    }
  }
  const monthlyBurn = Math.max(1, expenses.totalHKD);
  return roundMoney(saved / monthlyBurn);
}

export function buildActionGoalsDecisionsPayload(input: {
  pyramid: PyramidState;
  expenses: ExpensesState;
  monthlyIncome: number;
  journey: GoalJourneyState;
  crisisStressTest: CrisisStressTestSummary;
  riskProfile: RiskProfile;
  timeline?: TimelineResult | null;
}): ActionGoalsDecisionsPayload {
  const { pyramid, expenses, journey, crisisStressTest, riskProfile } = input;
  const goalsById = new Map(pyramid.goals.goals.map((g) => [g.id, g]));

  const goalsApplied: ActionGoalsDecisionsPayload["goalsApplied"] = [];
  const goalsGivenUp: ActionGoalsDecisionsPayload["goalsGivenUp"] = [];

  for (const decision of journey.decisions) {
    const goal = goalsById.get(decision.goalId);
    if (decision.status === "applied") {
      const usedLiquidation = decision.allowLiquidation === true;
      goalsApplied.push({
        name: goalName(goal, decision.goalId),
        targetAge: Math.round(goal?.targetAge ?? 0),
        usedLiquidation,
        liquidationSource: usedLiquidation ? "investments" : null,
      });
    } else if (decision.status === "given_up") {
      goalsGivenUp.push({
        name: goalName(goal, decision.goalId),
        targetAge: Math.round(goal?.targetAge ?? 0),
      });
    }
  }

  const remainingMonthlySurplus = roundMoney(
    Math.max(0, input.monthlyIncome) -
      Math.max(0, expenses.totalHKD) -
      Math.max(0, pyramid.investment.monthlyFunHKD) -
      Math.max(0, pyramid.investment.monthlyInvestmentHKD),
  );

  const affectedGoal =
    crisisStressTest.affectedGoalLabel != null
      ? crisisStressTest.affectedGoalLabel.en.trim() ||
        crisisStressTest.affectedGoalLabel.zhHant.trim() ||
        null
      : null;

  return {
    goalsApplied,
    goalsGivenUp,
    squeezesAccepted: aggregateSqueezeCuts(journey.decisions, true),
    squeezesRejected: aggregateSqueezeCuts(journey.decisions, false),
    postJourneyState: {
      remainingMonthlySurplus,
      emergencyFundMonthsRemaining: emergencyFundMonthsRemaining(
        pyramid,
        expenses,
        input.timeline ?? null,
      ),
      investmentBalanceRemaining: roundMoney(
        Math.max(0, pyramid.investment.lumpSumHKD),
      ),
    },
    crisisStressTest: {
      scenario: crisisStressTest.scenario,
      verdict: crisisStressTest.verdict,
      penetrationAmount: crisisStressTest.penetrationAmount,
      affectedGoal,
      delayYears: crisisStressTest.delayYears,
    },
    riskQuizProfile: riskQuizProfileLabel(riskProfile),
    profileBehaviorMismatch: isProfileBehaviorMismatch(riskProfile, journey),
  };
}

type ActionGoalSeedLike = {
  rank: number;
  category: ActionGoal["category"];
  icon: string;
  impactPoints: number;
  gap?: number;
  currentScore?: number;
};

const FALLBACK_TITLE: Record<ActionGoal["category"], Bilingual> = {
  protection: {
    en: "Strengthen your protection layer",
    zhHant: "加強你的保障層",
  },
  savings: {
    en: "Rebuild emergency cash buffer",
    zhHant: "重建應急現金緩衝",
  },
  investment: {
    en: "Grow long-term investments",
    zhHant: "壯大長期投資",
  },
  goal: {
    en: "Keep priority goals on track",
    zhHant: "讓優先目標保持進度",
  },
};

/**
 * Deterministic titles + reasoning when DeepSeek fails validation after retry.
 * Reasoning comes from {@link buildFallbackReasoning} — intentional, not an error state.
 */
export function buildDeterministicActionGoalsFallback(
  seeds: ActionGoalSeedLike[],
  decisions: ActionGoalsDecisionsPayload | DecisionsPayload,
): ActionGoal[] {
  return [...seeds]
    .sort((a, b) => a.rank - b.rank)
    .map((seed) => ({
      rank: seed.rank,
      title: FALLBACK_TITLE[seed.category],
      category: seed.category,
      icon: seed.icon,
      impactPoints: seed.impactPoints,
      reasoning: buildFallbackReasoning(
        {
          rank: seed.rank,
          category: seed.category,
          icon: seed.icon,
          impactPoints: seed.impactPoints,
          gap: seed.gap,
          currentScore: seed.currentScore,
        },
        decisions,
      ),
    }));
}
