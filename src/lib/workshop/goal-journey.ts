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

/**
 * All goals are spend goals — sorted by targetAge (then id).
 */
export function buildGoalJourneyRailItems(input: {
  goals: GoalItem[];
}): GoalItem[] {
  return [...input.goals].sort(
    (a, b) =>
      a.targetAge - b.targetAge || a.id.localeCompare(b.id),
  );
}

/**
 * Normalize pyramid goals for Steps 2↔4 sync:
 * - every goal is a spend goal (goalType removed in v4; legacy JSON is demoted)
 * - sorted by targetAge
 */
export function normalizeGoalsLayerForPyramid(
  goals: GoalItem[],
  input: { userAge: number; retirementAge: number },
): GoalItem[] {
  void input.retirementAge;
  const userAge = Math.round(input.userAge);

  const normalized: GoalItem[] = goals.map((raw) => ({
    id: raw.id,
    icon: raw.icon,
    label: raw.label,
    targetAmountHKD: raw.targetAmountHKD,
    targetAge: Math.round(raw.targetAge),
    targetYear: deriveGoalYear(Math.round(raw.targetAge), userAge),
    allowLiquidation: raw.allowLiquidation === true,
  }));

  normalized.sort(
    (a, b) => a.targetAge - b.targetAge || a.id.localeCompare(b.id),
  );

  return normalized;
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
    if (!isGoalJourneyResolved(journeyDecisionForGoal(journey, goal.id))) {
      return goal.id;
    }
  }
  return null;
}

/** True when every spend rail item has Apply or Give up. */
export function areSpendGoalsResolved(
  railItems: GoalItem[],
  journey: GoalJourneyState,
): boolean {
  if (railItems.length === 0) {
    return true;
  }
  return railItems.every((goal) =>
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
  /** Lifestyle monthly total (expenses) before/after accepted squeezes. */
  monthlyPlan: {
    beforeTotalHKD: number;
    afterTotalHKD: number;
  } | null;
};

/**
 * Pure summary for the decision recap — counts + chips from journey
 * decisions + timeline flags; optional monthly plan line when squeezes landed.
 */
export function deriveGoalJourneyDecisionRecap(input: {
  railItems: GoalItem[];
  journey: GoalJourneyState;
  timeline: TimelineResult | null;
  expenses: ExpensesState;
}): GoalJourneyDecisionRecap {
  let onTimeCount = 0;
  let delayedCount = 0;
  let givenUpCount = 0;
  const chips: GoalJourneyDecisionRecapChip[] = [];

  for (const goal of input.railItems) {
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
      const discAnnual = Math.max(0, row.squeezeCutsHKD?.discretionary ?? 0);
      return sum + discAnnual / 12;
    }, 0);
    const afterTotalHKD = roundMoney(Math.max(0, input.expenses.totalHKD));
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

    const recommendedExpenseByKey = new Map(
      recommendation.recommendedAllocation.map((slice) => [slice.key, slice.amountHKD]),
    );

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
    emergencyFundSavedHKD: session.pyramid.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: session.pyramid.investment.lumpSumHKD,
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
}) {
  return buildAllocationSlices({
    monthlyIncomeHKD: input.monthlyIncomeHKD,
    expenses: input.expenses,
  });
}
