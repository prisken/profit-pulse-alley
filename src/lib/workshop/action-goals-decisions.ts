/**
 * Curated Action Goals decisions payload for DeepSeek.
 * Pure TypeScript — computed before the AI call; never dumps raw session JSON.
 */

import {
  buildFallbackReasoning,
  type DecisionsPayload,
} from "@/lib/workshop/action-goal-fallbacks";
import { deriveRiskQuizJourneyConsistency } from "@/lib/workshop/risk-quiz-consistency";
import { computeGoalOutlook } from "@/lib/workshop/goal-journey";
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
  /**
   * Per applied goal: how late it lands and how much of the monthly surplus
   * it would need to hit on time — the "retirement goal needs saving every
   * single month" stress signal (v5.3).
   */
  goalOutlooks: Array<{
    name: string;
    targetAge: number;
    attainedAge: number | null;
    delayYears: number | null;
    requiredExtraMonthlyHKD: number;
    monthlySurplus: number;
    effortRatio: number | null;
    late: boolean;
    heavyMonthlyCommitment: boolean;
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
  /** Hero runway: assets-last-until age before/after the journey (null = past 90). */
  runway: {
    beforeAge: number | null;
    afterAge: number | null;
  };
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
  runway?: { beforeAge: number | null; afterAge: number | null } | null;
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
    Math.max(0, input.monthlyIncome) - Math.max(0, expenses.totalHKD),
  );

  const goalOutlooks: ActionGoalsDecisionsPayload["goalOutlooks"] = [];
  if (input.timeline && input.timeline.rows.length > 0) {
    for (const decision of journey.decisions) {
      if (decision.status !== "applied") {
        continue;
      }
      const goal = goalsById.get(decision.goalId);
      if (!goal) {
        continue;
      }
      const outlook = computeGoalOutlook(input.timeline, goal);
      const monthlySurplus = Math.max(0, remainingMonthlySurplus);
      const requiredExtra = Math.max(0, outlook.requiredExtraMonthlyHKD);
      const delayYears =
        outlook.attainedAtAge == null
          ? null
          : Math.max(0, outlook.attainedAtAge - outlook.targetAge);
      const effortRatio =
        requiredExtra > 0 && monthlySurplus > 0
          ? roundMoney(requiredExtra / monthlySurplus)
          : null;
      goalOutlooks.push({
        name: goalName(goal, decision.goalId),
        targetAge: Math.round(goal.targetAge),
        attainedAge: outlook.attainedAtAge,
        delayYears,
        requiredExtraMonthlyHKD: roundMoney(requiredExtra),
        monthlySurplus,
        effortRatio,
        // Never reached by 90 counts as the worst kind of "late".
        late:
          outlook.attainedAtAge == null || (delayYears != null && delayYears >= 1),
        heavyMonthlyCommitment:
          requiredExtra > 0 &&
          (monthlySurplus <= 0 || effortRatio == null || effortRatio >= 0.3),
      });
    }
  }

  const affectedGoal =
    crisisStressTest.affectedGoalLabel != null
      ? crisisStressTest.affectedGoalLabel.en.trim() ||
        crisisStressTest.affectedGoalLabel.zhHant.trim() ||
        null
      : null;

  return {
    goalsApplied,
    goalsGivenUp,
    goalOutlooks,
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
    runway:
      input.runway ??
      ({
        beforeAge: null,
        afterAge: input.timeline?.retirement.assetsDepletedAtAge ?? null,
      } satisfies ActionGoalsDecisionsPayload["runway"]),
  };
}

type ActionGoalSeedLike = {
  rank: number;
  category: ActionGoal["category"];
  leverType: ActionGoal["leverType"];
  icon: string;
  impactPoints: number;
  gap?: number;
  currentScore?: number;
};

const FALLBACK_TITLE: Record<
  ActionGoal["leverType"],
  Record<ActionGoal["category"], Bilingual>
> = {
  instant: {
    protection: {
      en: "Close your protection gap this week",
      zhHant: "本週補上保障缺口",
    },
    savings: {
      en: "Rebuild emergency cash this week",
      zhHant: "本週重建應急現金",
    },
    investment: {
      en: "Move idle cash into growth this week",
      zhHant: "本週把閒置資金投入增長",
    },
    goal: {
      en: "Fund your next goal this week",
      zhHant: "本週為下一個目標注資",
    },
  },
  structural: {
    protection: {
      en: "Set up your protection cover once",
      zhHant: "一次過設定你的保障",
    },
    savings: {
      en: "Set up an emergency cash floor",
      zhHant: "設定應急現金下限",
    },
    investment: {
      en: "Set up a long-term investment rule",
      zhHant: "設定長期投資規則",
    },
    goal: {
      en: "Lock in your goal plan",
      zhHant: "鎖定你的目標計劃",
    },
  },
  behavioral: {
    protection: {
      en: "Keep your protection review habit",
      zhHant: "保持定期檢視保障的習慣",
    },
    savings: {
      en: "Make saving automatic every month",
      zhHant: "每月自動儲蓄",
    },
    investment: {
      en: "Make your surplus work every month",
      zhHant: "每月讓盈餘自動增值",
    },
    goal: {
      en: "Keep your priority goals on track",
      zhHant: "讓優先目標保持進度",
    },
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
      title: FALLBACK_TITLE[seed.leverType]?.[seed.category] ?? {
        en: "Keep your plan on track",
        zhHant: "讓計劃保持進度",
      },
      category: seed.category,
      leverType: seed.leverType,
      icon: seed.icon,
      impactPoints: seed.impactPoints,
      reasoning: buildFallbackReasoning(
        {
          rank: seed.rank,
          category: seed.category,
          leverType: seed.leverType,
          icon: seed.icon,
          impactPoints: seed.impactPoints,
          gap: seed.gap,
          currentScore: seed.currentScore,
        },
        decisions,
      ),
    }));
}
