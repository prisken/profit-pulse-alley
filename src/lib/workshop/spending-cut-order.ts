import type { Bilingual, ExpensesState } from "@/lib/workshop/types";

export const SPENDING_CUT_ORDER = [
  "discretionary",
  "liquid",
  "invested",
] as const;

export type SpendingCutStage = (typeof SPENDING_CUT_ORDER)[number];

export type SpendingCutAvailability = {
  requestedHKD: number;
  trimmedHKD: number;
  remainingHKD: number;
  monthlyDiscretionaryRemainingHKD: number;
  /** Legacy shape — fun is always 0 in v4+ (fun removed from the game). */
  squeezeCutsHKD: { fun: number; discretionary: number };
};

export const ALLOCATION_SLICE_LABELS: Record<
  | ExpensesState["categories"][number]["key"]
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
 * Trim available annual discretionary spending up to the requested amount,
 * without driving the bucket below zero. Fun is gone from the game (v4).
 */
export function cutAvailable(
  expenses: ExpensesState,
  requestedHKD: number,
): SpendingCutAvailability {
  let remaining = Math.max(0, roundMoney(requestedHKD));

  const discretionaryAnnual = discretionaryMonthly(expenses) * 12;
  const discretionaryCut = roundMoney(Math.min(discretionaryAnnual, remaining));
  remaining = roundMoney(remaining - discretionaryCut);
  const monthlyDiscretionaryRemainingHKD = Math.max(
    0,
    roundMoney(discretionaryMonthly(expenses) - discretionaryCut / 12),
  );

  return {
    requestedHKD: roundMoney(requestedHKD),
    trimmedHKD: roundMoney(discretionaryCut),
    remainingHKD: remaining,
    monthlyDiscretionaryRemainingHKD,
    squeezeCutsHKD: {
      fun: 0,
      discretionary: discretionaryCut,
    },
  };
}
