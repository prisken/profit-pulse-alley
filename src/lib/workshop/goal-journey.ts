import { deriveGoalYear } from "@/lib/workshop/goal-year";
import { buildAllocationSlices } from "@/lib/workshop/squeeze-solver";
import {
  goalStatusFromAttainment,
  runLifeTimeline,
  type GoalScrubStatus,
  type TimelineInput,
  type TimelineResult,
} from "@/lib/workshop/timeline-engine";
import type {
  ExpensesState,
  GoalItem,
  GoalJourneyDecision,
  GoalJourneyState,
  LayerFlag,
  PyramidState,
  SqueezeRecommendation,
} from "@/lib/workshop/types";

export type GoalJourneySessionState = {
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey: GoalJourneyState;
  squeezeRecommendation?: SqueezeRecommendation | null;
};

export type GoalJourneyTimelineContext = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  industry: string;
  nowYear?: number;
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey: GoalJourneyState;
};

export type GoalOutlook = {
  goalId: string;
  targetAge: number;
  attainedAtAge: number | null;
  status: GoalScrubStatus;
  monthsLate: number;
  requiredExtraMonthlyHKD: number;
};

type GoalJourneyDecisionStatus = GoalJourneyDecision["status"];

export function emptyGoalJourneyState(): GoalJourneyState {
  return { decisions: [], updatedAt: new Date(0).toISOString() };
}

