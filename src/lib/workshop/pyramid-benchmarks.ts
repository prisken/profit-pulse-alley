/**
 * Pure HK-oriented pyramid benchmarks for Workshop Pyramid Lab v2/v3.
 * No AI — deterministic recommendations only.
 */

import type {
  LayerFlag,
  LayerFlags,
  PyramidState,
} from "@/lib/workshop/types";

export type RiskAllocationBenchmark = {
  low: number;
  mid: number;
  high: number;
};

/** Critical-illness recommendation: multiple × annual income. */
export type CriticalIllnessBreakdown = {
  multiple: number;
  annualIncomeHKD: number;
  recommendedHKD: number;
};

/**
 * Emergency-fund recommendation at the pyramid step.
 * Income-based (monthlyIncome × BENCHMARK_EXPENSE_RATIO × targetMonths).
 * Note: the stress-test step later refines against confirmed actual expenses.
 */
export type EmergencyFundBreakdown = {
  targetMonths: number;
  monthlyIncomeHKD: number;
  recommendedHKD: number;
  industryKey: string;
};

/** Deterministic recommendation snapshot shown beside AI guesses in the UI. */
export type PyramidBenchmarkSnapshot = {
  medicalCoveragePercent: number;
  criticalIllnessAmountHKD: number;
  emergencyFundTargetMonths: number;
  emergencyFundTargetHKD: number;
  riskAllocation: RiskAllocationBenchmark;
  suggestedMonthlyInvestmentHKD: number;
  ciBreakdown: CriticalIllnessBreakdown;
  efBreakdown: EmergencyFundBreakdown;
};

/** Rough expense ratio used only for emergency-fund target HKD at pyramid step. */
export const BENCHMARK_EXPENSE_RATIO = 0.65;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeIndustry(industry: string): string {
  return industry.trim().toLowerCase();
}

/**
 * Recommended medical coverage % of typical hospital bills, rising with age.
 * Returns an integer in the 80–100 range.
 */
export function getMedicalCoverageBenchmarkPercent(age: number): number {
  const a = Number.isFinite(age) ? age : 35;
  if (a < 30) {
    return 80;
  }
  if (a < 40) {
    return 85;
  }
  if (a < 50) {
    return 90;
  }
  if (a < 60) {
    return 95;
  }
  return 100;
}

/**
 * CI cover multiple of annual income.
 * Age 25 → 10×; age 65 → 5× (linear glide, clamped).
 */
export function getCriticalIllnessMultiple(age: number): number {
  const a = Number.isFinite(age) ? age : 35;
  return clamp(10 - (a - 25) * (5 / 40), 5, 10);
}

/**
 * Critical-illness cover rule of thumb as a multiple of annual income.
 */
export function getCriticalIllnessBenchmarkHKD(
  age: number,
  annualIncomeHKD: number,
): number {
  const income = Math.max(0, annualIncomeHKD);
  if (income === 0) {
    return 0;
  }
  return Math.round(income * getCriticalIllnessMultiple(age));
}

export function buildCriticalIllnessBreakdown(input: {
  age: number;
  monthlyIncomeHKD: number;
}): CriticalIllnessBreakdown {
  const annualIncomeHKD = Math.max(0, input.monthlyIncomeHKD) * 12;
  const multiple = getCriticalIllnessMultiple(input.age);
  return {
    multiple,
    annualIncomeHKD,
    recommendedHKD: Math.round(annualIncomeHKD * multiple),
  };
}

/**
 * Emergency-fund months of expenses by industry stability.
 * Self-employed / freelance / business → 9–12; stable public roles → 3–4; else 6.
 */
export function getEmergencyFundTargetMonths(industry: string): number {
  const key = normalizeIndustry(industry);

  if (
    key.includes("self-employed") ||
    key.includes("self employed") ||
    key.includes("selfemployed") ||
    key.includes("freelance") ||
    key.includes("freelancer") ||
    key.includes("business owner") ||
    key.includes("entrepreneur") ||
    key.includes("gig") ||
    key === "self-employed"
  ) {
    return 12;
  }

  if (
    key.includes("civil") ||
    key.includes("civilservice") ||
    key.includes("government") ||
    key.includes("public") ||
    key.includes("healthcare") ||
    key.includes("health") ||
    key.includes("medical") ||
    key.includes("education") ||
    key.includes("teacher") ||
    key.includes("hospital")
  ) {
    return 3;
  }

  return 6;
}

export function buildEmergencyFundBreakdown(input: {
  monthlyIncomeHKD: number;
  industry: string;
}): EmergencyFundBreakdown {
  const monthlyIncomeHKD = Math.max(0, input.monthlyIncomeHKD);
  const targetMonths = getEmergencyFundTargetMonths(input.industry);
  // Income-proxy burn until the expenses step exists; stress-test later refines
  // against confirmed monthly expenses.
  const monthlyBurn = monthlyIncomeHKD * BENCHMARK_EXPENSE_RATIO;
  return {
    targetMonths,
    monthlyIncomeHKD,
    recommendedHKD: Math.round(targetMonths * monthlyBurn),
    industryKey: input.industry,
  };
}

/**
 * Classic equity glide path for risk allocation.
 * high = clamp(100 - age, 10, 90); remainder split low/mid with mid rising by age.
 * Always sums to exactly 100 (integer percentages).
 */
