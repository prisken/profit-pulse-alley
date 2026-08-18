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
      "discretionary",
      "liquid",
      "invested",
    ]);
  });
});

describe("cutAvailable", () => {
  it("cuts discretionary up to the requested annual amount", () => {
    const result = cutAvailable(expenses, 90_000);
    expect(result.squeezeCutsHKD.fun).toBe(0);
    expect(result.squeezeCutsHKD.discretionary).toBe(48_000);
    expect(result.monthlyDiscretionaryRemainingHKD).toBe(0);
    expect(result.remainingHKD).toBe(42_000);
  });

  it("caps at available discretionary without going negative", () => {
    const result = cutAvailable(expenses, 100_000);
    expect(result.trimmedHKD).toBe(48_000);
    expect(result.squeezeCutsHKD.fun).toBe(0);
    expect(result.squeezeCutsHKD.discretionary).toBe(48_000);
    expect(result.monthlyDiscretionaryRemainingHKD).toBe(0);
    expect(result.remainingHKD).toBe(52_000);
  });
});