export function parseGoalJourneyState(value: unknown): GoalJourneyState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyGoalJourneyState();
  }
  const record = value as Record<string, unknown>;
  const raw = Array.isArray(record.decisions) ? record.decisions : [];
  return {
    decisions: raw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
      .map((item) => ({
        goalId: String(item.goalId ?? ""),
        status: (
          item.status === "applied" || item.status === "given_up"
            ? item.status
            : "pending"
        ) as GoalJourneyDecisionStatus,
        allowLiquidation: item.allowLiquidation === true,
        acceptedSqueeze: item.acceptedSqueeze === true,
        squeezeCutsHKD:
          item.squeezeCutsHKD &&
          typeof item.squeezeCutsHKD === "object" &&
          !Array.isArray(item.squeezeCutsHKD)
            ? {
                fun: Math.max(
                  0,
                  roundMoney(
                    Number(
                      (item.squeezeCutsHKD as Record<string, unknown>).fun ?? 0,
                    ),
                  ),
                ),
                discretionary: Math.max(
                  0,
                  roundMoney(
                    Number(
                      (item.squeezeCutsHKD as Record<string, unknown>)
                        .discretionary ?? 0,
                    ),
                  ),
                ),
              }
            : undefined,
      }))
      .filter((row) => row.goalId.trim().length > 0),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt
        : new Date(0).toISOString(),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function recalcExpensesTotal(categories: ExpensesState["categories"]): number {
  return categories.reduce((sum, row) => sum + Math.max(0, Math.round(row.amountHKD)), 0);
}

function upsertDecision(
  state: GoalJourneyState,
  decision: GoalJourneyDecision,
): GoalJourneyState {
  const existing = state.decisions.findIndex((row) => row.goalId === decision.goalId);
  const decisions =
    existing === -1
      ? [...state.decisions, decision]
      : state.decisions.map((row, index) => (index === existing ? decision : row));
  return {
    decisions,
    updatedAt: new Date().toISOString(),
  };
}

export function journeyDecisionForGoal(
  journey: GoalJourneyState,
  goalId: string,
): GoalJourneyDecision | undefined {
  return journey.decisions.find((row) => row.goalId === goalId);
}

export function isGoalJourneyResolved(
  decision: GoalJourneyDecision | undefined,
): boolean {
  return decision?.status === "applied" || decision?.status === "given_up";
}

export const RETIREMENT_RAIL_ID = "__retirement_rail__";

export function isRetirementRailGoal(goal: Pick<GoalItem, "goalType">): boolean {
  return goal.goalType === "retirementTarget";
}

/**
 * Spend goals by targetAge, then a retirement rail item (existing retirementTarget
 * or a synthetic placeholder) always last.
 */
export function buildGoalJourneyRailItems(input: {
  goals: GoalItem[];
  retirementAge: number;
  userAge: number;
}): GoalItem[] {
  const spend = [...input.goals]
    .filter((goal) => goal.goalType !== "retirementTarget")
    .sort(
      (a, b) =>
        a.targetAge - b.targetAge || a.id.localeCompare(b.id),
    );

  const existingRetirement = input.goals.find(
    (goal) => goal.goalType === "retirementTarget",
  );
  const retirementAge = Math.round(input.retirementAge);
  const retirement: GoalItem = existingRetirement
    ? {
        ...existingRetirement,
        targetAge: Math.round(existingRetirement.targetAge) || retirementAge,
      }
    : {
        id: RETIREMENT_RAIL_ID,
        icon: "Landmark",
        label: { en: "Retirement", zhHant: "退休" },
        targetAmountHKD: 0,
        targetAge: retirementAge,
        targetYear: deriveGoalYear(retirementAge, input.userAge),
        goalType: "retirementTarget",
      };

  return [...spend, retirement];
}

export function isRailGoalLocked(
  railItems: GoalItem[],
  journey: GoalJourneyState,
  index: number,
): boolean {
  for (let i = 0; i < index; i += 1) {
    const earlier = railItems[i];
    if (!earlier) {
      continue;
    }
    if (!isGoalJourneyResolved(journeyDecisionForGoal(journey, earlier.id))) {
      return true;
    }
  }
  return false;
}

export function firstPendingRailGoalId(
  railItems: GoalItem[],
  journey: GoalJourneyState,
): string | null {
  for (let i = 0; i < railItems.length; i += 1) {
    const goal = railItems[i]!;
    if (isRailGoalLocked(railItems, journey, i)) {
      continue;
    }
    // Retirement is never Apply/Give-up resolved — once unlocked it is the finale.
    if (
      isRetirementRailGoal(goal) ||
      !isGoalJourneyResolved(journeyDecisionForGoal(journey, goal.id))
    ) {
      return goal.id;
    }
  }
  return null;
}

/** True when every spend (non-retirement) rail item has Apply or Give up. */
export function areSpendGoalsResolved(
  railItems: GoalItem[],
  journey: GoalJourneyState,
): boolean {
  return railItems
    .filter((goal) => !isRetirementRailGoal(goal))
    .every((goal) =>
      isGoalJourneyResolved(journeyDecisionForGoal(journey, goal.id)),
    );
}

export type GoalJourneyRailChip = "on_track" | "delayed" | "given_up";

export type GoalJourneyDecisionRecapChip = {
  goalId: string;
  label: GoalItem["label"];
  chip: GoalJourneyRailChip;
};

export type GoalJourneyDecisionRecap = {
  onTimeCount: number;
  delayedCount: number;
  givenUpCount: number;
  chips: GoalJourneyDecisionRecapChip[];
  /** Lifestyle monthly total (expenses + fun) before/after accepted squeezes. */
  monthlyPlan: {
    beforeTotalHKD: number;
    afterTotalHKD: number;
  } | null;
};

/**
 * Pure summary for the retirement finale card — counts + chips from journey
 * decisions + timeline flags; optional monthly plan line when squeezes landed.
 */
export function deriveGoalJourneyDecisionRecap(input: {
  railItems: GoalItem[];
  journey: GoalJourneyState;
  timeline: TimelineResult | null;
  expenses: ExpensesState;
  monthlyFunHKD: number;
}): GoalJourneyDecisionRecap {
  let onTimeCount = 0;
  let delayedCount = 0;
  let givenUpCount = 0;
  const chips: GoalJourneyDecisionRecapChip[] = [];

  for (const goal of input.railItems) {
    if (isRetirementRailGoal(goal)) {
      continue;
    }
    const decision = journeyDecisionForGoal(input.journey, goal.id);
    const timelineGoal = input.timeline?.goals.find(
      (row) => row.goalId === goal.id,
    );
    const chip = resolveGoalJourneyRailChip({
      decision,
      timelineStatus: timelineGoal?.status ?? null,
    });
    if (!chip) {
      continue;
    }
    if (chip === "on_track") {
      onTimeCount += 1;
    } else if (chip === "delayed") {
      delayedCount += 1;
    } else {
      givenUpCount += 1;
    }
    chips.push({ goalId: goal.id, label: goal.label, chip });
  }

  const acceptedSqueezes = input.journey.decisions.filter(
    (row) => row.status === "applied" && row.acceptedSqueeze,
  );
  let monthlyPlan: GoalJourneyDecisionRecap["monthlyPlan"] = null;
  if (acceptedSqueezes.length > 0) {
    const cutMonthly = acceptedSqueezes.reduce((sum, row) => {
      const funAnnual = Math.max(0, row.squeezeCutsHKD?.fun ?? 0);
      const discAnnual = Math.max(0, row.squeezeCutsHKD?.discretionary ?? 0);
      return sum + funAnnual / 12 + discAnnual / 12;
    }, 0);
    const afterTotalHKD = roundMoney(
      Math.max(0, input.expenses.totalHKD) + Math.max(0, input.monthlyFunHKD),
    );
    const beforeTotalHKD = roundMoney(afterTotalHKD + cutMonthly);
    monthlyPlan = { beforeTotalHKD, afterTotalHKD };
  }

  return {
    onTimeCount,
    delayedCount,
    givenUpCount,
    chips,
    monthlyPlan,
  };
}

export function resolveGoalJourneyRailChip(input: {
  decision: GoalJourneyDecision | undefined;
  /** Timeline layer flag for applied goals (green/amber/red). */
  timelineStatus?: LayerFlag | null;
}): GoalJourneyRailChip | null {
  if (!isGoalJourneyResolved(input.decision)) {
    return null;
  }
  if (input.decision?.status === "given_up") {
    return "given_up";
  }
  if (input.timelineStatus === "amber" || input.timelineStatus === "red") {
    return "delayed";
  }
  return "on_track";
}

export function activeGoalsForJourney(
  pyramid: PyramidState,
  journey: GoalJourneyState,
): GoalItem[] {
  const excluded = new Set(
    journey.decisions
      .filter((row) => row.status === "given_up")
      .map((row) => row.goalId),
  );
  return pyramid.goals.goals.filter((goal) => !excluded.has(goal.id));
}

export function applyGoalDecision(
  state: GoalJourneySessionState,
  goalId: string,
  decision: GoalJourneyDecision,
): {
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey: GoalJourneyState;
} {
  let pyramid: PyramidState = state.pyramid;
  let expenses: ExpensesState = state.expenses;

  if (decision.status === "applied" && decision.acceptedSqueeze) {
    const recommendation = state.squeezeRecommendation;
    if (!recommendation) {
      throw new Error("Squeeze recommendation is required before accepting a squeeze.");
    }

    const recommendedFun = recommendation.recommendedAllocation.find(
      (slice) => slice.key === "fun",
    )?.amountHKD;
    const recommendedExpenseByKey = new Map(
      recommendation.recommendedAllocation.map((slice) => [slice.key, slice.amountHKD]),
    );

    pyramid = {
      ...pyramid,
      investment: {
        ...pyramid.investment,
        monthlyFunHKD:
          recommendedFun == null
            ? pyramid.investment.monthlyFunHKD
            : Math.max(0, roundMoney(recommendedFun)),
      },
    };

    const categories = expenses.categories.map((row) => ({
      ...row,
      amountHKD: recommendedExpenseByKey.has(row.key)
        ? Math.max(0, roundMoney(recommendedExpenseByKey.get(row.key)!))
        : row.amountHKD,
    }));
    expenses = {
      categories,
      totalHKD: recalcExpensesTotal(categories),
    };
  }

  if (decision.status === "applied") {
    pyramid = {
      ...pyramid,
      goals: {
        goals: pyramid.goals.goals.map((goal) =>
          goal.id === goalId
            ? { ...goal, allowLiquidation: decision.allowLiquidation }
            : goal,
        ),
      },
    };
  }

  const journey = upsertDecision(state.journey, decision);
  return { pyramid, expenses, journey };
}

export function rerunTimelineForJourney(
  session: GoalJourneyTimelineContext,
): TimelineResult {
  const retirementAge = Math.min(
    80,
    Math.max(session.age + 1, Math.round(session.retirementAge)),
  );

  const input: TimelineInput = {
    age: session.age,
    retirementAge,
    monthlyIncome: session.monthlyIncome,
    monthlyExpenses: session.expenses.totalHKD,
    monthlyFun: session.pyramid.investment.monthlyFunHKD,
    emergencyFundSavedHKD: session.pyramid.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: session.pyramid.investment.lumpSumHKD,
      monthlyInvestmentHKD: session.pyramid.investment.monthlyInvestmentHKD,
      allocation: session.pyramid.investment.riskAllocation,
    },
    goals: activeGoalsForJourney(session.pyramid, session.journey),
    industry: session.industry,
    nowYear: session.nowYear,
  };

  return runLifeTimeline(input);
}