export function getRiskAllocationBenchmark(
  age: number,
): RiskAllocationBenchmark {
  const a = Number.isFinite(age) ? Math.round(age) : 35;
  const high = clamp(100 - a, 10, 90);
  const remainder = 100 - high;

  // Mid share of remainder rises with age: ~45% at 20 → ~70% at 70.
  const midShareOfRemainder = clamp(0.45 + (a - 20) * (0.25 / 50), 0.4, 0.75);
  let mid = Math.round(remainder * midShareOfRemainder);
  let low = remainder - mid;

  // Guard rounding edge cases so totals stay exact.
  if (low < 0) {
    mid += low;
    low = 0;
  }
  const sum = low + mid + high;
  if (sum !== 100) {
    mid += 100 - sum;
  }

  return { low, mid, high };
}

/**
 * Build the full deterministic benchmark set for a persona.
 */
export function buildPyramidBenchmarks(input: {
  age: number;
  monthlyIncomeHKD: number;
  industry: string;
}): PyramidBenchmarkSnapshot {
  const monthly = Math.max(0, input.monthlyIncomeHKD);
  const ciBreakdown = buildCriticalIllnessBreakdown({
    age: input.age,
    monthlyIncomeHKD: monthly,
  });
  const efBreakdown = buildEmergencyFundBreakdown({
    monthlyIncomeHKD: monthly,
    industry: input.industry,
  });

  return {
    medicalCoveragePercent: getMedicalCoverageBenchmarkPercent(input.age),
    criticalIllnessAmountHKD: ciBreakdown.recommendedHKD,
    emergencyFundTargetMonths: efBreakdown.targetMonths,
    emergencyFundTargetHKD: efBreakdown.recommendedHKD,
    riskAllocation: getRiskAllocationBenchmark(input.age),
    // Soft savings rate target (~10% of gross) for investment-layer flags.
    suggestedMonthlyInvestmentHKD: Math.round(monthly * 0.1),
    ciBreakdown,
    efBreakdown,
  };
}

function ratioToFlag(actual: number, target: number): LayerFlag {
  if (target <= 0) {
    return actual > 0 ? "green" : "amber";
  }
  const ratio = actual / target;
  if (ratio >= 0.85) {
    return "green";
  }
  if (ratio >= 0.5) {
    return "amber";
  }
  return "red";
}

function worseFlag(a: LayerFlag, b: LayerFlag): LayerFlag {
  const rank: Record<LayerFlag, number> = { green: 0, amber: 1, red: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/** i18n key for amber when monthly investing exceeds available surplus. */
export const MONTHLY_INVESTING_OVER_SURPLUS_KEY =
  "workshop.pyramid.investment.monthlyInvesting.amberWarning" as const;

export type ComputeLayerFlagsOptions = {
  /** Gross monthly income (HKD). Enables surplus-vs-investing amber rule. */
  monthlyIncomeHKD?: number;
  /**
   * Confirmed monthly expenses total (HKD). When omitted, uses
   * `monthlyIncome × BENCHMARK_EXPENSE_RATIO` as a stand-in.
   */
  monthlyExpensesHKD?: number;
};

/**
 * Available monthly surplus for investing helper / amber rule:
 * income − expenses − fun. Expenses fall back to the benchmark burn ratio.
 */
export function availableMonthlySurplusHKD(input: {
  monthlyIncomeHKD: number;
  monthlyExpensesHKD?: number;
  monthlyFunHKD: number;
}): number {
  const income = Math.max(0, input.monthlyIncomeHKD);
  const expenses =
    input.monthlyExpensesHKD != null && Number.isFinite(input.monthlyExpensesHKD)
      ? Math.max(0, input.monthlyExpensesHKD)
      : income * BENCHMARK_EXPENSE_RATIO;
  const fun = Math.max(0, input.monthlyFunHKD);
  return Math.round(income - expenses - fun);
}

/**
 * Compare a pyramid (usually AI current-state guesses) to deterministic benchmarks.
 * Flags are never AI-decided.
 */
export function computeLayerFlags(
  pyramid: PyramidState,
  benchmarks: PyramidBenchmarkSnapshot,
  options?: ComputeLayerFlagsOptions,
): LayerFlags {
  const medicalFlag = ratioToFlag(
    pyramid.protection.medicalCoveragePercent,
    benchmarks.medicalCoveragePercent,
  );
  const ciFlag = ratioToFlag(
    pyramid.protection.criticalIllnessAmountHKD,
    benchmarks.criticalIllnessAmountHKD,
  );

  const goalCount = pyramid.goals.goals.filter(
    (g) => g.targetAmountHKD > 0 && g.targetYear > 0,
  ).length;
  let goalsFlag: LayerFlag = "red";
  if (goalCount >= 2) {
    goalsFlag = "green";
  } else if (goalCount === 1) {
    goalsFlag = "amber";
  }

  const monthlyInvest = Math.max(0, pyramid.investment.monthlyInvestmentHKD);
  let investmentFlag = ratioToFlag(
    monthlyInvest,
    benchmarks.suggestedMonthlyInvestmentHKD,
  );

  if (
    options?.monthlyIncomeHKD != null &&
    Number.isFinite(options.monthlyIncomeHKD)
  ) {
    const surplus = availableMonthlySurplusHKD({
      monthlyIncomeHKD: options.monthlyIncomeHKD,
      monthlyExpensesHKD: options.monthlyExpensesHKD,
      monthlyFunHKD: pyramid.investment.monthlyFunHKD,
    });
    if (monthlyInvest > surplus) {
      investmentFlag = worseFlag(investmentFlag, "amber");
    }
  }

  return {
    protection: worseFlag(medicalFlag, ciFlag),
    emergencyFund: ratioToFlag(
      pyramid.emergencyFund.savedAmountHKD,
      benchmarks.emergencyFundTargetHKD,
    ),
    goals: goalsFlag,
    investment: investmentFlag,
  };
}
