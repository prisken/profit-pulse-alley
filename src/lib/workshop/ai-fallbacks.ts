/**
 * Deterministic AI fallbacks for Workshop Pyramid Lab.
 * Kept outside `"use server"` modules — Next.js requires exported server actions to be async.
 */

import { buildPyramidBenchmarks } from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  ExpenseCategory,
  ExpenseCategoryKey,
  ExpensesState,
  PyramidState,
} from "@/lib/workshop/types";

export type DeterministicPyramidGuess = {
  pyramid: PyramidState;
  rationale: Bilingual;
};

const EXPENSE_CATEGORY_DEFS = [
  { key: "housing", icon: "Home" },
  { key: "food_living", icon: "UtensilsCrossed" },
  { key: "transport", icon: "Bus" },
  { key: "insurance", icon: "Shield" },
  { key: "discretionary", icon: "Sparkles" },
] as const satisfies ReadonlyArray<{
  key: ExpenseCategoryKey;
  icon: string;
}>;

function sumExpenseCategories(
  categories: Array<{ amountHKD: number }>,
): number {
  return categories.reduce(
    (sum, cat) => sum + Math.max(0, Math.round(cat.amountHKD)),
    0,
  );
}

/**
 * Local CURRENT-state guess when DeepSeek is down / times out / returns bad JSON.
 * Numbers are intentionally below recommended benchmarks so layer flags still teach.
 */
export function buildDeterministicPyramidGuess(input: {
  age: number;
  monthlyIncome: number;
  industry: string;
}): DeterministicPyramidGuess {
  const benchmarks = buildPyramidBenchmarks({
    age: input.age,
    monthlyIncomeHKD: input.monthlyIncome,
    industry: input.industry,
  });
  const year = new Date().getFullYear();
  const retirementYears = Math.max(5, 65 - Math.round(input.age));

  const pyramid: PyramidState = {
    protection: {
      medicalCoveragePercent: Math.round(
        benchmarks.medicalCoveragePercent * 0.7,
      ),
      criticalIllnessAmountHKD: Math.round(
        benchmarks.criticalIllnessAmountHKD * 0.4,
      ),
    },
    emergencyFund: {
      savedAmountHKD: Math.round(benchmarks.emergencyFundTargetHKD * 0.35),
    },
    goals: {
      goals: [
        {
          id: "retirement",
          icon: "PiggyBank",
          label: {
            en: "Retirement nest egg",
            zhHant: "退休儲備",
          },
          targetAmountHKD: Math.round(input.monthlyIncome * 12 * 15),
          targetYear: year + retirementYears,
        },
        {
          id: "family-buffer",
          icon: "Shield",
          label: {
            en: "Family buffer",
            zhHant: "家庭應急金",
          },
          targetAmountHKD: Math.round(input.monthlyIncome * 6),
          targetYear: year + 5,
        },
      ],
    },
    investment: {
      riskAllocation: { ...benchmarks.riskAllocation },
      monthlyInvestmentHKD: Math.round(
        benchmarks.suggestedMonthlyInvestmentHKD * 0.6,
      ),
      monthlyFunHKD: Math.round(input.monthlyIncome * 0.05),
    },
  };

  return {
    pyramid,
    rationale: {
      en: "We used a local estimate based on your age, income, and industry while the AI assistant was temporarily unavailable. Adjust any numbers that do not match your situation.",
      zhHant:
        "AI 助手暫時未能回應，我們已根據你的年齡、收入與行業提供本地估算。請按實際情況調整數字。",
    },
  };
}

/** Ratio-based monthly spend when DeepSeek fails — editable in the next step. */
export function buildDeterministicExpensesGuess(input: {
  monthlyIncome: number;
  pyramid: PyramidState;
}): ExpensesState {
  const income = Math.max(0, input.monthlyIncome);
  const medical = input.pyramid.protection.medicalCoveragePercent;
  const ci = input.pyramid.protection.criticalIllnessAmountHKD;
  const insurance = Math.max(0, Math.round(medical * 12 + ci * 0.00035));

  const amounts: Record<ExpenseCategoryKey, number> = {
    housing: Math.round(income * 0.32),
    food_living: Math.round(income * 0.16),
    transport: Math.round(income * 0.06),
    insurance,
    discretionary: Math.round(income * 0.08),
  };

  const categories: ExpenseCategory[] = EXPENSE_CATEGORY_DEFS.map((def) => ({
    key: def.key,
    icon: def.icon,
    amountHKD: amounts[def.key],
  }));

  return {
    categories,
    totalHKD: sumExpenseCategories(categories),
  };
}
