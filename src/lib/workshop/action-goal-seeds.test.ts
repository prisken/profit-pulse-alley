import { describe, expect, it } from "vitest";

import {
  buildActionGoalSeeds,
  MIN_RECOMMEND_GAP,
  STRONG_PILLAR_SCORE,
} from "@/lib/workshop/action-goal-seeds";
import type { SummaryRating } from "@/lib/workshop/types";

function rating(breakdown: {
  protection: number;
  emergencyFund: number;
  goalsOnTrack: number;
  crisisResilience: number;
}): SummaryRating {
  return {
    score: Math.round(
      breakdown.protection * 0.25 +
        breakdown.emergencyFund * 0.25 +
        breakdown.goalsOnTrack * 0.3 +
        breakdown.crisisResilience * 0.2,
    ),
    labelKey: "goodRoomToGrow",
    breakdown,
  };
}

describe("buildActionGoalSeeds (v5.2 gap-driven)", () => {
  it("produces exactly one seed per lever type with ranks 1–3", () => {
    const seeds = buildActionGoalSeeds(
      rating({
        protection: 60,
        emergencyFund: 40,
        goalsOnTrack: 70,
        crisisResilience: 50,
      }),
    );

    expect(seeds).toHaveLength(3);
    expect(seeds.map((s) => s.rank)).toEqual([1, 2, 3]);
    expect(seeds.map((s) => s.leverType)).toEqual([
      "instant",
      "structural",
      "behavioral",
    ]);
    // All three categories must differ.
    expect(new Set(seeds.map((s) => s.category)).size).toBe(3);
  });

  it("never recommends a strong pillar while weaker pillars exist (the medical-insurance bug)", () => {
    // Prisken's session: protection 93 (strong), emergencyFund 58, crisisResilience 29.
    const seeds = buildActionGoalSeeds(
      rating({
        protection: 93,
        emergencyFund: 58,
        goalsOnTrack: 67,
        crisisResilience: 29,
      }),
    );

    expect(seeds.some((s) => s.category === "protection")).toBe(false);
    // The weakest pillar (crisis resilience → investment) must be included.
    expect(seeds.some((s) => s.category === "investment")).toBe(true);
    expect(seeds.some((s) => s.category === "savings")).toBe(true);
  });

  it("still includes the strongest pillar when ALL pillars are weak", () => {
    const seeds = buildActionGoalSeeds(
      rating({
        protection: 30,
        emergencyFund: 40,
        goalsOnTrack: 50,
        crisisResilience: 45,
      }),
    );

    // Protection has the biggest raw gap (70); instant's natural EF bias
    // wins the near-tie (60+12 vs 70), so protection lands on structural.
    expect(seeds.some((s) => s.category === "protection")).toBe(true);
    const protection = seeds.find((s) => s.category === "protection")!;
    expect(protection.gap).toBe(70);
    expect(seeds.map((s) => s.leverType)).toEqual([
      "instant",
      "structural",
      "behavioral",
    ]);
  });

  it("guards: gap below MIN_RECOMMEND_GAP is only used when everything is strong", () => {
    const seeds = buildActionGoalSeeds(
      rating({
        protection: 95,
        emergencyFund: 94,
        goalsOnTrack: 93,
        crisisResilience: 92,
      }),
    );

    // Everything ≥ STRONG_PILLAR_SCORE → falls back to biggest gap anyway.
    expect(seeds).toHaveLength(3);
    expect(Math.max(...seeds.map((s) => s.gap))).toBeLessThanOrEqual(
      MIN_RECOMMEND_GAP + 1,
    );
    expect(STRONG_PILLAR_SCORE).toBe(92);
  });
});
