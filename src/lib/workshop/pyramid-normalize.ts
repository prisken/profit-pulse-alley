/**
 * Normalize PyramidState JSON loaded from WorkshopSession (v2 or v3.1).
 * Kept outside `"use server"` modules.
 */

import { deriveGoalAge, deriveGoalYear } from "@/lib/workshop/goal-year";
import type {
  GoalItem,
  GoalType,
  InvestmentLayer,
  PyramidState,
} from "@/lib/workshop/types";
import { assertStrictBilingual } from "@/lib/workshop/bilingual";

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid pyramid JSON: "${field}" must be an object.`);
  }
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid pyramid JSON: "${field}" must be a finite number.`);
  }
  return value;
}

function parseGoalType(value: unknown): GoalType {
  return value === "retirementTarget" ? "retirementTarget" : "spend";
}

/**
 * Normalize one goal from stored JSON (targetAge preferred; targetYear-only ok).
 * Legacy sessions without goalType default to "spend".
 */
export function normalizeGoalItem(
  value: unknown,
  userAge: number,
  index = 0,
): GoalItem {
  const field = `goals[${index}]`;
  const record = asRecord(value, field);
  const id =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : `goal-${index}`;
  const icon =
    typeof record.icon === "string" && record.icon.trim()
      ? record.icon.trim()
      : "Target";
  const label = assertStrictBilingual(record.label, `${field}.label`);
  const targetAmountHKD = Math.max(
    0,
    Math.round(asFiniteNumber(record.targetAmountHKD, `${field}.targetAmountHKD`)),
  );

  const hasAge =
    typeof record.targetAge === "number" && Number.isFinite(record.targetAge);
  const hasYear =
    typeof record.targetYear === "number" && Number.isFinite(record.targetYear);

  let targetAge: number;
  let targetYear: number;
  if (hasAge) {
    targetAge = Math.round(record.targetAge as number);
    targetYear =
      hasYear
        ? Math.round(record.targetYear as number)
        : deriveGoalYear(targetAge, userAge);
  } else if (hasYear) {
    targetYear = Math.round(record.targetYear as number);
    targetAge = deriveGoalAge(targetYear, userAge);
  } else {
    targetAge = Math.round(userAge) + 5;
    targetYear = deriveGoalYear(targetAge, userAge);
  }

  return {
    id,
    icon,
    label,
    targetAmountHKD,
    targetAge,
    targetYear,
    goalType: parseGoalType(record.goalType),
    allowLiquidation: record.allowLiquidation === true,
  };
}

/** Canonical investment shape — monthlyInvestmentHKD defaults to 0 when omitted. */
export function normalizeInvestmentLayer(value: unknown): InvestmentLayer {
  const record = asRecord(value, "investment");
  const riskRaw = asRecord(record.riskAllocation, "investment.riskAllocation");
  const riskAllocation = {
    low: Math.round(asFiniteNumber(riskRaw.low, "investment.riskAllocation.low")),
    mid: Math.round(asFiniteNumber(riskRaw.mid, "investment.riskAllocation.mid")),
    high: Math.round(
      asFiniteNumber(riskRaw.high, "investment.riskAllocation.high"),
    ),
  };
  const monthlyFunHKD = Math.max(
    0,
    Math.round(asFiniteNumber(record.monthlyFunHKD, "investment.monthlyFunHKD")),
  );

  let lumpSumHKD = 0;
  if (typeof record.lumpSumHKD === "number" && Number.isFinite(record.lumpSumHKD)) {
    lumpSumHKD = Math.max(0, Math.round(record.lumpSumHKD));
  }

  let monthlyInvestmentHKD = 0;
  if (
    typeof record.monthlyInvestmentHKD === "number" &&
    Number.isFinite(record.monthlyInvestmentHKD)
  ) {
    monthlyInvestmentHKD = Math.max(0, Math.round(record.monthlyInvestmentHKD));
  }

  return { riskAllocation, lumpSumHKD, monthlyInvestmentHKD, monthlyFunHKD };
}

/**
 * Coerce stored pyramid JSON (v2 or v3) into a typed PyramidState.
 */
export function normalizePyramidState(
  value: unknown,
  userAge: number,
): PyramidState {
  const root = asRecord(value, "pyramid");
  const protection = asRecord(root.protection, "protection");
  const emergencyFund = asRecord(root.emergencyFund, "emergencyFund");
  const goalsRoot = asRecord(root.goals, "goals");
  const goalsRaw = Array.isArray(goalsRoot.goals) ? goalsRoot.goals : [];

  return {
    protection: {
      medicalCoveragePercent: Math.round(
        asFiniteNumber(
          protection.medicalCoveragePercent,
          "protection.medicalCoveragePercent",
        ),
      ),
      criticalIllnessAmountHKD: Math.round(
        asFiniteNumber(
          protection.criticalIllnessAmountHKD,
          "protection.criticalIllnessAmountHKD",
        ),
      ),
    },
    emergencyFund: {
      savedAmountHKD: Math.round(
        asFiniteNumber(
          emergencyFund.savedAmountHKD,
          "emergencyFund.savedAmountHKD",
        ),
      ),
    },
    goals: {
      goals: goalsRaw.map((item, index) =>
        normalizeGoalItem(item, userAge, index),
      ),
    },
    investment: normalizeInvestmentLayer(root.investment),
  };
}
