/**
 * Deterministic trade-off summary for the Blueprint PDF.
 * Pure TypeScript — no AI.
 */

import type {
  Bilingual,
  GoalItem,
  GoalJourneyState,
  PyramidState,
} from "@/lib/workshop/types";

export type TradeOffSecuredGoal = {
  goalId: string;
  label: Bilingual;
  targetAge: number;
  usedLiquidation: boolean;
};

export type TradeOffDeprioritizedGoal = {
  goalId: string;
  label: Bilingual;
  targetAge: number;
};

export type TradeOffSqueeze = {
  category: "fun" | "discretionary";
  monthlyAmount: number;
};

export type TradeOffDecisionsSummary = {
  secured: TradeOffSecuredGoal[];
  deprioritized: TradeOffDeprioritizedGoal[];
  squeezesAccepted: TradeOffSqueeze[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function goalLabel(goal: GoalItem | undefined, goalId: string): Bilingual {
  if (goal?.label) {
    return goal.label;
  }
  return { en: goalId, zhHant: goalId };
}

/**
 * Build bilingual trade-off rows from persisted goal journey + final pyramid.
 */
export function deriveTradeOffDecisions(input: {
  pyramid: PyramidState;
  journey: GoalJourneyState | null | undefined;
}): TradeOffDecisionsSummary | null {
  const journey = input.journey;
  if (!journey?.decisions?.length) {
    return null;
  }

  const byId = new Map(input.pyramid.goals.goals.map((g) => [g.id, g]));
  const secured: TradeOffSecuredGoal[] = [];
  const deprioritized: TradeOffDeprioritizedGoal[] = [];
  let funMonthly = 0;
  let discMonthly = 0;

  for (const decision of journey.decisions) {
    const goal = byId.get(decision.goalId);
    if (decision.status === "applied") {
      secured.push({
        goalId: decision.goalId,
        label: goalLabel(goal, decision.goalId),
        targetAge: Math.round(goal?.targetAge ?? 0),
        usedLiquidation: decision.allowLiquidation === true,
      });
      if (decision.acceptedSqueeze && decision.squeezeCutsHKD) {
        funMonthly += Math.max(0, decision.squeezeCutsHKD.fun) / 12;
        discMonthly += Math.max(0, decision.squeezeCutsHKD.discretionary) / 12;
      }
    } else if (decision.status === "given_up") {
      deprioritized.push({
        goalId: decision.goalId,
        label: goalLabel(goal, decision.goalId),
        targetAge: Math.round(goal?.targetAge ?? 0),
      });
    }
  }

  const squeezesAccepted: TradeOffSqueeze[] = [];
  if (funMonthly > 0) {
    squeezesAccepted.push({
      category: "fun",
      monthlyAmount: roundMoney(funMonthly),
    });
  }
  if (discMonthly > 0) {
    squeezesAccepted.push({
      category: "discretionary",
      monthlyAmount: roundMoney(discMonthly),
    });
  }

  if (
    secured.length === 0 &&
    deprioritized.length === 0 &&
    squeezesAccepted.length === 0
  ) {
    return null;
  }

  return { secured, deprioritized, squeezesAccepted };
}
