/**
 * Deterministic macro timeline for Workshop Pyramid Lab.
 * Pure calculation — no AI, no Prisma, no randomness.
 */

import { getEmergencyFundTargetMonths } from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  CrisisState,
  ExpensesState,
  LayerFlag,
  PyramidState,
  StressTestResult,
} from "@/lib/workshop/types";

export type MacroPyramidLayers = {
  foundation: number;
  core: number;
  growth: number;
  apex: number;
};

export type MacroSimulationInput = {
  age: number;
  industry: string;
  pyramid: MacroPyramidLayers;
  monthlyIncome: number;
  years: number;
  /** Used for lifestyle-creep rule when status mentions kids. */
  householdStatus?: string | null;
};

export type MacroYearSnapshot = {
  year: number;
  netWorth: number;
  foundation: number;
  core: number;
  growth: number;
  monthsOfEmergencyCover: number;
};

export type MacroSimulationResult = {
  yearByYear: MacroYearSnapshot[];
};

/** Snapshot years reported when they fall within the requested horizon. */
export const MACRO_SNAPSHOT_YEARS = [1, 3, 5, 7, 10, 15, 20] as const;

export const CPI_INFLATION = 0.025;
export const HEALTHCARE_INFLATION = 0.07;
export const GROWTH_MARKET_RETURN = 0.06;
export const GROWTH_SHOCK_RETURN = -0.18;
export const GROWTH_SHOCK_EVERY_N_YEARS = 6;
export const TAX_BRACKET_MONTHLY_HKD = 100_000;
export const TAX_BRACKET_GROWTH_PENALTY = 0.02;
export const LIFESTYLE_CREEP_EXTRA = 0.01;
export const BASE_EXPENSE_RATIO = 0.65;

type WageCurveKind =
  | "tech"
  | "professional"
  | "civil"
  | "selfEmployed"
  | "default";

/**
 * Industry wage-curve lookup. Values are early / mid / late career CAGRs
 * (or volatility amplitude for self-employed).
 */
export const WAGE_CURVES: Record<
  WageCurveKind,
  {
    /** Early-career nominal wage CAGR (or ± amplitude for self-employed). */
    early: number;
    /** Mid-career CAGR. */
    mid: number;
    /** Late-career CAGR. */
    late: number;
  }
> = {
  tech: {
    early: 0.08,
    mid: 0.05,
    late: 0.03,
  },
  professional: {
    early: 0.03,
    mid: 0.06,
    late: 0.04,
  },
  civil: {
    early: 0.02,
    mid: 0.02,
    late: 0.02,
  },
  selfEmployed: {
    early: 0.15,
    mid: 0.15,
    late: 0.15,
  },
  default: {
    early: 0.04,
    mid: 0.035,
    late: 0.025,
  },
};

function normalizeIndustry(industry: string): string {
  return industry.trim().toLowerCase();
}

export function resolveWageCurveKind(industry: string): WageCurveKind {
  const key = normalizeIndustry(industry);

  if (
    key.includes("tech") ||
    key.includes("software") ||
    key.includes("it") ||
    key === "technology"
  ) {
    return "tech";
  }
  if (
    key.includes("medical") ||
    key.includes("health") ||
    key.includes("legal") ||
    key.includes("law") ||
    key.includes("doctor")
  ) {
    return "professional";
  }
  if (key.includes("civil") || key.includes("government") || key.includes("public")) {
    return "civil";
  }
  if (
    key.includes("self") ||
    key.includes("freelance") ||
    key.includes("own business")
  ) {
    return "selfEmployed";
  }
  return "default";
}

/**
 * Age-banded CAGR for the industry curve.
 * Tech: high early, declines after 45. Professional: ramps mid-career.
 * Civil: flat. Self-employed: returns amplitude (sign applied elsewhere).
 */
export function wageCagrForAge(kind: WageCurveKind, age: number): number {
  const curve = WAGE_CURVES[kind];

  if (kind === "civil") {
    return curve.early;
  }

  if (kind === "selfEmployed") {
    return curve.early;
  }

  if (kind === "tech") {
    if (age < 35) return curve.early;
    if (age < 45) return curve.mid;
    return curve.late;
  }

  if (kind === "professional") {
    if (age < 32) return curve.early;
    if (age < 50) return curve.mid;
    return curve.late;
  }

  // default
  if (age < 35) return curve.early;
  if (age < 50) return curve.mid;
  return curve.late;
}

