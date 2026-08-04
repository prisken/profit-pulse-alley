/**
 * Shared ProjectionLab light chart tokens for Workshop Pyramid Lab.
 * Hex values match `WorkshopStressTestStep` (emerald / indigo / rose / amber / slate).
 * Allocation donuts and stress charts should import from here — do not fork a second palette.
 */

export const WORKSHOP_CHART = {
  axis: "#64748b",
  grid: "#e2e8f0",
  ink: "#0f172a",
  muted: "#94a3b8",
  bandWorking: "#f1f5f9",
  bandRetirement: "#eef2ff",
  income: "#059669",
  expenses: "#6366f1",
  surplusFill: "#10b981",
  shortfallFill: "#f43f5e",
  liquid: "#059669",
  liquidSoft: "#34d399",
  invested: "#4f46e5",
  investedSoft: "#818cf8",
  rose: "#e11d48",
  amber: "#b45309",
  amberSoft: "#f59e0b",
  amberMid: "#d97706",
  white: "#ffffff",
} as const;

/**
 * Stable slice colors for monthly allocation donuts (housing → surplus).
 * Drawn from the same ProjectionLab hex set as stress-test charts.
 */
export const ALLOCATION_SLICE_COLORS: Record<string, string> = {
  housing: WORKSHOP_CHART.liquid,
  food_living: WORKSHOP_CHART.surplusFill,
  transport: WORKSHOP_CHART.liquidSoft,
  insurance: WORKSHOP_CHART.invested,
  discretionary: WORKSHOP_CHART.investedSoft,
  fun: WORKSHOP_CHART.amberSoft,
  investment: WORKSHOP_CHART.expenses,
  surplus: WORKSHOP_CHART.muted,
  liquid: WORKSHOP_CHART.liquid,
  invested: WORKSHOP_CHART.invested,
};

export function allocationSliceColor(key: string, index: number): string {
  const mapped = ALLOCATION_SLICE_COLORS[key];
  if (mapped) {
    return mapped;
  }
  const fallback = [
    WORKSHOP_CHART.liquid,
    WORKSHOP_CHART.surplusFill,
    WORKSHOP_CHART.liquidSoft,
    WORKSHOP_CHART.invested,
    WORKSHOP_CHART.investedSoft,
    WORKSHOP_CHART.amberSoft,
    WORKSHOP_CHART.expenses,
    WORKSHOP_CHART.muted,
  ];
  return fallback[index % fallback.length]!;
}
