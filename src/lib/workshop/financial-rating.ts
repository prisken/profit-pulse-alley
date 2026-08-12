/**
 * Deterministic workshop financial rating (0–100).
 * Pure math — no AI.
 *
 * v4 sources:
 * - goalsOnTrack: 100% TimelineResult goal statuses (retirement-readiness blend
 *   removed with the retirement nest-egg feature). Spend goals use
 *   green/amber/red; given-up journey decisions score
 *   {@link GIVEN_UP_GOAL_CREDIT} (conscious trade-off, not a red failure).
 * - emergencyFund: timeline EF status; "oversaved" is a mild deduction.
 * - crisisResilience: prefers Summary crisis stress-test resilienceScore (SSOT
 *   with the Crisis Stress Test badge). Falls back to crisis-engine impactResult
 *   when no stress test is present (legacy sessions).
 */

import type { PyramidBenchmarkSnapshot } from "@/lib/workshop/pyramid-benchmarks";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  CrisisState,
  CrisisStressTestSummary,
  GoalJourneyState,
  PyramidState,
  StressTestResult,
  SummaryRating,
  SummaryRatingLabelKey,
} from "@/lib/workshop/types";

export const RATING_WEIGHTS = {
  protection: 0.25,
  emergencyFund: 0.25,
  goalsOnTrack: 0.3,
  crisisResilience: 0.2,
} as const;

export type RatingCategory = keyof typeof RATING_WEIGHTS;

/** Optional context for category-aware impact-point levers. */
export type GoalImpactContext = {
  efStatus?: string;
  excessHKD?: number;
  coverageRatio?: number;
  assetsDepletedAtAge?: number | null;
};

export type FinancialRatingInput = {
  pyramid: PyramidState;
  benchmarks: Pick<
    PyramidBenchmarkSnapshot,
    | "medicalCoveragePercent"
    | "criticalIllnessAmountHKD"
    | "emergencyFundTargetMonths"
    | "emergencyFundTargetHKD"
  >;
  /** Legacy bridge / fallback when timeline is unavailable. */
  stressTest: StressTestResult;
  /**
   * Optional while Crisis is folded into Summary. Missing crisis → neutral
   * resilience score (does not gate the Summary step).
   */
  crisis?: CrisisState | null;
  /**
   * Preferred SSOT for Crisis Resilience (Summary silent stress test).
   * When present, overrides {@link crisis} for that pillar.
   */
  crisisStressTest?: CrisisStressTestSummary | null;
  /** Preferred v3 source for goals, EF status, and retirement readiness. */
  timeline?: TimelineResult | null;
  /**
   * When present, given-up goals score {@link GIVEN_UP_GOAL_CREDIT} instead of
   * vanishing from the average or counting as red failures.
   */
  journey?: GoalJourneyState | null;
};

/** Oversaved EF scores here — better than red/amber underfunding, worse than green. */
export const OVERSAVED_EF_SCORE = 88;

/**
 * Credit for a consciously given-up goal in goalsOnTrack.
 * Between amber (0.5) and green (1.0) — not a failure (red = 0).
 */
export const GIVEN_UP_GOAL_CREDIT = 0.6;

/** Goals pillar is 100% goal flags (retirement readiness removed in v4). */
export const GOALS_RETIREMENT_BLEND = {
  goals: 1,
  retirement: 0,
} as const;

const PENALTY_PER_IMPACT_LAYER = 15;
const PENALTY_PER_INCOME_PERCENT = 0.25;
const PENALTY_ONE_TIME_PER_100K = 3;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function ratingLabelKey(score: number): SummaryRatingLabelKey {
  if (score <= 40) {
    return "needsAttention";
  }
  if (score <= 70) {
    return "goodRoomToGrow";
  }
  return "strongFoundation";
}

function scoreProtection(
  pyramid: PyramidState,
  benchmarks: FinancialRatingInput["benchmarks"],
): number {
  const medicalBench = Math.max(1, benchmarks.medicalCoveragePercent);
  const ciBench = Math.max(1, benchmarks.criticalIllnessAmountHKD);
  const medicalRatio =
    Math.max(0, pyramid.protection.medicalCoveragePercent) / medicalBench;
  const ciRatio =
    Math.max(0, pyramid.protection.criticalIllnessAmountHKD) / ciBench;
  return clampScore(((medicalRatio + ciRatio) / 2) * 100);
}

/**
 * Emergency fund pillar.
 * Prefer timeline EF status when present (incl. oversaved mild deduction).
 */