function householdHasKids(householdStatus: string | null | undefined): boolean {
  if (!householdStatus) {
    return false;
  }
  // Enum keys (v2) + legacy free-text phrases.
  return /kid|child|children|parent|marriedWithKids|singleParent/i.test(
    householdStatus,
  );
}

/**
 * Deterministic self-employed wage move: +amp on odd years, −amp on even.
 */
function selfEmployedWageDelta(year: number, amplitude: number): number {
  return year % 2 === 1 ? amplitude : -amplitude;
}

/**
 * One year of real career-curve wage growth (shared by timeline + legacy stress).
 * +2%/yr until age 40, +1%/yr until 50, flat thereafter (today's purchasing power).
 * `industry` / `year` remain for call-site compatibility; they do not affect the rate.
 */
export function advanceMonthlyIncomeForYear(input: {
  monthlyIncome: number;
  industry: string;
  age: number;
  /** 1-based simulation year (unused in v3.2 real career curve). */
  year: number;
}): number {
  void input.industry;
  void input.year;
  const monthlyIncome = Math.max(0, input.monthlyIncome);
  const age = Math.round(input.age);
  let wageGrowth = 0;
  if (age < 40) {
    wageGrowth = 0.02;
  } else if (age < 50) {
    wageGrowth = 0.01;
  }
  return Math.max(0, monthlyIncome * (1 + wageGrowth));
}

function applyCpiToCash(amount: number): number {
  // Real purchasing power of uninvested cash erodes with CPI.
  return amount / (1 + CPI_INFLATION);
}

