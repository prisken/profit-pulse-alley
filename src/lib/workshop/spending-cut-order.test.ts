import { describe, expect, it } from "vitest";

import {
  SPENDING_CUT_ORDER,
  cutAvailable,
} from "@/lib/workshop/spending-cut-order";
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

describe("SPENDING_CUT_ORDER", () => {
  it("keeps the shared crisis/squeeze order stable", () => {
    expect(SPENDING_CUT_ORDER).toEqual([
      "fun",
      "discretionary",
      "liquid",
      "invested",
    ]);
  });
});

describe("cutAvailable", () => {
  it("cuts fun first, then discretionary", () => {
    const result = cutAvailable(expenses, 5_000, 90_000);
    expect(result.squeezeCutsHKD.fun).toBe(60_000);
    expect(result.squeezeCutsHKD.discretionary).toBe(30_000);
    expect(result.monthlyFunRemainingHKD).toBe(0);
    expect(result.monthlyDiscretionaryRemainingHKD).toBe(1_500);
    expect(result.remainingHKD).toBe(0);
  });

  it("caps at available fun + discretionary without going negative", () => {
    const result = cutAvailable(expenses, 1_000, 100_000);
    expect(result.trimmedHKD).toBe(60_000);
    expect(result.squeezeCutsHKD.fun).toBe(12_000);
    expect(result.squeezeCutsHKD.discretionary).toBe(48_000);
    expect(result.monthlyFunRemainingHKD).toBe(0);
    expect(result.monthlyDiscretionaryRemainingHKD).toBe(0);
    expect(result.remainingHKD).toBe(40_000);
  });
});
