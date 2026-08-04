/**
 * Deterministic life-timeline engine for Workshop Pyramid Lab v3.2 (real terms).
 * Pure TypeScript — no AI, no I/O, no Prisma.
 *
 * All figures in today's purchasing power:
 * - Expenses / fun / goal amounts: no inflation (entered values held flat).
 * - Invested pool compounds at blended REAL return.
 * - Liquid pool decays at LIQUID_REAL_RETURN (−3%/yr).
 * - Salary follows real career curve via advanceMonthlyIncomeForYear.
 */

import { advanceMonthlyIncomeForYear } from "@/lib/workshop/macro-simulation";
import {
  blendedAnnualReturn,
  LIQUID_REAL_RETURN,
} from "@/lib/workshop/investment-returns";
import { getEmergencyFundTargetMonths } from "@/lib/workshop/pyramid-benchmarks";
import type { GoalItem, GoalType, LayerFlag } from "@/lib/workshop/types";

export const TIMELINE_MAX_AGE = 90;
export const OVERSAVED_EF_MULTIPLIER = 1.5;
/** Debug / parse hint — payload version stays "lifeTimeline". */
export const TIMELINE_ENGINE_REVISION = 3;

export type TimelineInput = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  /** Living expenses (monthly). Fun is tracked separately and added to outflow. */
  monthlyExpenses: number;
  monthlyFun: number;
  emergencyFundSavedHKD: number;
  investment: {
    lumpSumHKD: number;
    /** Monthly contribution during working years (stops at retirement). */
    monthlyInvestmentHKD: number;
    allocation: { low: number; mid: number; high: number };
  };
  goals: GoalItem[];
  industry: string;
  /** Optional calendar year for row labels (defaults to current calendar year). */
  nowYear?: number;
  /**
   * Optional income shock for crisis overlay: reduce salary for the first
   * `ceil(durationMonths / 12)` simulation years.
   */
  incomeShock?: {
    hitPct: number;
    durationMonths: number;
  };
};

export type TimelineYearRow = {
  age: number;
  year: number;
  salaryIncome: number;
  passiveIncome: number;
  totalIncome: number;
  expenses: number;
  funBudget: number;
  surplus: number;
  /** Annual contribution swept into invested (working years only). */
  investedContributionHKD: number;
  /** Invested capital liquidated this year to fund spend goals. */
  investedLiquidatedHKD: number;
  liquidPool: number;
  investedPool: number;
};

export type GoalTimelineProjection = {
  goalId: string;
  goalType: GoalType;
  targetAge: number;
  inflatedTargetHKD: number;
  attainedAtAge: number | null;
  status: LayerFlag;
};

export type RetirementTargetProjection = {
  goalId: string;
  targetHKD: number;
  projectedAssetsHKD: number;
  gapHKD: number;
  met: boolean;
};

export type EmergencyFundTimelineStatus =
  | "green"
  | "amber"
  | "red"
  | "oversaved";

export type TimelineEmergencyFund = {
  status: EmergencyFundTimelineStatus;
  targetHKD: number;
  targetMonths: number;
  excessHKD?: number;
  opportunityCostHKD?: number;
};

export type TimelineRetirement = {
  retirementAge: number;
  passiveIncomeAtRetirement: number;
  assetsAtRetirement: number;
  assetsDepletedAtAge: number | null;
};

export type TimelineResult = {
  rows: TimelineYearRow[];
  goals: GoalTimelineProjection[];
  retirementTargets: RetirementTargetProjection[];
  emergencyFund: TimelineEmergencyFund;
  retirement: TimelineRetirement;
  blendedRate: number;
  engineRevision: number;
};

export type GoalScrubStatus = "attained" | "on_track" | "late" | "never";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampNonNeg(value: number): number {
  return Math.max(0, value);
}

