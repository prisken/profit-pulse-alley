import { describe, expect, it } from "vitest";

import {
  redistributeRiskAllocation,
  riskAllocationSum,
  type RiskAllocation,
  type RiskAllocationKey,
} from "@/lib/workshop/risk-allocation";

const START: RiskAllocation = { low: 20, mid: 30, high: 50 };

describe("redistributeRiskAllocation", () => {
  it("always sums to exactly 100 when any slider moves", () => {
    const keys: RiskAllocationKey[] = ["low", "mid", "high"];
    for (const key of keys) {
      for (const value of [0, 1, 33, 50, 67, 99, 100]) {
        const next = redistributeRiskAllocation(START, key, value);
        expect(riskAllocationSum(next)).toBe(100);
        expect(next[key]).toBe(value);
      }
    }
  });

  it("never goes negative", () => {
    const keys: RiskAllocationKey[] = ["low", "mid", "high"];
    for (const key of keys) {
      for (const value of [-10, 0, 100, 150]) {
        const next = redistributeRiskAllocation(START, key, value);
        expect(next.low).toBeGreaterThanOrEqual(0);
        expect(next.mid).toBeGreaterThanOrEqual(0);
        expect(next.high).toBeGreaterThanOrEqual(0);
        expect(riskAllocationSum(next)).toBe(100);
      }
    }
  });

  it("scales the other two proportionally", () => {
    // mid:high = 30:50 = 3:5; high → 40 leaves 60 for mid+high → 22.5≈23 and 37
    const next = redistributeRiskAllocation(START, "low", 40);
    expect(next.low).toBe(40);
    expect(next.mid + next.high).toBe(60);
    expect(next.mid / next.high).toBeCloseTo(30 / 50, 1);
  });

  it("splits remainder evenly when the other buckets are both zero", () => {
    const next = redistributeRiskAllocation(
      { low: 100, mid: 0, high: 0 },
      "low",
      40,
    );
    expect(next).toEqual({ low: 40, mid: 30, high: 30 });
  });
});
