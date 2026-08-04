import {
  ALLOCATION_SLICE_LABELS,
  cutAvailable,
} from "@/lib/workshop/spending-cut-order";
import type {
  AllocationSlice,
  Bilingual,
  ExpensesState,
  SqueezeRecommendation,
} from "@/lib/workshop/types";

export type SolveSqueezeInput = {
  requiredExtraMonthlyHKD: number;
  monthlyIncomeHKD: number;
  expenses: ExpensesState;
  monthlyFunHKD: number;
  monthlyInvestmentHKD: number;
  /**
   * Optional lateness signal from the concurrently computed timeline.
   * When present with `targetAge`, partial cuts map to a later achievable age.
   */
  monthsLate?: number;
  targetAge?: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function expenseSlices(expenses: ExpensesState): AllocationSlice[] {
  return expenses.categories.map((row) => ({
    key: row.key,
    label: ALLOCATION_SLICE_LABELS[row.key],
    amountHKD: Math.max(0, roundMoney(row.amountHKD)),
    changed: false,
  }));
}

function sumSlices(slices: AllocationSlice[]): number {
  return roundMoney(slices.reduce((sum, slice) => sum + slice.amountHKD, 0));
}

function clampSurplus(
  monthlyIncomeHKD: number,
  slicesBeforeSurplus: AllocationSlice[],
): number {
  return Math.max(0, roundMoney(monthlyIncomeHKD - sumSlices(slicesBeforeSurplus)));
}

export function buildAllocationSlices(input: {
  monthlyIncomeHKD: number;
  expenses: ExpensesState;
  monthlyFunHKD: number;
  monthlyInvestmentHKD: number;
  recommendedFunHKD?: number;
  recommendedDiscretionaryHKD?: number;
}): AllocationSlice[] {
  const recommendedFunHKD =
    input.recommendedFunHKD ?? Math.max(0, roundMoney(input.monthlyFunHKD));
  const recommendedDiscretionaryHKD =
    input.recommendedDiscretionaryHKD ??
    Math.max(
      0,
      roundMoney(
        input.expenses.categories.find((c) => c.key === "discretionary")
          ?.amountHKD ?? 0,
      ),
    );

  const baseExpenses = expenseSlices(input.expenses).map((slice) =>
    slice.key === "discretionary"
      ? {
          ...slice,
          amountHKD: recommendedDiscretionaryHKD,
          changed:
            recommendedDiscretionaryHKD !==
            Math.max(
              0,
              roundMoney(
                input.expenses.categories.find((c) => c.key === "discretionary")
                  ?.amountHKD ?? 0,
              ),
            ),
        }
      : slice,
  );

  const preSurplus = [
    ...baseExpenses,
    {
      key: "fun",
      label: ALLOCATION_SLICE_LABELS.fun,
      amountHKD: recommendedFunHKD,
      changed: recommendedFunHKD !== Math.max(0, roundMoney(input.monthlyFunHKD)),
    },
    {
      key: "investment",
      label: ALLOCATION_SLICE_LABELS.investment,
      amountHKD: Math.max(0, roundMoney(input.monthlyInvestmentHKD)),
      changed: false,
    },
  ] satisfies AllocationSlice[];

  return [
    ...preSurplus,
    {
      key: "surplus",
      label: ALLOCATION_SLICE_LABELS.surplus,
      amountHKD: clampSurplus(input.monthlyIncomeHKD, preSurplus),
      changed: false,
    },
  ];
}

function achievableAtAge(input: {
  targetAge?: number;
  monthsLate?: number;
  requiredExtraMonthlyHKD: number;
  achievableExtraMonthlyHKD: number;
}): number | null {
  if (
    input.targetAge == null ||
    input.monthsLate == null ||
    input.monthsLate <= 0 ||
    input.requiredExtraMonthlyHKD <= 0
  ) {
    return null;
  }

  const coveredRatio = Math.min(
    1,
    Math.max(0, input.achievableExtraMonthlyHKD / input.requiredExtraMonthlyHKD),
  );
  if (coveredRatio >= 1) {
    return null;
  }

  const remainingMonthsLate = input.monthsLate * (1 - coveredRatio);
  return input.targetAge + Math.max(1, Math.ceil(remainingMonthsLate / 12));
}

/**
 * Deterministic squeeze calculator. Consumes precomputed monthly need / lateness
 * from the current timeline and proposes only fun → discretionary cuts.
 */
export function solveSqueeze(
  input: SolveSqueezeInput,
): SqueezeRecommendation | null {
  const requiredExtraMonthlyHKD = Math.max(
    0,
    roundMoney(input.requiredExtraMonthlyHKD),
  );

  if (requiredExtraMonthlyHKD <= 0) {
    return null;
  }

  const annualNeedHKD = roundMoney(requiredExtraMonthlyHKD * 12);
  const cuts = cutAvailable(input.expenses, input.monthlyFunHKD, annualNeedHKD);
  const achievableExtraMonthlyHKD = roundMoney(cuts.trimmedHKD / 12);

  return {
    requiredExtraMonthlyHKD,
    currentAllocation: buildAllocationSlices({
      monthlyIncomeHKD: input.monthlyIncomeHKD,
      expenses: input.expenses,
      monthlyFunHKD: input.monthlyFunHKD,
      monthlyInvestmentHKD: input.monthlyInvestmentHKD,
    }),
    recommendedAllocation: buildAllocationSlices({
      monthlyIncomeHKD: input.monthlyIncomeHKD,
      expenses: input.expenses,
      monthlyFunHKD: input.monthlyFunHKD,
      monthlyInvestmentHKD: input.monthlyInvestmentHKD,
      recommendedFunHKD: cuts.monthlyFunRemainingHKD,
      recommendedDiscretionaryHKD: cuts.monthlyDiscretionaryRemainingHKD,
    }),
    achievableAtAge: achievableAtAge({
      targetAge: input.targetAge,
      monthsLate: input.monthsLate,
      requiredExtraMonthlyHKD,
      achievableExtraMonthlyHKD,
    }),
    reasoning: { en: "", zhHant: "" } satisfies Bilingual,
  };
}