function ratioToEfBand(
  actual: number,
  target: number,
): "green" | "amber" | "red" {
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

export function goalStatusFromAttainment(
  attainedAtAge: number | null,
  targetAge: number,
  startAge: number,
): LayerFlag {
  if (attainedAtAge == null) {
    return "red";
  }
  if (attainedAtAge <= targetAge) {
    return "green";
  }
  const overrun = attainedAtAge - targetAge;
  const span = Math.max(1, targetAge - startAge);
  if (overrun <= 1 || overrun <= 0.15 * span) {
    return "amber";
  }
  return "red";
}

function analyzeEmergencyFund(input: {
  savedHKD: number;
  monthlyExpenses: number;
  industry: string;
  age: number;
  retirementAge: number;
  blendedRate: number;
}): TimelineEmergencyFund {
  const targetMonths = getEmergencyFundTargetMonths(input.industry);
  const monthlyBurn = clampNonNeg(input.monthlyExpenses);
  const targetHKD = roundMoney(targetMonths * monthlyBurn);
  const saved = clampNonNeg(input.savedHKD);

  if (targetHKD > 0 && saved > OVERSAVED_EF_MULTIPLIER * targetHKD) {
    const excessHKD = roundMoney(saved - OVERSAVED_EF_MULTIPLIER * targetHKD);
    const yearsToRetire = Math.max(0, input.retirementAge - input.age);
    // Opportunity vs leaving excess in cash (real decay) rather than investing.
    const investFactor = (1 + input.blendedRate) ** yearsToRetire;
    const cashFactor = (1 + LIQUID_REAL_RETURN) ** yearsToRetire;
    const opportunityCostHKD = roundMoney(
      excessHKD * (investFactor - cashFactor),
    );
    return {
      status: "oversaved",
      targetHKD,
      targetMonths,
      excessHKD,
      opportunityCostHKD,
    };
  }

  return {
    status: ratioToEfBand(saved, targetHKD),
    targetHKD,
    targetMonths,
  };
}

type MutableGoal = {
  goalId: string;
  goalType: GoalType;
  targetAge: number;
  baseAmountHKD: number;
  inflatedTargetHKD: number;
  attainedAtAge: number | null;
  allowLiquidation: boolean;
};

/**
 * Year-by-year life timeline from current age through {@link TIMELINE_MAX_AGE}.
 */
export function runLifeTimeline(input: TimelineInput): TimelineResult {
  const startAge = Math.round(input.age);
  const retirementAge = Math.round(input.retirementAge);
  const maxAge = TIMELINE_MAX_AGE;
  const nowYear = input.nowYear ?? new Date().getFullYear();
  const blendedRate = blendedAnnualReturn(input.investment.allocation);
  const monthlyInvest = clampNonNeg(input.investment.monthlyInvestmentHKD);

  let monthlySalary = clampNonNeg(input.monthlyIncome);
  const monthlyLiving = clampNonNeg(input.monthlyExpenses);
  const monthlyFun = clampNonNeg(input.monthlyFun);

  let liquidPool = clampNonNeg(input.emergencyFundSavedHKD);
  let investedPool = clampNonNeg(input.investment.lumpSumHKD);

  const goals: MutableGoal[] = [...input.goals]
    .map((g) => {
      const targetAge = Math.round(g.targetAge);
      const baseAmountHKD = clampNonNeg(g.targetAmountHKD);
      const goalType: GoalType =
        g.goalType === "retirementTarget" ? "retirementTarget" : "spend";
      return {
        goalId: g.id,
        goalType,
        targetAge,
        baseAmountHKD,
        // Real terms: target stays at today's HKD (field name kept for UI/PDF compat).
        inflatedTargetHKD: roundMoney(baseAmountHKD),
        attainedAtAge: null as number | null,
        allowLiquidation: g.allowLiquidation === true,
      };
    })
    .sort((a, b) => a.targetAge - b.targetAge || a.goalId.localeCompare(b.goalId));

  const rows: TimelineYearRow[] = [];
  let assetsDepletedAtAge: number | null = null;
  let passiveIncomeAtRetirement = 0;
  let assetsAtRetirement = 0;
  let capturedRetirement = false;
  let simYearIndex = 0;

  for (let age = startAge; age <= maxAge; age += 1) {
    simYearIndex += 1;
    const calendarYear = nowYear + (age - startAge);
    const isRetired = age >= retirementAge;

    if (isRetired && !capturedRetirement) {
      assetsAtRetirement = roundMoney(liquidPool + investedPool);
      capturedRetirement = true;
    }

    // Real cash decay on liquid; invested compounds at blended real return (working years).
    liquidPool = roundMoney(liquidPool * (1 + LIQUID_REAL_RETURN));

    let salaryIncome = 0;
    let passiveIncome = 0;

    if (!isRetired) {
      salaryIncome = roundMoney(monthlySalary * 12);
      const shock = input.incomeShock;
      if (shock && shock.hitPct > 0 && shock.durationMonths > 0) {
        const shockYears = Math.max(1, Math.ceil(shock.durationMonths / 12));
        if (age - startAge < shockYears) {
          const hit = Math.min(100, Math.max(0, shock.hitPct)) / 100;
          salaryIncome = roundMoney(salaryIncome * (1 - hit));
        }
      }
      investedPool = roundMoney(investedPool * (1 + blendedRate));
    } else {
      // Retirement: return withdrawn as passive income; principal stays unless drawn.
      passiveIncome = roundMoney(investedPool * blendedRate);
      if (age === retirementAge) {
        passiveIncomeAtRetirement = passiveIncome;
      }
    }

    const funBudget = roundMoney(monthlyFun * 12);
    // Real terms: expenses + fun held flat (no inflation).
    const expenses = roundMoney((monthlyLiving + monthlyFun) * 12);
    const totalIncome = roundMoney(salaryIncome + passiveIncome);
    let surplus = roundMoney(totalIncome - expenses);
    let investedContributionHKD = 0;
    let investedLiquidatedHKD = 0;

    if (surplus >= 0) {
      if (!isRetired && monthlyInvest > 0) {
        const planned = roundMoney(monthlyInvest * 12);
        investedContributionHKD = roundMoney(Math.min(planned, surplus));
        investedPool = roundMoney(investedPool + investedContributionHKD);
        surplus = roundMoney(surplus - investedContributionHKD);
      }
      liquidPool = roundMoney(liquidPool + surplus);
      surplus = roundMoney(investedContributionHKD + surplus); // report total cash surplus
    } else {
      let shortfall = -surplus;
      const fromLiquid = Math.min(liquidPool, shortfall);
      liquidPool = roundMoney(liquidPool - fromLiquid);
      shortfall = roundMoney(shortfall - fromLiquid);
      if (shortfall > 0) {
        const fromInvested = Math.min(investedPool, shortfall);
        investedPool = roundMoney(investedPool - fromInvested);
        shortfall = roundMoney(shortfall - fromInvested);
      }
      surplus = roundMoney(-shortfall);
    }

    // Spend goals: liquid first; invested only when this goal explicitly allows it.
    for (const goal of goals) {
      if (goal.goalType === "retirementTarget") {
        continue;
      }
      if (goal.attainedAtAge != null) {
        continue;
      }
      if (age < goal.targetAge) {
        continue;
      }
      const payTarget = roundMoney(goal.baseAmountHKD);
      const available = roundMoney(
        liquidPool + (goal.allowLiquidation ? investedPool : 0),
      );
      if (available + 1e-9 < payTarget) {
        continue;
      }
      const fromLiquid = Math.min(liquidPool, payTarget);
      liquidPool = roundMoney(liquidPool - fromLiquid);
      const needFromInvested = roundMoney(payTarget - fromLiquid);
      if (goal.allowLiquidation && needFromInvested > 0) {
        investedPool = roundMoney(investedPool - needFromInvested);
        investedLiquidatedHKD = roundMoney(
          investedLiquidatedHKD + needFromInvested,
        );
      }
      goal.attainedAtAge = age;
      goal.inflatedTargetHKD = payTarget;
    }

    if (
      assetsDepletedAtAge == null &&
      liquidPool <= 0 &&
      investedPool <= 0 &&
      isRetired
    ) {
      assetsDepletedAtAge = age;
    }

    rows.push({
      age,
      year: calendarYear,
      salaryIncome,
      passiveIncome,
      totalIncome,
      expenses,
      funBudget,
      surplus,
      investedContributionHKD,
      investedLiquidatedHKD,
      liquidPool: roundMoney(liquidPool),
      investedPool: roundMoney(investedPool),
    });

    if (age < maxAge) {
      if (!isRetired) {
        monthlySalary = advanceMonthlyIncomeForYear({
          monthlyIncome: monthlySalary,
          industry: input.industry,
          age,
          year: simYearIndex,
        });
      }
      // Expenses + fun stay flat in real terms (no end-of-year inflation).
    }
  }

  if (!capturedRetirement) {
    assetsAtRetirement = roundMoney(liquidPool + investedPool);
  }

  const retirementTargets: RetirementTargetProjection[] = goals
    .filter((g) => g.goalType === "retirementTarget")
    .map((g) => {
      const targetHKD = roundMoney(g.baseAmountHKD);
      const projectedAssetsHKD = roundMoney(assetsAtRetirement);
      const gapHKD = roundMoney(Math.max(0, targetHKD - projectedAssetsHKD));
      return {
        goalId: g.goalId,
        targetHKD,
        projectedAssetsHKD,
        gapHKD,
        met: projectedAssetsHKD + 1e-9 >= targetHKD,
      };
    });

  // Stamp inflated target on retirement-target projections for UI/rating.
  for (const rt of retirementTargets) {
    const g = goals.find((x) => x.goalId === rt.goalId);
    if (g) {
      g.inflatedTargetHKD = rt.targetHKD;
      if (rt.met) {
        g.attainedAtAge = retirementAge;
      }
    }
  }

  const emergencyFund = analyzeEmergencyFund({
    savedHKD: input.emergencyFundSavedHKD,
    monthlyExpenses: input.monthlyExpenses,
    industry: input.industry,
    age: startAge,
    retirementAge,
    blendedRate,
  });

  return {
    rows,
    goals: goals.map((g) => {
      if (g.goalType === "retirementTarget") {
        const rt = retirementTargets.find((r) => r.goalId === g.goalId);
        let status: LayerFlag = "red";
        if (rt?.met) {
          status = "green";
        } else if (rt && rt.gapHKD / Math.max(1, rt.targetHKD) <= 0.2) {
          status = "amber";
        }
        return {
          goalId: g.goalId,
          goalType: g.goalType,
          targetAge: g.targetAge,
          inflatedTargetHKD: g.inflatedTargetHKD,
          attainedAtAge: g.attainedAtAge,
          status,
        };
      }
      return {
        goalId: g.goalId,
        goalType: g.goalType,
        targetAge: g.targetAge,
        inflatedTargetHKD: g.inflatedTargetHKD,
        attainedAtAge: g.attainedAtAge,
        status: goalStatusFromAttainment(
          g.attainedAtAge,
          g.targetAge,
          startAge,
        ),
      };
    }),
    retirementTargets,
    emergencyFund,
    retirement: {
      retirementAge,
      passiveIncomeAtRetirement: roundMoney(passiveIncomeAtRetirement),
      assetsAtRetirement: roundMoney(assetsAtRetirement),
      assetsDepletedAtAge,
    },
    blendedRate,
    engineRevision: TIMELINE_ENGINE_REVISION,
  };
}

/**
 * Recompute each goal's display status relative to a scrubbed calendar year.
 * Pure — does not mutate `result`.
 */
export function goalStatusAtYear(
  result: TimelineResult,
  scrubbedYear: number,
): Array<{ goalId: string; status: GoalScrubStatus }> {
  const first = result.rows[0];
  if (!first) {
    return result.goals.map((g) => ({
      goalId: g.goalId,
      status: "never" as const,
    }));
  }

  const ageAtScrub = first.age + (scrubbedYear - first.year);
  const retirementAge = result.retirement.retirementAge;
  const retirementTargets = result.retirementTargets ?? [];

  return result.goals.map((g) => {
    if (g.goalType === "retirementTarget") {
      const rt = retirementTargets.find((r) => r.goalId === g.goalId);
      if (!rt) {
        return { goalId: g.goalId, status: "never" };
      }
      if (rt.met) {
        return {
          goalId: g.goalId,
          status: ageAtScrub >= retirementAge ? "attained" : "on_track",
        };
      }
      const ratio = rt.gapHKD / Math.max(1, rt.targetHKD);
      if (ratio <= 0.2) {
        return {
          goalId: g.goalId,
          status: ageAtScrub >= retirementAge ? "late" : "on_track",
        };
      }
      return {
        goalId: g.goalId,
        status: ageAtScrub >= retirementAge ? "never" : "late",
      };
    }

    if (g.attainedAtAge == null) {
      return { goalId: g.goalId, status: "never" };
    }
    if (ageAtScrub >= g.attainedAtAge) {
      return { goalId: g.goalId, status: "attained" };
    }
    if (g.attainedAtAge > g.targetAge && ageAtScrub >= g.targetAge) {
      return { goalId: g.goalId, status: "late" };
    }
    return { goalId: g.goalId, status: "on_track" };
  });
}
