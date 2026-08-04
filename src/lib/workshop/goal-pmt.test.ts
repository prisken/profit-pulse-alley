import { describe, expect, it } from "vitest";

import {
  compareGoalMonthlyContributions,
  monthlyContributionAtReturn,
  monthlyContributionZeroReturn,
} from "@/lib/workshop/goal-pmt";

describe("goal PMT helpers", () => {
  it("computes 0% monthly as FV / years / 12", () => {
    expect(monthlyContributionZeroReturn(120_000, 5)).toBeCloseTo(2_000, 6);
  });

  it("computes 6% monthly via annuity formula with monthly compounding", () => {
    const fv = 100_000;
    const years = 10;
    const r = 0.06 / 12;
    const n = years * 12;
    const expected = fv / (((1 + r) ** n - 1) / r);
    expect(monthlyContributionAtReturn(fv, years, 0.06)).toBeCloseTo(
      expected,
      6,
    );
    // Earning return should require a smaller monthly deposit than 0%.
    expect(monthlyContributionAtReturn(fv, years, 0.06)).toBeLessThan(
      monthlyContributionZeroReturn(fv, years),
    );
  });

  it("compareGoalMonthlyContributions returns both rates", () => {
    const result = compareGoalMonthlyContributions(240_000, 4);
    expect(result.zeroReturn).toBeCloseTo(5_000, 6);
    expect(result.sixPercentReturn).toBeLessThan(result.zeroReturn);
  });
});
