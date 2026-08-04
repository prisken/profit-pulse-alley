import type { Bilingual, ExpensesState } from "@/lib/workshop/types";

export const SPENDING_CUT_ORDER = [
  "fun",
  "discretionary",
  "liquid",
  "invested",
] as const;

export type SpendingCutStage = (typeof SPENDING_CUT_ORDER)[number];

export type SpendingCutAvailability = {
  requestedHKD: number;
  trimmedHKD: number;
  remainingHKD: number;
  monthlyFunRemainingHKD: number;
  monthlyDiscretionaryRemainingHKD: number;
  squeezeCutsHKD: { fun: number; discretionary: number };
};

export const ALLOCATION_SLICE_LABELS: Record<
  | ExpensesState["categories"][number]["key"]
  | "fun"
  | "investment"
  | "surplus"
  | "liquid"
  | "invested",
  Bilingual
> = {
  housing: { en: "Housing", zhHant: "住屋" },
  food_living: { en: "Food & living", zhHant: "飲食生活" },
  transport: { en: "Transport", zhHant: "交通" },
  insurance: { en: "Insurance", zhHant: "保險" },
  discretionary: { en: "Discretionary", zhHant: "可選開支" },
  fun: { en: "Fun", zhHant: "娛樂" },
  investment: { en: "Investing", zhHant: "投資" },
  surplus: { en: "Remaining surplus", zhHant: "剩餘盈餘" },
  liquid: { en: "Liquid", zhHant: "流動資金" },
  invested: { en: "Invested", zhHant: "投資資產" },
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function discretionaryMonthly(expenses: ExpensesState): number {
  const row = expenses.categories.find((c) => c.key === "discretionary");
  return Math.max(0, row?.amountHKD ?? 0);
}

/**
 * Trim available annual spending from fun first, then discretionary, up to the
 * requested amount, without driving either bucket below zero.
 */
export function cutAvailable(
  expenses: ExpensesState,
  monthlyFunHKD: number,
  requestedHKD: number,
): SpendingCutAvailability {
  let remaining = Math.max(0, roundMoney(requestedHKD));

  const funAnnual = Math.max(0, monthlyFunHKD) * 12;
  const funCut = roundMoney(Math.min(funAnnual, remaining));
  remaining = roundMoney(remaining - funCut);
  const monthlyFunRemainingHKD = Math.max(
    0,
    roundMoney(Math.max(0, monthlyFunHKD) - funCut / 12),
  );

  const discretionaryAnnual = discretionaryMonthly(expenses) * 12;
  const discretionaryCut = roundMoney(Math.min(discretionaryAnnual, remaining));
  remaining = roundMoney(remaining - discretionaryCut);
  const monthlyDiscretionaryRemainingHKD = Math.max(
    0,
    roundMoney(discretionaryMonthly(expenses) - discretionaryCut / 12),
  );

  return {
    requestedHKD: roundMoney(requestedHKD),
    trimmedHKD: roundMoney(funCut + discretionaryCut),
    remainingHKD: remaining,
    monthlyFunRemainingHKD,
    monthlyDiscretionaryRemainingHKD,
    squeezeCutsHKD: {
      fun: funCut,
      discretionary: discretionaryCut,
    },
  };
}
