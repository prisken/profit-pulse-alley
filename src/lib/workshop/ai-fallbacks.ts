/**
 * Deterministic AI fallbacks for Workshop Pyramid Lab.
 * Kept outside `"use server"` modules — Next.js requires exported server actions to be async.
 */

import { deriveGoalYear } from "@/lib/workshop/goal-year";
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
  protectionExplanation: Bilingual;
  emergencyFundExplanation: Bilingual;
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
  retirementAge?: number;
}): DeterministicPyramidGuess {
  const benchmarks = buildPyramidBenchmarks({
    age: input.age,
    monthlyIncomeHKD: input.monthlyIncome,
    industry: input.industry,
  });
  const retirementAge = Math.round(input.retirementAge ?? 65);
  const userAge = Math.round(input.age);
  const bufferAge = Math.min(retirementAge, userAge + 5);
  const runwayYears = Math.max(1, retirementAge - userAge);
  const annualIncome = Math.max(0, input.monthlyIncome) * 12;
  // Heuristic current invested capital (lump sum), not a monthly contribution.
  const savingYears = Math.min(runwayYears, Math.max(2, userAge - 22));
  const lumpSumHKD = Math.round(
    annualIncome * 0.1 * savingYears * 0.55,
  );
  // ~15% of income, rounded to nearest 500 — typical surplus share for investing.
  const monthlyInvestmentHKD = Math.max(
    0,
    Math.round((Math.max(0, input.monthlyIncome) * 0.15) / 500) * 500,
  );
  const monthlyFunHKD = Math.round(input.monthlyIncome * 0.05);

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
          targetAge: retirementAge,
          targetYear: deriveGoalYear(retirementAge, userAge),
          goalType: "retirementTarget",
        },
        {
          id: "family-buffer",
          icon: "Shield",
          label: {
            en: "Family buffer",
            zhHant: "家庭應急金",
          },
          targetAmountHKD: Math.round(input.monthlyIncome * 6),
          targetAge: bufferAge,
          targetYear: deriveGoalYear(bufferAge, userAge),
          goalType: "spend",
        },
      ],
    },
    investment: {
      riskAllocation: { ...benchmarks.riskAllocation },
      lumpSumHKD,
      monthlyInvestmentHKD,
      monthlyFunHKD,
    },
  };

  return {
    pyramid,
    rationale: {
      en: "We used a local estimate based on your age, income, and industry while the AI assistant was temporarily unavailable. Adjust any numbers that do not match your situation.",
      zhHant:
        "AI 助手暫時未能回應，我們已根據你的年齡、收入與行業提供本地估算。請按實際情況調整數字。",
    },
    protectionExplanation: {
      en: `Our critical-illness guide is ${benchmarks.ciBreakdown.multiple.toFixed(1)}× your annual income (about HKD ${benchmarks.ciBreakdown.annualIncomeHKD.toLocaleString("en-HK")}), which comes to HKD ${benchmarks.ciBreakdown.recommendedHKD.toLocaleString("en-HK")}. Younger earners need a higher multiple because they have more working years of income to protect.`,
      zhHant: `危疾保障參考為年收入的 ${benchmarks.ciBreakdown.multiple.toFixed(1)} 倍（約港幣 ${benchmarks.ciBreakdown.annualIncomeHKD.toLocaleString("en-HK")}），即港幣 ${benchmarks.ciBreakdown.recommendedHKD.toLocaleString("en-HK")}。較年輕的在職人士需要較高倍數，因為仍有較長的收入年期需要保障。`,
    },
    emergencyFundExplanation: {
      en: `For ${input.industry || "your industry"}, we suggest about ${benchmarks.efBreakdown.targetMonths} months of estimated living costs (65% of monthly income as a stand-in until you confirm expenses). That target is HKD ${benchmarks.efBreakdown.recommendedHKD.toLocaleString("en-HK")}. The stress-test step later refines this against your actual expenses.`,
      zhHant: `以${input.industry || "你的行業"}來說，我們建議約 ${benchmarks.efBreakdown.targetMonths} 個月的估計生活開支（在確認開支前，暫以月收入的 65% 估算），目標約港幣 ${benchmarks.efBreakdown.recommendedHKD.toLocaleString("en-HK")}。稍後的壓力測試會按你的實際開支再微調。`,
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

/**
 * Static squeeze narration when DeepSeek fails after retries.
 * Numbers come from the already-computed SqueezeRecommendation — never invented here.
 */
export function buildDeterministicSqueezeReasoning(input: {
  funCutMonthlyHKD: number;
  discretionaryCutMonthlyHKD: number;
  achievableAtAge: number | null;
  partial: boolean;
}): Bilingual {
  const fun = Math.max(0, Math.round(input.funCutMonthlyHKD));
  const disc = Math.max(0, Math.round(input.discretionaryCutMonthlyHKD));
  const totalCut = fun + disc;
  const cutEn =
    fun > 0 && disc > 0
      ? `fun by HK$${fun.toLocaleString("en-HK")}/mo and discretionary by HK$${disc.toLocaleString("en-HK")}/mo`
      : fun > 0
        ? `fun spending by HK$${fun.toLocaleString("en-HK")}/mo`
        : disc > 0
          ? `discretionary spending by HK$${disc.toLocaleString("en-HK")}/mo`
          : `spending by HK$${totalCut.toLocaleString("en-HK")}/mo`;
  const cutZh =
    fun > 0 && disc > 0
      ? `娛樂每月港幣 ${fun.toLocaleString("en-HK")}、可選開支每月港幣 ${disc.toLocaleString("en-HK")}`
      : fun > 0
        ? `娛樂開支每月港幣 ${fun.toLocaleString("en-HK")}`
        : disc > 0
          ? `可選開支每月港幣 ${disc.toLocaleString("en-HK")}`
          : `開支每月港幣 ${totalCut.toLocaleString("en-HK")}`;

  if (input.partial && input.achievableAtAge != null) {
    return {
      en: `Cutting ${cutEn} helps, but fun and discretionary alone cannot fully close the gap — on this plan you would still reach the goal around age ${input.achievableAtAge}.`,
      zhHant: `削減${cutZh}有幫助，但單靠娛樂與可選開支仍不足以完全填補缺口——以目前計劃，大約要到 ${input.achievableAtAge} 歲才能達成。`,
    };
  }

  if (input.achievableAtAge != null) {
    return {
      en: `Cutting ${cutEn} gets you there by age ${input.achievableAtAge}.`,
      zhHant: `削減${cutZh}，可望於 ${input.achievableAtAge} 歲達成。`,
    };
  }

  return {
    en: `Cutting ${cutEn} frees the monthly room this goal needs on your current plan.`,
    zhHant: `削減${cutZh}，可騰出此目標在目前計劃下所需的每月空間。`,
  };
}