function scrubStatusFromProjection(
  projection: { attainedAtAge: number | null; targetAge: number; status?: string },
  currentAge: number,
): GoalScrubStatus {
  const layerFlag = goalStatusFromAttainment(
    projection.attainedAtAge,
    projection.targetAge,
    currentAge,
  );
  if (projection.attainedAtAge == null || layerFlag === "red") {
    return "never";
  }
  if (projection.attainedAtAge <= currentAge) {
    return "attained";
  }
  if (layerFlag === "amber" || projection.attainedAtAge > projection.targetAge) {
    return "late";
  }
  return "on_track";
}

export function computeGoalOutlook(
  timeline: TimelineResult,
  goal: GoalItem,
): GoalOutlook {
  const currentAge = timeline.rows[0]?.age ?? 0;

  if (goal.goalType === "retirementTarget") {
    const rt = timeline.retirementTargets.find((row) => row.goalId === goal.id);
    const attainedAtAge = rt?.met ? timeline.retirement.retirementAge : null;
    const status: GoalScrubStatus =
      rt == null
        ? "never"
        : rt.met
          ? "on_track"
          : rt.gapHKD / Math.max(1, rt.targetHKD) <= 0.2
            ? "late"
            : "never";
    const monthsLate =
      attainedAtAge == null
        ? Math.max(12, (timeline.retirement.retirementAge - goal.targetAge) * 12)
        : Math.max(0, (attainedAtAge - goal.targetAge) * 12);
    const requiredExtraMonthlyHKD =
      rt == null
        ? 0
        : roundMoney(
            Math.max(0, rt.gapHKD) /
              Math.max(1, (goal.targetAge - currentAge) * 12),
          );
    return {
      goalId: goal.id,
      targetAge: goal.targetAge,
      attainedAtAge,
      status,
      monthsLate,
      requiredExtraMonthlyHKD,
    };
  }

  const projection = timeline.goals.find((row) => row.goalId === goal.id);
  if (!projection) {
    return {
      goalId: goal.id,
      targetAge: goal.targetAge,
      attainedAtAge: null,
      status: "never",
      monthsLate: 12,
      requiredExtraMonthlyHKD: 0,
    };
  }

  const rowAtTarget = timeline.rows.find((row) => row.age === goal.targetAge);
  const availableAtTarget = rowAtTarget
    ? roundMoney(
        rowAtTarget.liquidPool + (goal.allowLiquidation === true ? rowAtTarget.investedPool : 0),
      )
    : 0;
  const shortfallHKD = roundMoney(
    Math.max(0, projection.inflatedTargetHKD - availableAtTarget),
  );
  const monthsUntilTarget = Math.max(1, (goal.targetAge - currentAge) * 12);

  return {
    goalId: goal.id,
    targetAge: projection.targetAge,
    attainedAtAge: projection.attainedAtAge,
    status: scrubStatusFromProjection(projection, currentAge),
    monthsLate:
      projection.attainedAtAge == null
        ? Math.max(12, (90 - projection.targetAge) * 12)
        : Math.max(0, (projection.attainedAtAge - projection.targetAge) * 12),
    requiredExtraMonthlyHKD: roundMoney(shortfallHKD / monthsUntilTarget),
  };
}

export function currentJourneyAllocation(input: {
  monthlyIncomeHKD: number;
  expenses: ExpensesState;
  monthlyFunHKD: number;
  monthlyInvestmentHKD: number;
}) {
  return buildAllocationSlices({
    monthlyIncomeHKD: input.monthlyIncomeHKD,
    expenses: input.expenses,
    monthlyFunHKD: input.monthlyFunHKD,
    monthlyInvestmentHKD: input.monthlyInvestmentHKD,
  });
}
