import { describe, expect, it } from "vitest";

import { solveSqueeze } from "@/lib/workshop/squeeze-solver";
import type { ExpensesState } from "@/lib/workshop/types";

const expenses: ExpensesState = {
  totalHKD: 25_000,
  categories: [
    { key: "housing", icon: "Home", amountHKD: 12_000 },
    { key: "food_living", icon: "UtensilsCrossed", amountHKD: 5_000 },
    { key: "transport", icon: "Bus", amountHKD: 2_000 },
    { key: "insurance", icon: "Shield", amountHKD: 2_000 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 4_000 },
  ],
};

function sumAmounts(
  slices: Array<{
    amountHKD: number;
  }>,
): number {
  return Math.round(slices.reduce((sum, slice) => sum + slice.amountHKD, 0) * 100) / 100;
}

describe("solveSqueeze", () => {
  it("returns null when no squeeze is needed", () => {
    expect(
      solveSqueeze({
        requiredExtraMonthlyHKD: 0,
        monthlyIncomeHKD: 50_000,
        expenses,
      }),
    ).toBeNull();
  });

  it("builds a full achievable squeeze by cutting discretionary", () => {
    const result = solveSqueeze({
      requiredExtraMonthlyHKD: 3_000,
      monthlyIncomeHKD: 50_000,
      expenses,
      monthsLate: 24,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    expect(result!.requiredExtraMonthlyHKD).toBe(3_000);
    expect(result!.achievableAtAge).toBeNull();

    const discNext = result!.recommendedAllocation.find(
      (s) => s.key === "discretionary",
    );

    // Fun is gone (v4); discretionary starts at 4k/mo and covers the full need.
    expect(result!.currentAllocation.find((s) => s.key === "fun")).toBeUndefined();
    expect(discNext?.amountHKD).toBe(1_000);
    expect(discNext?.changed).toBe(true);
  });

  it("reports an honest partial answer when cuts are capped", () => {
    const result = solveSqueeze({
      requiredExtraMonthlyHKD: 8_000,
      monthlyIncomeHKD: 40_000,
      expenses,
      monthsLate: 24,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    // Max cut = 4k discretionary/month, so only partial relief (8k need).
    expect(result!.achievableAtAge).toBe(41);
    expect(
      result!.recommendedAllocation.find((s) => s.key === "discretionary")
        ?.amountHKD,
    ).toBe(0);
  });

  it("allocation slices sum to total income in current and recommended sets", () => {
    const monthlyIncomeHKD = 50_000;
    const result = solveSqueeze({
      requiredExtraMonthlyHKD: 3_000,
      monthlyIncomeHKD,
      expenses,
      monthsLate: 12,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    expect(sumAmounts(result!.currentAllocation)).toBe(monthlyIncomeHKD);
    expect(sumAmounts(result!.recommendedAllocation)).toBe(monthlyIncomeHKD);
  });
});