function scoreEmergencyFund(
  pyramid: PyramidState,
  benchmarks: FinancialRatingInput["benchmarks"],
  stressTest: StressTestResult,
  timeline?: TimelineResult | null,
): number {
  if (timeline) {
    const ef = timeline.emergencyFund;
    if (ef.status === "oversaved") {
      return OVERSAVED_EF_SCORE;
    }
    if (ef.status === "green") {
      return 100;
    }
    if (ef.targetHKD <= 0) {
      return pyramid.emergencyFund.savedAmountHKD > 0 ? 100 : 50;
    }
    const ratio =
      Math.max(0, pyramid.emergencyFund.savedAmountHKD) / ef.targetHKD;
    if (ef.status === "amber") {
      return clampScore(ratio * 100);
    }
    return clampScore(ratio * 100);
  }

  const targetMonths = Math.max(
    1,
    benchmarks.emergencyFundTargetMonths ||
      stressTest.emergencyFundProjection.targetMonths,
  );
  const targetHKD = Math.max(1, benchmarks.emergencyFundTargetHKD);
  const monthsNow =
    (Math.max(0, pyramid.emergencyFund.savedAmountHKD) / targetHKD) *
    targetMonths;
  return clampScore((monthsNow / targetMonths) * 100);
}

/**
 * Retirement readiness from assetsDepletedAtAge.
 * Retained for legacy sessions / PDF compat — not part of the v4 rating.
 */
export function scoreRetirementReadiness(
  timeline?: TimelineResult | null,
): number {
  if (!timeline) {
    return 100;
  }
  const depleted = timeline.retirement.assetsDepletedAtAge;
  const retAge = timeline.retirement.retirementAge;
  if (depleted == null) {
    return 100;
  }
  if (depleted >= 85) {
    return 85;
  }
  if (depleted >= retAge + 15) {
    return 70;
  }
  if (depleted >= retAge + 5) {
    return 45;
  }
  return 20;
}

function scoreGoalFlags(
  stressTest: StressTestResult,
  timeline?: TimelineResult | null,
  journey?: GoalJourneyState | null,
): number {
  const givenUpIds = new Set(
    (journey?.decisions ?? [])
      .filter((row) => row.status === "given_up")
      .map((row) => row.goalId),
  );

  if (timeline && timeline.goals.length > 0) {
    let credit = 0;
    let count = 0;

    for (const goal of timeline.goals) {
      if (givenUpIds.has(goal.goalId)) {
        credit += GIVEN_UP_GOAL_CREDIT;
        count += 1;
        continue;
      }
      count += 1;
      if (goal.status === "green") {
        credit += 1;
      } else if (goal.status === "amber") {
        credit += 0.5;
      }
    }

    // Given-up goals are excluded from the timeline — still count them neutrally.
    for (const goalId of givenUpIds) {
      if (!timeline.goals.some((g) => g.goalId === goalId)) {
        credit += GIVEN_UP_GOAL_CREDIT;
        count += 1;
      }
    }

    if (count <= 0) {
      return 0;
    }
    return clampScore((credit / count) * 100);
  }

  const goals = stressTest.goalProjections;
  if (!goals.length && givenUpIds.size === 0) {
    return 0;
  }
  let credit = 0;
  let count = 0;
  for (const goal of goals) {
    if (givenUpIds.has(goal.goalId)) {
      credit += GIVEN_UP_GOAL_CREDIT;
      count += 1;
      continue;
    }
    count += 1;
    if (goal.status === "green") {
      credit += 1;
    } else if (goal.status === "amber") {
      credit += 0.5;
    }
  }
  for (const goalId of givenUpIds) {
    if (!goals.some((g) => g.goalId === goalId)) {
      credit += GIVEN_UP_GOAL_CREDIT;
      count += 1;
    }
  }
  if (count <= 0) {
    return 0;
  }
  return clampScore((credit / count) * 100);
}

/**
 * Goals pillar: goal attainment flags. Retirement readiness was folded out
 * of the v4 rating together with the retirement nest-egg feature.
 */
function scoreGoalsOnTrack(
  stressTest: StressTestResult,
  timeline?: TimelineResult | null,
  journey?: GoalJourneyState | null,
): number {
  const goals = scoreGoalFlags(stressTest, timeline, journey);
  const retirement = scoreRetirementReadiness(timeline);
  return clampScore(
    goals * GOALS_RETIREMENT_BLEND.goals +
      retirement * GOALS_RETIREMENT_BLEND.retirement,
  );
}

/**
 * Crisis resilience from crisis-engine output when available.
 * Neutral midpoint when no crisis has been generated yet.
 */
