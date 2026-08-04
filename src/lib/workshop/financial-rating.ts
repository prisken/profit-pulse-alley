/**
 * Deterministic workshop financial rating (0–100).
 * Pure math — no AI.
 */

import type { PyramidBenchmarkSnapshot } from "@/lib/workshop/pyramid-benchmarks";
import type {
  CrisisState,
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

export type FinancialRatingInput = {
  pyramid: PyramidState;
  benchmarks: Pick<
    PyramidBenchmarkSnapshot,
    | "medicalCoveragePercent"
    | "criticalIllnessAmountHKD"
    | "emergencyFundTargetMonths"
    | "emergencyFundTargetHKD"
  >;
  stressTest: StressTestResult;
  crisis: CrisisState;
};

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
 * Months of coverage at now vs industry target months.
 * Uses saved / target HKD × target months (equivalent to saved÷monthly burn).
 */
function scoreEmergencyFund(
  pyramid: PyramidState,
  benchmarks: FinancialRatingInput["benchmarks"],
  stressTest: StressTestResult,
): number {
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

function scoreGoalsOnTrack(stressTest: StressTestResult): number {
  const goals = stressTest.goalProjections;
  if (!goals.length) {
    return 0;
  }
  const credit = goals.reduce((sum, goal) => {
    if (goal.status === "green") {
      return sum + 1;
    }
    if (goal.status === "amber") {
      return sum + 0.5;
    }
    return sum;
  }, 0);
  return clampScore((credit / goals.length) * 100);
}

/**
 * Inverse severity: start at 100, subtract per distinct impact layer and
 * soft penalties for income % / one-time cost size.
 */
function scoreCrisisResilience(crisis: CrisisState): number {
  const layers = new Set(crisis.impacts.map((impact) => impact.layer));
  const layerPenalty = layers.size * PENALTY_PER_IMPACT_LAYER;
  const incomePenalty =
    Math.min(100, Math.max(0, crisis.monthlyIncomeImpactPercent)) *
    PENALTY_PER_INCOME_PERCENT;
  const oneTimePenalty =
    (Math.max(0, crisis.oneTimeCostHKD) / 100_000) * PENALTY_ONE_TIME_PER_100K;

  return clampScore(100 - layerPenalty - incomePenalty - oneTimePenalty);
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
  );
  const goalsOnTrack = scoreGoalsOnTrack(input.stressTest);
  const crisisResilience = scoreCrisisResilience(input.crisis);

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
 * were closed to full marks. `currentGap` is 0–100 points missing in that pillar.
 */
export function computeGoalImpactPoints(
  _category: RatingCategory | "savings" | "investment" | "goal" | "protection",
  currentGap: number,
  weight: number,
): number {
  const gap = clampScore(currentGap);
  const w = Math.min(1, Math.max(0, weight));
  // Overall score moves by weight × gap (e.g. 0.25 × 60 = 15 pts).
  return Math.round(w * gap * 10) / 10;
}
