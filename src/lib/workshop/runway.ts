/**
 * v5 hero "money runway" comparison.
 * Pure TypeScript — deterministic, no AI, no I/O.
 *
 * beforeAge: assets-last-until age on the plan WITHOUT the user's goal-journey
 * decisions (all goals active, no liquidation, pre-squeeze expenses).
 * afterAge: same figure on the final mutated plan.
 * null age = assets sustained past 90.
 */

import { activeGoalsForJourney } from "@/lib/workshop/goal-journey";
import { runLifeTimeline } from "@/lib/workshop/timeline-engine";
import type {
  ExpensesState,
  GoalJourneyState,
  PyramidState,
} from "@/lib/workshop/types";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";

export function computeRunwayBeforeAfter(input: {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  industry: string;
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey: GoalJourneyState;
  timeline?: TimelineResult | null;
  nowYear?: number;
}): { beforeAge: number | null; afterAge: number | null } {
  const { pyramid, expenses, journey } = input;
  const retirementAge = Math.min(
    80,
    Math.max(input.age + 1, Math.round(input.retirementAge)),
  );

  // Reconstruct the pre-journey plan: all goals active, no liquidation,
  // squeeze cuts added back to discretionary.
  const preGoals = pyramid.goals.goals.map((goal) => ({
    ...goal,
    allowLiquidation: false,
  }));
  const cutMonthly = journey.decisions.reduce((sum, row) => {
    if (row.status === "applied" && row.acceptedSqueeze) {
      return sum + Math.max(0, row.squeezeCutsHKD?.discretionary ?? 0) / 12;
    }
    return sum;
  }, 0);
  const preExpenses: ExpensesState = {
    totalHKD: Math.round((Math.max(0, expenses.totalHKD) + cutMonthly) * 100) / 100,
    categories: expenses.categories.map((row) =>
      row.key === "discretionary"
        ? { ...row, amountHKD: Math.round((row.amountHKD + cutMonthly) * 100) / 100 }
        : row,
    ),
  };

  const beforeTimeline = runLifeTimeline({
    age: input.age,
    retirementAge,
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses: preExpenses.totalHKD,
    emergencyFundSavedHKD: pyramid.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: pyramid.investment.lumpSumHKD,
      allocation: pyramid.investment.riskAllocation,
    },
    goals: preGoals,
    industry: input.industry,
    nowYear: input.nowYear,
  });

  const afterTimeline =
    input.timeline && input.timeline.rows.length > 0
      ? input.timeline
      : runLifeTimeline({
          age: input.age,
          retirementAge,
          monthlyIncome: input.monthlyIncome,
          monthlyExpenses: expenses.totalHKD,
          emergencyFundSavedHKD: pyramid.emergencyFund.savedAmountHKD,
          investment: {
            lumpSumHKD: pyramid.investment.lumpSumHKD,
            allocation: pyramid.investment.riskAllocation,
          },
          goals: activeGoalsForJourney(pyramid, journey),
          industry: input.industry,
          nowYear: input.nowYear,
        });

  return {
    beforeAge: beforeTimeline.retirement.assetsDepletedAtAge,
    afterAge: afterTimeline.retirement.assetsDepletedAtAge,
  };
}
