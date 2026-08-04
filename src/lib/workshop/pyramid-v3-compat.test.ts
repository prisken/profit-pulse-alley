import { describe, expect, it } from "vitest";

import { deriveGoalAge, deriveGoalYear } from "@/lib/workshop/goal-year";
import {
  normalizeGoalItem,
  normalizeInvestmentLayer,
} from "@/lib/workshop/pyramid-normalize";
import type { GoalItem, InvestmentLayer } from "@/lib/workshop/types";

/**
 * Mirrors parse rules in pyramid-actions (kept here so compat stays testable
 * without exporting the "use server" parser).
 */
function normalizeGoalFromLegacy(
  raw: { targetYear?: number; targetAge?: number } & Omit<
    GoalItem,
    "targetAge" | "targetYear" | "goalType"
  > & { goalType?: GoalItem["goalType"] },
  userAge: number,
): GoalItem {
  if (typeof raw.targetAge === "number") {
    return {
      ...raw,
      targetAge: Math.round(raw.targetAge),
      targetYear: deriveGoalYear(raw.targetAge, userAge),
      goalType: raw.goalType ?? "spend",
    };
  }
  if (typeof raw.targetYear === "number") {
    return {
      ...raw,
      targetYear: Math.round(raw.targetYear),
      targetAge: deriveGoalAge(raw.targetYear, userAge),
      goalType: raw.goalType ?? "spend",
    };
  }
  throw new Error("missing timing");
}

function normalizeInvestmentFromLegacy(raw: {
  riskAllocation: InvestmentLayer["riskAllocation"];
  monthlyFunHKD: number;
  lumpSumHKD?: number;
  monthlyInvestmentHKD?: number;
}): InvestmentLayer {
  return {
    riskAllocation: raw.riskAllocation,
    lumpSumHKD: raw.lumpSumHKD ?? 0,
    monthlyInvestmentHKD: raw.monthlyInvestmentHKD ?? 0,
    monthlyFunHKD: raw.monthlyFunHKD,
  };
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
    expect(goal.goalType).toBe("spend");
  });

  it("defaults omitted monthlyInvestmentHKD to 0 on parse", () => {
    const investment = normalizeInvestmentFromLegacy({
      riskAllocation: { low: 40, mid: 40, high: 20 },
      monthlyFunHKD: 2_000,
      monthlyInvestmentHKD: 8_000,
    });
    expect(investment.lumpSumHKD).toBe(0);
    expect(investment.monthlyInvestmentHKD).toBe(8_000);
    expect(investment.monthlyFunHKD).toBe(2_000);

    const omitted = normalizeInvestmentLayer({
      riskAllocation: { low: 40, mid: 40, high: 20 },
      lumpSumHKD: 100_000,
      monthlyFunHKD: 2_000,
    });
    expect(omitted.monthlyInvestmentHKD).toBe(0);
  });

  it("defaults legacy goals without goalType to spend", () => {
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
    expect(goal.goalType).toBe("spend");
  });
});
