/**
 * Pure PMT helpers for Workshop Pyramid Lab goal funding.
 * No AI — deterministic annuity math only.
 */

/**
 * Monthly contribution needed to reach FV with 0% return.
 * Equivalent to FV / years / 12.
 */
export function monthlyContributionZeroReturn(
  futureValueHKD: number,
  targetYears: number,
): number {
  const fv = Math.max(0, futureValueHKD);
  const years = Math.max(0, targetYears);
  if (fv === 0) {
    return 0;
  }
  if (years <= 0) {
    throw new Error("targetYears must be positive for a 0% PMT.");
  }
  return fv / years / 12;
}

/**
 * Monthly contribution needed to reach FV at a constant annual return,
 * with monthly compounding and monthly deposits at period-end.
 *
 * PMT = FV / (((1+r)^n - 1) / r)
 * where r = annualRate / 12, n = targetYears * 12.
 */
export function monthlyContributionAtReturn(
  futureValueHKD: number,
  targetYears: number,
  annualRate = 0.06,
): number {
  const fv = Math.max(0, futureValueHKD);
  const years = Math.max(0, targetYears);
  if (fv === 0) {
    return 0;
  }
  if (years <= 0) {
    throw new Error("targetYears must be positive for a return-based PMT.");
  }
  if (annualRate < 0) {
    throw new Error("annualRate cannot be negative.");
  }
  if (annualRate === 0) {
    return monthlyContributionZeroReturn(fv, years);
  }

  const r = annualRate / 12;
  const n = years * 12;
  const growthFactor = ((1 + r) ** n - 1) / r;
  return fv / growthFactor;
}

export function compareGoalMonthlyContributions(
  futureValueHKD: number,
  targetYears: number,
): { zeroReturn: number; sixPercentReturn: number } {
  return {
    zeroReturn: monthlyContributionZeroReturn(futureValueHKD, targetYears),
    sixPercentReturn: monthlyContributionAtReturn(
      futureValueHKD,
      targetYears,
      0.06,
    ),
  };
}
