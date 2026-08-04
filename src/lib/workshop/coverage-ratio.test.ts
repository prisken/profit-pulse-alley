import { describe, expect, it } from "vitest";

import {
  computePassiveCoverageRatio,
  formatCoveragePercent,
} from "@/lib/workshop/coverage-ratio";

describe("computePassiveCoverageRatio", () => {
  it("returns emerald at ≥100%", () => {
    expect(computePassiveCoverageRatio(120_000, 100_000)).toEqual({
      percent: 120,
      band: "emerald",
    });
    expect(computePassiveCoverageRatio(100_000, 100_000).band).toBe("emerald");
  });

  it("returns amber between 60–99%", () => {
    expect(computePassiveCoverageRatio(80_000, 100_000)).toEqual({
      percent: 80,
      band: "amber",
    });
    expect(computePassiveCoverageRatio(60_000, 100_000).band).toBe("amber");
  });

  it("returns rose below 60%", () => {
    expect(computePassiveCoverageRatio(59_000, 100_000).band).toBe("rose");
    expect(computePassiveCoverageRatio(0, 100_000)).toEqual({
      percent: 0,
      band: "rose",
    });
  });

  it("handles zero / non-positive expenses", () => {
    expect(computePassiveCoverageRatio(50_000, 0)).toEqual({
      percent: null,
      band: "emerald",
    });
  });
});

describe("formatCoveragePercent", () => {
  it("rounds for display", () => {
    expect(formatCoveragePercent(87.4)).toBe("87%");
    expect(formatCoveragePercent(null)).toBe("—");
  });
});