function growthReturnForYear(year: number): number {
  if (year > 0 && year % GROWTH_SHOCK_EVERY_N_YEARS === 0) {
    return GROWTH_SHOCK_RETURN;
  }
  return GROWTH_MARKET_RETURN;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Simulates a deterministic multi-year path for pyramid layers and income.
 */
export function simulateMacroTimeline(
  input: MacroSimulationInput,
): MacroSimulationResult {
  const years = Math.max(0, Math.floor(input.years));
  if (years === 0) {
    return { yearByYear: [] };
  }

  const hasKids = householdHasKids(input.householdStatus);

  let age = input.age;
  let monthlyIncome = Math.max(0, input.monthlyIncome);
  let foundation = Math.max(0, input.pyramid.foundation);
  let core = Math.max(0, input.pyramid.core);
  let growth = Math.max(0, input.pyramid.growth);
  let apex = Math.max(0, input.pyramid.apex);

  // Notional annual healthcare reserve — grows with medical inflation.
  let healthcareAnnualReserve = monthlyIncome * 12 * 0.05;
  let monthlyExpenses = monthlyIncome * BASE_EXPENSE_RATIO;

  const snapshots: MacroYearSnapshot[] = [];
  const snapshotSet = new Set<number>(
    MACRO_SNAPSHOT_YEARS.filter((y) => y <= years),
  );

  for (let year = 1; year <= years; year += 1) {
    // --- Wage growth ---
    const previousIncome = monthlyIncome;
    monthlyIncome = advanceMonthlyIncomeForYear({
      monthlyIncome,
      industry: input.industry,
      age,
      year,
    });

    // --- Lifestyle creep (expenses vs income) ---
    const incomeGrowthRate =
      previousIncome > 0 ? monthlyIncome / previousIncome - 1 : 0;
    if (hasKids && year > 3) {
      monthlyExpenses = monthlyExpenses * (1 + incomeGrowthRate + LIFESTYLE_CREEP_EXTRA);
    } else {
      // Expenses track income growth in real terms (nominal).
      monthlyExpenses = monthlyExpenses * (1 + Math.max(incomeGrowthRate, 0));
    }

    // --- Cash layers: CPI erosion (untouched / uninvested) ---
    foundation = applyCpiToCash(foundation);
    core = applyCpiToCash(core);

    // --- Healthcare reserve inflation ---
    healthcareAnnualReserve *= 1 + HEALTHCARE_INFLATION;

    // --- Growth layer: market cycle ---
    growth = Math.max(0, growth * (1 + growthReturnForYear(year)));

    // Apex held constant in this deterministic model (estate/legacy lag).
    apex = apex;

    age += 1;

    if (snapshotSet.has(year)) {
      const monthlyHealthcareBurden = healthcareAnnualReserve / 12;
      const monthlyBurn = monthlyExpenses + monthlyHealthcareBurden;
      const monthsOfEmergencyCover =
        monthlyBurn > 0 ? foundation / monthlyBurn : 0;

      snapshots.push({
        year,
        netWorth: roundMoney(foundation + core + growth + apex),
        foundation: roundMoney(foundation),
        core: roundMoney(core),
        growth: roundMoney(growth),
        monthsOfEmergencyCover: roundMoney(monthsOfEmergencyCover),
      });
    }
  }

  return { yearByYear: snapshots };
}

export type CrisisImpact = {
  monthlyIncomeImpactPercent: number;
  oneTimeCostHKD: number;
  durationMonths: number;
};

export type ShockTimelineMonth = {
  /** 0 = immediately after one-time cost; 1..N = crisis months. */
  month: number;
  foundation: number;
  core: number;
  growth: number;
  /** Growth sold this month to cover remaining shortfall after cash. */
  growthLiquidated: number;
  foundationDepleted: boolean;
  coreDepleted: boolean;
};

export type ShockTimelineResult = {
  shockTimeline: ShockTimelineMonth[];
  foundationZeroAtMonth: number | null;
  coreZeroAtMonth: number | null;
  totalGrowthLiquidated: number;
};

function drainCashThenGrowth(
  foundation: number,
  core: number,
  growth: number,
  amount: number,
): {
  foundation: number;
  core: number;
  growth: number;
  growthLiquidated: number;
} {
  let remaining = Math.max(0, amount);
  let nextFoundation = foundation;
  let nextCore = core;
  let nextGrowth = growth;
  let growthLiquidated = 0;

  if (remaining > 0 && nextFoundation > 0) {
    const take = Math.min(nextFoundation, remaining);
    nextFoundation -= take;
    remaining -= take;
  }
  if (remaining > 0 && nextCore > 0) {
    const take = Math.min(nextCore, remaining);
    nextCore -= take;
    remaining -= take;
  }
  if (remaining > 0 && nextGrowth > 0) {
    const take = Math.min(nextGrowth, remaining);
    nextGrowth -= take;
    growthLiquidated = take;
    remaining -= take;
  }

  return {
    foundation: Math.max(0, nextFoundation),
    core: Math.max(0, nextCore),
    growth: Math.max(0, nextGrowth),
    growthLiquidated,
  };
}

/**
 * Applies a crisis shock month-by-month.
 * Starts from the earliest yearByYear foundation/core/growth snapshot.
 * One-time cost hits at month 0; income shortfall drains cash each month
 * for `durationMonths`. If foundation+core cannot cover, growth is
 * partially liquidated. Pure arithmetic — no AI.
 */
export function applyCrisisToTimeline(input: {
  yearByYear: MacroYearSnapshot[];
  crisis: CrisisImpact;
  monthlyIncome: number;
}): ShockTimelineResult {
  const { yearByYear, crisis, monthlyIncome } = input;

  if (!Array.isArray(yearByYear) || yearByYear.length === 0) {
    throw new Error("yearByYear must include at least one snapshot.");
  }

  const impactPercent = Math.min(
    100,
    Math.max(0, crisis.monthlyIncomeImpactPercent),
  );
  const oneTimeCost = Math.max(0, crisis.oneTimeCostHKD);
  const durationMonths = Math.max(0, Math.floor(crisis.durationMonths));
  const income = Math.max(0, monthlyIncome);
  const monthlyShortfall = income * (impactPercent / 100);

  const start = yearByYear[0]!;
  let foundation = Math.max(0, start.foundation);
  let core = Math.max(0, start.core);
  let growth = Math.max(0, start.growth);

  let foundationZeroAtMonth: number | null = null;
  let coreZeroAtMonth: number | null = null;
  let totalGrowthLiquidated = 0;

  const markZeros = (month: number) => {
    if (foundation <= 0 && foundationZeroAtMonth === null) {
      foundationZeroAtMonth = month;
      foundation = 0;
    }
    if (core <= 0 && coreZeroAtMonth === null) {
      coreZeroAtMonth = month;
      core = 0;
    }
  };

  const pushMonth = (month: number, growthLiquidated: number) => {
    markZeros(month);
    totalGrowthLiquidated += growthLiquidated;
    shockTimeline.push({
      month,
      foundation: roundMoney(foundation),
      core: roundMoney(core),
      growth: roundMoney(growth),
      growthLiquidated: roundMoney(growthLiquidated),
      foundationDepleted: foundation <= 0,
      coreDepleted: core <= 0,
    });
  };

  const shockTimeline: ShockTimelineMonth[] = [];

  // Month 0: apply one-time cost immediately.
  {
    const drained = drainCashThenGrowth(
      foundation,
      core,
      growth,
      oneTimeCost,
    );
    foundation = drained.foundation;
    core = drained.core;
    growth = drained.growth;
    pushMonth(0, drained.growthLiquidated);
  }

  for (let month = 1; month <= durationMonths; month += 1) {
    const drained = drainCashThenGrowth(
      foundation,
      core,
      growth,
      monthlyShortfall,
    );
    foundation = drained.foundation;
    core = drained.core;
    growth = drained.growth;
    pushMonth(month, drained.growthLiquidated);

    if (foundation <= 0 && core <= 0 && growth <= 0) {
      for (let rest = month + 1; rest <= durationMonths; rest += 1) {
        shockTimeline.push({
          month: rest,
          foundation: 0,
          core: 0,
          growth: 0,
          growthLiquidated: 0,
          foundationDepleted: true,
          coreDepleted: true,
        });
      }
      break;
    }
  }

  return {
    shockTimeline,
    foundationZeroAtMonth,
    coreZeroAtMonth,
    totalGrowthLiquidated: roundMoney(totalGrowthLiquidated),
  };
}

/** Hardcoded expense / goal-cost inflation for goal stress tests. */
export const INFLATION_RATE = 0.03;

const DEFAULT_STRESS_HORIZON_YEARS = 30;

function baseMonthlyExpenses(expenses: ExpensesState): number {
  if (Array.isArray(expenses.categories) && expenses.categories.length > 0) {
    return Math.max(
      0,
      expenses.categories.reduce(
        (sum, cat) => sum + Math.max(0, cat.amountHKD),
        0,
      ),
    );
  }
  return Math.max(0, expenses.totalHKD);
}

function goalStatusFlag(
  projectedYear: number | null,
  targetYear: number,
  nowYear: number,
): LayerFlag {
  if (projectedYear === null) {
    return "red";
  }
  if (projectedYear <= targetYear) {
    return "green";
  }
  const overrunYears = projectedYear - targetYear;
  const spanToTarget = Math.max(1, targetYear - nowYear);
  if (overrunYears <= 1 || overrunYears <= 0.15 * spanToTarget) {
    return "amber";
  }
  return "red";
}

function emergencyFundStatusFlag(projectedMonths: number): LayerFlag {
  // Implicit target is "immediately" (0 months).
  if (projectedMonths <= 0) {
    return "green";
  }
  // Within 1 year, or within 15% of a notional 1-year planning window.
  if (projectedMonths <= 12 || projectedMonths <= 0.15 * 12) {
    return "amber";
  }
  return "red";
}

export type GoalStressTestInput = {
  age: number;
  industry: string;
  monthlyIncome: number;
  expenses: ExpensesState;
  pyramid: PyramidState;
  horizonYears?: number;
};

type SurplusYearRow = StressTestResult["monthlySurplusByYear"][number];

type WaterfallGoal = {
  id: string;
  label: Bilingual;
  icon: string;
  targetAmountHKD: number;
  targetYear: number;
  accumulatedHKD: number;
  projectedYear: number | null;
  baseTargetHKD: number;
};

/**
 * Build year-by-year income / expense / surplus path (no allocation yet).
 */
function buildSurplusPath(input: {
  age: number;
  industry: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  horizonYears: number;
}): SurplusYearRow[] {
  let age = input.age;
  let monthlyIncome = Math.max(0, input.monthlyIncome);
  let monthlyExpenses = Math.max(0, input.monthlyExpenses);
  const rows: SurplusYearRow[] = [];

  for (let year = 1; year <= input.horizonYears; year += 1) {
    monthlyIncome = advanceMonthlyIncomeForYear({
      monthlyIncome,
      industry: input.industry,
      age,
      year,
    });
    monthlyExpenses = monthlyExpenses * (1 + INFLATION_RATE);
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    rows.push({
      year,
      income: roundMoney(monthlyIncome),
      expenses: roundMoney(monthlyExpenses),
      surplus: roundMoney(monthlySurplus),
    });
    age += 1;
  }

  return rows;
}

/**
 * Waterfall annual surplus: emergency fund → soonest unmet goals → investment.
 */
function waterfallFromSurplusPath(input: {
  monthlySurplusByYear: SurplusYearRow[];
  targetEfMonths: number;
  startingEmergencyFundHKD: number;
  goals: Array<{
    id: string;
    label: Bilingual;
    icon: string;
    targetAmountHKD: number;
    targetYear: number;
  }>;
  nowYear: number;
  /** Extra HKD drained from year-1 annual surplus (e.g. crisis one-time cost). */
  year1ExtraDrainHKD?: number;
}): StressTestResult {
  const horizonYears = input.monthlySurplusByYear.length;
  let emergencyFundHKD = Math.max(0, input.startingEmergencyFundHKD);
  const year1Drain = Math.max(0, input.year1ExtraDrainHKD ?? 0);

  const goals: WaterfallGoal[] = input.goals.map((goal) => ({
    ...goal,
    accumulatedHKD: 0,
    projectedYear: null,
    baseTargetHKD: Math.max(0, goal.targetAmountHKD),
  }));

  const goalOrder = [...goals].sort((a, b) => {
    if (a.targetYear !== b.targetYear) {
      return a.targetYear - b.targetYear;
    }
    return a.id.localeCompare(b.id);
  });

  const firstExpenses = input.monthlySurplusByYear[0]?.expenses ?? 0;
  let efHitMonths: number | null =
    firstExpenses > 0 &&
    emergencyFundHKD >= input.targetEfMonths * (firstExpenses / (1 + INFLATION_RATE))
      ? 0
      : null;

  // Re-check with year-0 style: if starting EF already covers target at pre-inflation expenses.
  if (efHitMonths === null && firstExpenses > 0) {
    const approxBase = firstExpenses / (1 + INFLATION_RATE);
    if (emergencyFundHKD >= input.targetEfMonths * approxBase) {
      efHitMonths = 0;
    }
  }

  for (const row of input.monthlySurplusByYear) {
    const year = row.year;
    const monthlyExpenses = row.expenses;
    const inflatedGoalFactor = (1 + INFLATION_RATE) ** year;
    let annualSurplus = row.surplus * 12;

    if (year === 1 && year1Drain > 0) {
      annualSurplus -= year1Drain;
    }

    if (annualSurplus > 0) {
      const efTargetHKD = input.targetEfMonths * monthlyExpenses;
      const efGap = Math.max(0, efTargetHKD - emergencyFundHKD);
      const toEf = Math.min(annualSurplus, efGap);
      emergencyFundHKD += toEf;
      annualSurplus -= toEf;

      for (const goal of goalOrder) {
        if (goal.projectedYear !== null) {
          continue;
        }
        const inflatedTarget = goal.baseTargetHKD * inflatedGoalFactor;
        const gap = Math.max(0, inflatedTarget - goal.accumulatedHKD);
        if (gap <= 0) {
          goal.projectedYear = input.nowYear + year;
          continue;
        }
        if (annualSurplus <= 0) {
          break;
        }
        const toGoal = Math.min(annualSurplus, gap);
        goal.accumulatedHKD += toGoal;
        annualSurplus -= toGoal;
        if (goal.accumulatedHKD + 1e-6 >= inflatedTarget) {
          goal.projectedYear = input.nowYear + year;
        }
      }
    }

    if (
      efHitMonths === null &&
      monthlyExpenses > 0 &&
      emergencyFundHKD >= input.targetEfMonths * monthlyExpenses
    ) {
      efHitMonths = year * 12;
    }
  }

  const projectedMonths =
    efHitMonths !== null ? efHitMonths : horizonYears * 12;

  return {
    monthlySurplusByYear: input.monthlySurplusByYear,
    emergencyFundProjection: {
      targetMonths: input.targetEfMonths,
      projectedMonths,
      status: emergencyFundStatusFlag(
        efHitMonths !== null ? efHitMonths : Number.POSITIVE_INFINITY,
      ),
    },
    goalProjections: goals.map((goal) => ({
      goalId: goal.id,
      label: goal.label,
      icon: goal.icon,
      targetAmountHKD: goal.baseTargetHKD,
      targetYear: goal.targetYear,
      projectedYear: goal.projectedYear,
      status: goalStatusFlag(
        goal.projectedYear,
        goal.targetYear,
        input.nowYear,
      ),
    })),
  };
}

/**
 * Legacy v2 goal stress test (wizard used this before life-timeline v3).
 * Prefer `runLifeTimeline` / `runLifeTimelineAction` for new wizard sessions.
 * Kept for crisis overlay fallback, unit tests, and old-session PDF parse (§9).
 */
export function runGoalStressTest(input: GoalStressTestInput): StressTestResult {
  const horizonYears = Math.max(
    0,
    Math.floor(input.horizonYears ?? DEFAULT_STRESS_HORIZON_YEARS),
  );
  const nowYear = new Date().getFullYear();
  const targetEfMonths = getEmergencyFundTargetMonths(input.industry);
  const monthlyExpenses = baseMonthlyExpenses(input.expenses);
  const startingEmergencyFundHKD = Math.max(
    0,
    input.pyramid.emergencyFund.savedAmountHKD,
  );

  if (horizonYears === 0) {
    return {
      monthlySurplusByYear: [],
      emergencyFundProjection: {
        targetMonths: targetEfMonths,
        projectedMonths:
          monthlyExpenses > 0 &&
          startingEmergencyFundHKD >= targetEfMonths * monthlyExpenses
            ? 0
            : 0,
        status:
          monthlyExpenses > 0 &&
          startingEmergencyFundHKD >= targetEfMonths * monthlyExpenses
            ? "green"
            : "red",
      },
      goalProjections: input.pyramid.goals.goals.map((goal) => ({
        goalId: goal.id,
        label: goal.label,
        icon: goal.icon,
        targetAmountHKD: goal.targetAmountHKD,
        targetYear: goal.targetYear,
        projectedYear: null,
        status: "red" as const,
      })),
    };
  }

  const monthlySurplusByYear = buildSurplusPath({
    age: input.age,
    industry: input.industry,
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses,
    horizonYears,
  });

  return waterfallFromSurplusPath({
    monthlySurplusByYear,
    targetEfMonths,
    startingEmergencyFundHKD,
    goals: input.pyramid.goals.goals.map((goal) => ({
      id: goal.id,
      label: goal.label,
      icon: goal.icon,
      targetAmountHKD: goal.targetAmountHKD,
      targetYear: goal.targetYear,
    })),
    nowYear,
  });
}

/**
 * Legacy v2 crisis overlay on StressTestResult surplus paths.
 * Prefer {@link applyCrisis} from `crisis-engine.ts` for the wizard.
 * Kept for unit tests and old-session compatibility (§9).
 */
export function applyCrisisImpactsToStressTest(
  stressTest: StressTestResult,
  crisis: CrisisState,
): StressTestResult {
  const nowYear = new Date().getFullYear();
  const impactFrac = Math.min(
    100,
    Math.max(0, crisis.monthlyIncomeImpactPercent),
  ) / 100;
  const durationYears = Math.max(1, Math.ceil(Math.max(1, crisis.durationMonths) / 12));
  const oneTimeCost = Math.max(0, crisis.oneTimeCostHKD);

  const shockedPath: SurplusYearRow[] = stressTest.monthlySurplusByYear.map(
    (row) => {
      if (row.year > durationYears) {
        return { ...row };
      }
      const shockedIncome = row.income * (1 - impactFrac);
      const shockedSurplus = shockedIncome - row.expenses;
      return {
        year: row.year,
        income: roundMoney(shockedIncome),
        expenses: row.expenses,
        surplus: roundMoney(shockedSurplus),
      };
    },
  );

  const y1 = stressTest.monthlySurplusByYear[0];
  const baseExpenses = y1 ? y1.expenses / (1 + INFLATION_RATE) : 0;
  const targetEfMonths = stressTest.emergencyFundProjection.targetMonths;
  // Infer starting EF: fully funded if original projection was immediate.
  const startingEmergencyFundHKD =
    stressTest.emergencyFundProjection.projectedMonths <= 0
      ? targetEfMonths * baseExpenses
      : 0;

  return waterfallFromSurplusPath({
    monthlySurplusByYear: shockedPath,
    targetEfMonths,
    startingEmergencyFundHKD,
    goals: stressTest.goalProjections.map((goal) => ({
      id: goal.goalId,
      label: goal.label,
      icon: goal.icon,
      targetAmountHKD: goal.targetAmountHKD,
      targetYear: goal.targetYear,
    })),
    nowYear,
    year1ExtraDrainHKD: oneTimeCost,
  });
}
