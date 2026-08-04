import { describe, expect, it } from "vitest";

import {
  blendedAnnualReturn,
  LIQUID_REAL_RETURN,
  RETURN_RATES,
} from "@/lib/workshop/investment-returns";

describe("investment-returns", () => {
  it("exposes real L/M/H rates for the deterministic engine", () => {
    expect(RETURN_RATES).toEqual({ low: -0.01, mid: 0.03, high: 0.07 });
    expect(LIQUID_REAL_RETURN).toBe(-0.03);
  });

  it("blends by allocation percentages that sum to 100", () => {
    expect(blendedAnnualReturn({ low: 100, mid: 0, high: 0 })).toBeCloseTo(
      -0.01,
    );
    expect(blendedAnnualReturn({ low: 0, mid: 100, high: 0 })).toBeCloseTo(
      0.03,
    );
    expect(blendedAnnualReturn({ low: 0, mid: 0, high: 100 })).toBeCloseTo(0.07);
    expect(blendedAnnualReturn({ low: 40, mid: 40, high: 20 })).toBeCloseTo(
      0.022,
    );
  });
});