function scoreCrisisResilience(crisis: CrisisState | null | undefined): number {
  if (!crisis) {
    return 70;
  }
  const result = crisis.impactResult;
  if (!result) {
    const layers = new Set(crisis.impacts.map((impact) => impact.layer));
    const layerPenalty = layers.size * PENALTY_PER_IMPACT_LAYER;
    const incomePenalty =
      Math.min(100, Math.max(0, crisis.monthlyIncomeImpactPercent)) *
      PENALTY_PER_INCOME_PERCENT;
    const oneTimePenalty =
      (Math.max(0, crisis.oneTimeCostHKD) / 100_000) * PENALTY_ONE_TIME_PER_100K;
    return clampScore(100 - layerPenalty - incomePenalty - oneTimePenalty);
  }

  let score = 55;

  // Reward actual coverage offset ratio (protection payoff).
  if (result.coverage && result.coverage.grossCostHKD > 0) {
    const ratio = result.coverage.coveredHKD / result.coverage.grossCostHKD;
    score += ratio * 30;
  } else if (
    result.crisisType !== "medical" &&
    result.crisisType !== "critical_illness" &&
    result.crisisType !== "accident"
  ) {
    // Non-protection crises: small baseline (no coverage card expected).
    score += 8;
  }

  // Reward surviving the cut order without liquidating invested assets.
  if (result.cutOrder.investedAbsorbedHKD <= 0) {
    score += 18;
  } else {
    score -= Math.min(22, result.cutOrder.investedAbsorbedHKD / 40_000);
  }

  // Soft penalties for income hit / remaining uncovered / market wipe.
  score -= result.incomeHitPct * 0.12;
  score -= Math.min(12, result.cutOrder.remainingUncoveredHKD / 25_000);
  if (result.marketDropHKD > 0) {
    score -= Math.min(10, result.marketDropHKD / 80_000);
  }

  return clampScore(score);
}

/**
 * Weighted 0–100 financial rating with per-pillar breakdown.
 */
export function computeFinancialRating(
  input: FinancialRatingInput,
): SummaryRating {
  const protection = scoreProtection(input.pyramid, input.benchmarks);
  const emergencyFund = scoreEmergencyFund(
    input.pyramid,
    input.benchmarks,
    input.stressTest,
    input.timeline,
  );
  const goalsOnTrack = scoreGoalsOnTrack(
    input.stressTest,
    input.timeline,
    input.journey,
  );
  const crisisResilience =
    input.crisisStressTest != null
      ? clampScore(Math.round(input.crisisStressTest.resilienceScore))
      : scoreCrisisResilience(input.crisis);

  const score = clampScore(
    protection * RATING_WEIGHTS.protection +
      emergencyFund * RATING_WEIGHTS.emergencyFund +
      goalsOnTrack * RATING_WEIGHTS.goalsOnTrack +
      crisisResilience * RATING_WEIGHTS.crisisResilience,
  );

  return {
    score: Math.round(score),
    labelKey: ratingLabelKey(score),
    breakdown: {
      protection: Math.round(protection),
      emergencyFund: Math.round(emergencyFund),
      goalsOnTrack: Math.round(goalsOnTrack),
      crisisResilience: Math.round(crisisResilience),
    },
  };
}

/**
 * Deterministic points gained on the overall score if one category gap
 * were closed to full marks.
 *
 * Category levers (v3):
 * - savings / emergencyFund + oversaved → redeploying excess to investment
 *   still yields meaningful impact even when the EF "gap" looks small.
 * - protection + low coverageRatio → closing the cover gap is high leverage.
 * - goalsOnTrack + early depletion → retirement runway actions matter more.
 */
export function computeGoalImpactPoints(
  category: RatingCategory | "savings" | "investment" | "goal" | "protection",
  currentGap: number,
  weight: number,
  context?: GoalImpactContext,
): number {
  const gap = clampScore(currentGap);
  const w = Math.min(1, Math.max(0, weight));
  let points = w * gap;

  const isEfCategory =
    category === "emergencyFund" || category === "savings";
  if (isEfCategory && context?.efStatus === "oversaved") {
    // Moving EF excess into investment: treat as at least a mid-teen pillar lift.
    const excessBoost = Math.min(
      18,
      8 + Math.max(0, context.excessHKD ?? 0) / 50_000,
    );
    points = Math.max(points, w * excessBoost * 4);
  }

  if (
    category === "protection" &&
    context?.coverageRatio != null &&
    context.coverageRatio < 0.5
  ) {
    points = Math.max(points, w * Math.max(gap, 40));
  }

  if (
    (category === "goalsOnTrack" || category === "goal") &&
    context?.assetsDepletedAtAge != null
  ) {
    points = Math.max(points, w * Math.max(gap, 35));
  }

  return Math.round(points * 10) / 10;
}
