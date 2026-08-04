/**
 * Passive-income coverage of expenses for a scrubbed timeline year.
 * Pure math — no AI.
 */

export type CoverageRatioBand = "emerald" | "amber" | "rose";

export type CoverageRatioResult = {
  /** 0–∞ percent; null when expenses ≤ 0. */
  percent: number | null;
  band: CoverageRatioBand;
};

/**
 * coverage = passiveIncome ÷ expenses, as a percentage.
 * ≥100% emerald, 60–99% amber, <60% rose. No expenses → null / emerald.
 */
export function computePassiveCoverageRatio(
  passiveIncomeHKD: number,
  expensesHKD: number,
): CoverageRatioResult {
  const passive = Math.max(0, passiveIncomeHKD);
  const expenses = expensesHKD;

  if (!Number.isFinite(expenses) || expenses <= 0) {
    return { percent: null, band: "emerald" };
  }

  const percent = (passive / expenses) * 100;
  if (percent >= 100) {
    return { percent, band: "emerald" };
  }
  if (percent >= 60) {
    return { percent, band: "amber" };
  }
  return { percent, band: "rose" };
}

/** Round coverage % for display (whole numbers). */
export function formatCoveragePercent(percent: number | null): string {
  if (percent == null || !Number.isFinite(percent)) {
    return "—";
  }
  return `${Math.round(percent)}%`;
}
