import { ALLOCATION_SLICE_LABELS } from "@/lib/workshop/spending-cut-order";
import { buildAllocationSlices } from "@/lib/workshop/squeeze-solver";
import type {
  AllocationSlice,
  ExpensesState,
  PyramidState,
} from "@/lib/workshop/types";

export type JourneyOverviewDerived = {
  cashFlowSlices: AllocationSlice[];
  assetsSlices: AllocationSlice[];
  /** Monthly unallocated surplus after expenses, fun, and investing. */
  monthlySurplusHKD: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pure overview slices from confirmed expenses + pyramid.
 * Cash-flow donut: 5 expense categories + surplus (fun & monthly investing
 * removed in v4).
 * Assets donut: liquid (EF) + invested (lump sum) as of today.
 */
export function deriveJourneyOverview(input: {
  monthlyIncomeHKD: number;
  expenses: ExpensesState;
  pyramid: PyramidState;
}): JourneyOverviewDerived {
  const cashFlowSlices = buildAllocationSlices({
    monthlyIncomeHKD: input.monthlyIncomeHKD,
    expenses: input.expenses,
  });

  const monthlySurplusHKD = roundMoney(
    cashFlowSlices.find((slice) => slice.key === "surplus")?.amountHKD ?? 0,
  );

  const assetsSlices: AllocationSlice[] = [
    {
      key: "liquid",
      label: ALLOCATION_SLICE_LABELS.liquid,
      amountHKD: Math.max(
        0,
        roundMoney(input.pyramid.emergencyFund.savedAmountHKD),
      ),
      changed: false,
    },
    {
      key: "invested",
      label: ALLOCATION_SLICE_LABELS.invested,
      amountHKD: Math.max(
        0,
        roundMoney(input.pyramid.investment.lumpSumHKD),
      ),
      changed: false,
    },
  ];

  return { cashFlowSlices, assetsSlices, monthlySurplusHKD };
}
