/**
 * Deterministic life-timeline engine for Workshop Pyramid Lab v4 (real terms).
 * Pure TypeScript — no AI, no I/O, no Prisma.
 *
 * All figures in today's purchasing power:
 * - Expenses / goal amounts: no inflation (entered values held flat).
 * - Invested pool compounds at blended REAL return (lump sum only — no monthly
 *   investing input in the game anymore; working-year surplus goes to liquid).
 * - Liquid pool decays at LIQUID_REAL_RETURN (−3%/yr).
 * - Salary follows real career curve via advanceMonthlyIncomeForYear.
 */

import { advanceMonthlyIncomeForYear } from "@/lib/workshop/macro-simulation";
import {
  blendedAnnualReturn,
  LIQUID_REAL_RETURN,
} from "@/lib/workshop/investment-returns";
import { getEmergencyFundTargetMonths } from "@/lib/workshop/pyramid-benchmarks";
import type { GoalItem, LayerFlag } from "@/lib/workshop/types";

export const TIMELINE_MAX_AGE = 90;
export const OVERSAVED_EF_MULTIPLIER = 1.5;
/** Debug / parse hint — payload version stays "lifeTimeline". */
export const TIMELINE_ENGINE_REVISION = 4;

export type TimelineInput = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  /** Living expenses (monthly). */
  monthlyExpenses: number;
  emergencyFundSavedHKD: number;
  investment: {
    lumpSumHKD: number;
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
  surplus: number;
  /** Invested capital liquidated this year to fund spend goals. */
  investedLiquidatedHKD: number;
  liquidPool: number;
  investedPool: number;
};

export type GoalTimelineProjection = {
  goalId: string;
  targetAge: number;
  inflatedTargetHKD: number;
  attainedAtAge: number | null;
  status: LayerFlag;
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

  let monthlySalary = clampNonNeg(input.monthlyIncome);
  const monthlyLiving = clampNonNeg(input.monthlyExpenses);

  let liquidPool = clampNonNeg(input.emergencyFundSavedHKD);
  let investedPool = clampNonNeg(input.investment.lumpSumHKD);

  const goals: MutableGoal[] = [...input.goals]
    .map((g) => {
      const targetAge = Math.round(g.targetAge);
      const baseAmountHKD = clampNonNeg(g.targetAmountHKD);
      return {
        goalId: g.id,
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

    const expenses = roundMoney(monthlyLiving * 12);
    const totalIncome = roundMoney(salaryIncome + passiveIncome);
    let surplus = roundMoney(totalIncome - expenses);
    let investedLiquidatedHKD = 0;

    if (surplus >= 0) {
      // No monthly-investing input anymore: all working-year surplus sits in liquid.
      liquidPool = roundMoney(liquidPool + surplus);
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
      surplus,
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
      // Expenses stay flat in real terms (no end-of-year inflation).
    }
  }

  if (!capturedRetirement) {
    assetsAtRetirement = roundMoney(liquidPool + investedPool);
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
    goals: goals.map((g) => ({
      goalId: g.goalId,
      targetAge: g.targetAge,
      inflatedTargetHKD: g.inflatedTargetHKD,
      attainedAtAge: g.attainedAtAge,
      status: goalStatusFromAttainment(g.attainedAtAge, g.targetAge, startAge),
    })),
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

  return result.goals.map((g) => {
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
