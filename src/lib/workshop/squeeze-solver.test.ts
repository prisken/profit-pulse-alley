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
        monthlyFunHKD: 5_000,
        monthlyInvestmentHKD: 8_000,
      }),
    ).toBeNull();
  });

  it("builds a full achievable squeeze by cutting fun then discretionary", () => {
    const result = solveSqueeze({
      requiredExtraMonthlyHKD: 6_000,
      monthlyIncomeHKD: 50_000,
      expenses,
      monthlyFunHKD: 5_000,
      monthlyInvestmentHKD: 8_000,
      monthsLate: 24,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    expect(result!.requiredExtraMonthlyHKD).toBe(6_000);
    expect(result!.achievableAtAge).toBeNull();

    const funCurrent = result!.currentAllocation.find((s) => s.key === "fun");
    const funNext = result!.recommendedAllocation.find((s) => s.key === "fun");
    const discNext = result!.recommendedAllocation.find(
      (s) => s.key === "discretionary",
    );

    expect(funCurrent?.amountHKD).toBe(5_000);
    expect(funNext?.amountHKD).toBe(0);
    expect(funNext?.changed).toBe(true);
    expect(discNext?.amountHKD).toBe(3_000);
    expect(discNext?.changed).toBe(true);
  });

  it("reports an honest partial answer when cuts are capped", () => {
    const result = solveSqueeze({
      requiredExtraMonthlyHKD: 8_000,
      monthlyIncomeHKD: 40_000,
      expenses,
      monthlyFunHKD: 1_000,
      monthlyInvestmentHKD: 2_000,
      monthsLate: 24,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    // Max cut = 1k fun + 4k discretionary = 5k/month, so only partial relief.
    expect(result!.achievableAtAge).toBe(41);
    expect(
      result!.recommendedAllocation.find((s) => s.key === "fun")?.amountHKD,
    ).toBe(0);
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
      monthlyFunHKD: 5_000,
      monthlyInvestmentHKD: 8_000,
      monthsLate: 12,
      targetAge: 40,
    });

    expect(result).not.toBeNull();
    expect(sumAmounts(result!.currentAllocation)).toBe(monthlyIncomeHKD);
    expect(sumAmounts(result!.recommendedAllocation)).toBe(monthlyIncomeHKD);
  });
});
