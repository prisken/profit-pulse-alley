/**
 * v5.2 deterministic action-goal seed selection.
 * Pure TypeScript — no AI, no I/O (kept OUT of "use server" modules so it is
 * unit-testable and Next.js does not treat it as a server action).
 *
 * Rules:
 * - One seed per lever type (instant / structural / behavioral), ranks 1–3 fixed.
 * - The category for each lever is chosen by RATING GAP, not fixed mapping:
 *   a pillar that is already strong (gap below {@link MIN_RECOMMEND_GAP}) is
 *   never recommended while weaker pillars exist. This prevents recommending
 *   medical insurance when the protection pillar is already ~90+.
 * - A small "natural" bonus biases near-ties toward the lever's home category
 *   so the lever framing stays coherent (instant → savings, structural →
 *   protection, behavioral → goal/investment).
 */

import {
  computeGoalImpactPoints,
  RATING_WEIGHTS,
  type GoalImpactContext,
  type RatingCategory,
} from "@/lib/workshop/financial-rating";
import type { ActionGoal, SummaryRating } from "@/lib/workshop/types";

export const ACTION_GOAL_CATEGORIES: ReadonlySet<string> = new Set([
  "protection",
  "savings",
  "investment",
  "goal",
]);

export const ACTION_CATEGORY_META: Array<{
  actionCategory: ActionGoal["category"];
  ratingKey: RatingCategory;
  icon: string;
}> = [
  { actionCategory: "protection", ratingKey: "protection", icon: "Shield" },
  { actionCategory: "savings", ratingKey: "emergencyFund", icon: "PiggyBank" },
  { actionCategory: "goal", ratingKey: "goalsOnTrack", icon: "Target" },
  {
    actionCategory: "investment",
    ratingKey: "crisisResilience",
    icon: "TrendingUp",
  },
];

/** Pillar score below which we consider it "strong enough to leave alone". */
export const STRONG_PILLAR_SCORE = 92;
export const MIN_RECOMMEND_GAP = 100 - STRONG_PILLAR_SCORE; // 8

/** Natural-category bonus for near-ties (keeps lever framing coherent). */
const NATURAL_BONUS = 12;

export const LEVER_SEED_META: Array<{
  leverType: ActionGoal["leverType"];
  natural: ActionGoal["category"][];
}> = [
  { leverType: "instant", natural: ["savings"] },
  { leverType: "structural", natural: ["protection"] },
  { leverType: "behavioral", natural: ["goal", "investment"] },
];

export type ActionGoalSeed = {
  rank: number;
  category: ActionGoal["category"];
  leverType: ActionGoal["leverType"];
  icon: string;
  impactPoints: number;
  ratingKey: RatingCategory;
  currentScore: number;
  gap: number;
};

type CategoryCandidate = Omit<ActionGoalSeed, "rank" | "leverType">;

function buildCandidates(
  rating: SummaryRating,
  impactContext?: GoalImpactContext,
): CategoryCandidate[] {
  return ACTION_CATEGORY_META.map((meta) => {
    const currentScore = rating.breakdown[meta.ratingKey];
    const gap = Math.max(0, 100 - currentScore);
    const impactPoints = computeGoalImpactPoints(
      meta.ratingKey,
      gap,
      RATING_WEIGHTS[meta.ratingKey],
      impactContext,
    );
    return {
      category: meta.actionCategory,
      icon: meta.icon,
      impactPoints,
      ratingKey: meta.ratingKey,
      currentScore,
      gap,
    };
  });
}

/**
 * v5.2: gap-driven seed selection with strong-pillar guard + natural bias.
 * Ranks are fixed 1=instant, 2=structural, 3=behavioral; each rank takes the
 * biggest remaining gap (skipping pillars already ≥ STRONG_PILLAR_SCORE when
 * weaker pillars exist).
 */
export function buildActionGoalSeeds(
  rating: SummaryRating,
  impactContext?: GoalImpactContext,
): ActionGoalSeed[] {
  const used = new Set<ActionGoal["category"]>();
  const byCategory = new Map(
    buildCandidates(rating, impactContext).map((c) => [c.category, c]),
  );

  return LEVER_SEED_META.map((lever, index) => {
    const available = [...byCategory.values()].filter(
      (c) => !used.has(c.category),
    );

    // Prefer pillars that actually need work; fall back to the biggest gap
    // overall only when everything is already strong.
    const weak = available.filter((c) => c.gap >= MIN_RECOMMEND_GAP);
    const pool = weak.length > 0 ? weak : available;

    const scored = pool
      .map((c) => ({
        ...c,
        score: c.gap + (lever.natural.includes(c.category) ? NATURAL_BONUS : 0),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0]!;
    used.add(best.category);

    return {
      rank: index + 1,
      category: best.category,
      leverType: lever.leverType,
      icon: best.icon,
      impactPoints: best.impactPoints,
      ratingKey: best.ratingKey,
      currentScore: best.currentScore,
      gap: best.gap,
    };
  });
}
