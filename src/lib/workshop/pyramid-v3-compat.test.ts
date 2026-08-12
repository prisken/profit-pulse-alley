import { describe, expect, it } from "vitest";

import { deriveGoalAge, deriveGoalYear } from "@/lib/workshop/goal-year";
import {
  normalizeGoalItem,
  normalizeInvestmentLayer,
} from "@/lib/workshop/pyramid-normalize";
import type { GoalItem } from "@/lib/workshop/types";

/**
 * Mirrors parse rules in pyramid-actions (kept here so compat stays testable
 * without exporting the "use server" parser).
 */
function normalizeGoalFromLegacy(
  raw: { targetYear?: number; targetAge?: number } & Omit<
    GoalItem,
    "targetAge" | "targetYear"
  > & { goalType?: string },
  userAge: number,
): GoalItem {
  if (typeof raw.targetAge === "number") {
    return {
      ...raw,
      targetAge: Math.round(raw.targetAge),
      targetYear: deriveGoalYear(raw.targetAge, userAge),
    };
  }
  if (typeof raw.targetYear === "number") {
    return {
      ...raw,
      targetYear: Math.round(raw.targetYear),
      targetAge: deriveGoalAge(raw.targetYear, userAge),
    };
  }
  throw new Error("missing timing");
}



describe("v3 pyramid JSON compat", () => {
  it("derives targetAge from v2 targetYear-only goals", () => {
    const goal = normalizeGoalFromLegacy(
      {
        id: "home",
        icon: "Home",
        label: { en: "Home", zhHant: "置業" },
        targetAmountHKD: 1_000_000,
        targetYear: 2036,
      },
      32,
    );
    expect(goal.targetAge).toBe(deriveGoalAge(2036, 32));
    expect(goal.targetYear).toBe(2036);
  });

  it("drops legacy monthly investing / fun fields on parse (v4)", () => {
    const investment = normalizeInvestmentLayer({
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 100_000,
      monthlyInvestmentHKD: 8_000,
      monthlyFunHKD: 2_000,
    });
    expect(investment.lumpSumHKD).toBe(100_000);
    expect("monthlyInvestmentHKD" in investment).toBe(false);
    expect("monthlyFunHKD" in investment).toBe(false);
  });

  it("normalizes legacy goals without goalType as plain spend goals", () => {
    const goal = normalizeGoalItem(
      {
        id: "home",
        icon: "House",
        label: { en: "Home", zhHant: "置業" },
        targetAmountHKD: 1_000_000,
        targetAge: 40,
      },
      32,
    );
    expect(goal.targetAge).toBe(40);
  });
});
