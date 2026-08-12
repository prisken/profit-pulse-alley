import { describe, expect, it } from "vitest";

import { bilingualBoth } from "@/lib/workshop/bilingual";
import {
  GIVEN_UP_GOAL_CREDIT,
  GOALS_RETIREMENT_BLEND,
  OVERSAVED_EF_SCORE,
  RATING_WEIGHTS,
  computeFinancialRating,
  computeGoalImpactPoints,
  scoreRetirementReadiness,
} from "@/lib/workshop/financial-rating";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  CrisisImpactResult,
  CrisisState,
  PyramidState,
  StressTestResult,
} from "@/lib/workshop/types";

const nowYear = new Date().getFullYear();

const strongPyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 90,
    criticalIllnessAmountHKD: 1_000_000,
  },
  emergencyFund: { savedAmountHKD: 300_000 },
  goals: {
    goals: [
      {
        id: "wedding",
        icon: "Heart",
        label: bilingualBoth("Wedding"),
        targetAmountHKD: 200_000,
        targetAge: 40,
        targetYear: nowYear + 3,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 8_000,
  },
};

const weakPyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 0,
    criticalIllnessAmountHKD: 0,
  },
  emergencyFund: { savedAmountHKD: 0 },
  goals: {
    goals: [
      {
        id: "home",
        icon: "Home",
        label: bilingualBoth("Home"),
        targetAmountHKD: 2_000_000,
        targetAge: 40,
        targetYear: nowYear + 5,
      },
      {
        id: "edu",
        icon: "GraduationCap",
        label: bilingualBoth("Education"),
        targetAmountHKD: 800_000,
        targetAge: 40,
        targetYear: nowYear + 8,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 80, mid: 15, high: 5 },
    lumpSumHKD: 0,
  },
};

const strongBenchmarks = {
  medicalCoveragePercent: 80,
  criticalIllnessAmountHKD: 800_000,
  emergencyFundTargetMonths: 6,
  emergencyFundTargetHKD: 180_000,
};

const weakBenchmarks = {
  medicalCoveragePercent: 80,
  criticalIllnessAmountHKD: 800_000,
  emergencyFundTargetMonths: 6,
  emergencyFundTargetHKD: 180_000,
};

const strongStress: StressTestResult = {
  monthlySurplusByYear: [
    { year: 1, income: 80_000, expenses: 30_000, surplus: 50_000 },
  ],
  emergencyFundProjection: {
    targetMonths: 6,
    projectedMonths: 0,
    status: "green",
  },
  goalProjections: [
    {
      goalId: "wedding",
      label: bilingualBoth("Wedding"),
      icon: "Heart",
      targetAmountHKD: 200_000,
      targetYear: nowYear + 3,
      projectedYear: nowYear + 2,
      status: "green",
    },
  ],
};

const weakStress: StressTestResult = {
  monthlySurplusByYear: [
    { year: 1, income: 40_000, expenses: 38_000, surplus: 2_000 },
  ],
  emergencyFundProjection: {
    targetMonths: 6,
    projectedMonths: 360,
    status: "red",
  },
  goalProjections: [
    {
      goalId: "home",
      label: bilingualBoth("Home"),
      icon: "Home",
      targetAmountHKD: 2_000_000,
      targetYear: nowYear + 5,
      projectedYear: null,
      status: "red",
    },
    {
      goalId: "edu",
      label: bilingualBoth("Education"),
      icon: "GraduationCap",
      targetAmountHKD: 800_000,
      targetYear: nowYear + 8,
      projectedYear: null,
      status: "red",
    },
  ],
};

function makeImpactResult(
  partial: Partial<CrisisImpactResult>,
): CrisisImpactResult {
  return {
    crisisType: "job_loss",
    coverage: null,
    cutOrder: {
      funAbsorbedHKD: 0,
      discretionaryAbsorbedHKD: 0,
      liquidAbsorbedHKD: 0,
      investedAbsorbedHKD: 0,
      remainingUncoveredHKD: 0,
    },
    marketDropHKD: 0,
    incomeHitPct: 10,
    durationMonths: 3,
    oneTimeCostHKD: 20_000,
    efStatusBefore: "green",
    efStatusAfter: "green",
    assetsDepletedAtAgeBefore: null,
    assetsDepletedAtAgeAfter: null,
    goalDelays: [],
    ...partial,
  };
}

const mildCrisis: CrisisState = {
  crisisType: "job_loss",
  title: bilingualBoth("Mild industry soft patch"),
  description: bilingualBoth("A short, contained income dip."),
  riskProfile: "balanced",
  monthlyIncomeImpactPercent: 10,
  oneTimeCostHKD: 20_000,
  durationMonths: 3,
  incomeHitPct: 10,
  impacts: [
    {
      layer: "investment",
      icon: "TrendingDown",
      headline: bilingualBoth("Portfolio wobble"),
      detailHKD: 40_000,
    },
    {
      layer: "goals",
      icon: "Target",
      headline: bilingualBoth("Minor delay"),
      detailMonths: 6,
    },
  ],
  impactResult: makeImpactResult({
    crisisType: "job_loss",
    incomeHitPct: 10,
    cutOrder: {
      funAbsorbedHKD: 5_000,
      discretionaryAbsorbedHKD: 0,
      liquidAbsorbedHKD: 0,
      investedAbsorbedHKD: 0,
      remainingUncoveredHKD: 0,
    },
  }),
};

const severeCrisis: CrisisState = {
  crisisType: "critical_illness",
  title: bilingualBoth("Full-stack shock"),
  description: bilingualBoth("Income, health, and liquidity all hit at once."),
  riskProfile: "conservative",
  monthlyIncomeImpactPercent: 90,
  oneTimeCostHKD: 500_000,
  durationMonths: 18,
  incomeHitPct: 90,
  impacts: [
    {
      layer: "protection",
      icon: "ShieldOff",
      headline: bilingualBoth("No CI cover"),
      detailHKD: 400_000,
    },
    {
      layer: "emergencyFund",
      icon: "PiggyBank",
      headline: bilingualBoth("Cash gone"),
      detailMonths: 1,
    },
    {
      layer: "investment",
      icon: "TrendingDown",
      headline: bilingualBoth("Forced sale"),
      detailHKD: 200_000,
    },
    {
      layer: "goals",
      icon: "Target",
      headline: bilingualBoth("Goals stalled"),
      detailMonths: 36,
    },
  ],
  impactResult: makeImpactResult({
    crisisType: "critical_illness",
    incomeHitPct: 90,
    oneTimeCostHKD: 500_000,
    coverage: {
      grossCostHKD: 500_000,
      coveredHKD: 0,
      uncoveredHKD: 500_000,
      coverageKind: "critical_illness",
      ciAmountHKD: 0,
    },
    cutOrder: {
      funAbsorbedHKD: 10_000,
      discretionaryAbsorbedHKD: 20_000,
      liquidAbsorbedHKD: 100_000,
      investedAbsorbedHKD: 200_000,
      remainingUncoveredHKD: 170_000,
    },
  }),
};

function makeTimeline(partial?: Partial<TimelineResult>): TimelineResult {
  return {
    rows: [],
    goals: [
      {
        goalId: "wedding",
        targetAge: 40,
        inflatedTargetHKD: 220_000,
        attainedAtAge: 38,
        status: "green",
      },
    ],
    emergencyFund: {
      status: "green",
      targetHKD: 180_000,
      targetMonths: 6,
    },
    retirement: {
      retirementAge: 65,
      passiveIncomeAtRetirement: 48_000,
      assetsAtRetirement: 2_000_000,
      assetsDepletedAtAge: null,
    },
    blendedRate: 0.06,
    engineRevision: 2,
    ...partial,
  };
}

describe("RATING_WEIGHTS", () => {
  it("sums to 1.0", () => {
    const sum =
      RATING_WEIGHTS.protection +
      RATING_WEIGHTS.emergencyFund +
      RATING_WEIGHTS.goalsOnTrack +
      RATING_WEIGHTS.crisisResilience;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("scoreRetirementReadiness", () => {
  it("scores 100 when assets never deplete", () => {
    expect(scoreRetirementReadiness(makeTimeline())).toBe(100);
  });

  it("penalises early depletion", () => {
    expect(
      scoreRetirementReadiness(
        makeTimeline({
          retirement: {
            retirementAge: 65,
            passiveIncomeAtRetirement: 0,
            assetsAtRetirement: 100_000,
            assetsDepletedAtAge: 68,
          },
        }),
      ),
    ).toBe(20);
  });
});

describe("computeFinancialRating", () => {
  it("scores near 100 for strong protection, funded EF, green goals, mild crisis", () => {
    const rating = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline(),
    });

    expect(rating.breakdown.protection).toBeGreaterThanOrEqual(95);
    expect(rating.breakdown.emergencyFund).toBe(100);
    expect(rating.breakdown.goalsOnTrack).toBe(100);
    expect(rating.score).toBeGreaterThanOrEqual(85);
    expect(rating.labelKey).toBe("strongFoundation");
    expect(rating).not.toHaveProperty("label");
  });

  it("scores oversaved EF as a mild deduction (better than red)", () => {
    const oversaved = computeFinancialRating({
      pyramid: {
        ...strongPyramid,
        emergencyFund: { savedAmountHKD: 500_000 },
      },
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        emergencyFund: {
          status: "oversaved",
          targetHKD: 180_000,
          targetMonths: 6,
          excessHKD: 200_000,
          opportunityCostHKD: 100_000,
        },
      }),
    });
    expect(oversaved.breakdown.emergencyFund).toBe(OVERSAVED_EF_SCORE);

    const redEf = computeFinancialRating({
      pyramid: weakPyramid,
      benchmarks: weakBenchmarks,
      stressTest: weakStress,
      crisis: severeCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "home",
            targetAge: 40,
            inflatedTargetHKD: 2_000_000,
            attainedAtAge: null,
            status: "red",
          },
        ],
        emergencyFund: {
          status: "red",
          targetHKD: 180_000,
          targetMonths: 6,
        },
      }),
    });
    expect(oversaved.breakdown.emergencyFund).toBeGreaterThan(
      redEf.breakdown.emergencyFund,
    );
  });

  it("rewards high coverage offset and no invested liquidation in crisisResilience", () => {
    const covered = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: {
        ...mildCrisis,
        crisisType: "medical",
        impactResult: makeImpactResult({
          crisisType: "medical",
          incomeHitPct: 0,
          coverage: {
            grossCostHKD: 100_000,
            coveredHKD: 80_000,
            uncoveredHKD: 20_000,
            coverageKind: "medical_percent",
            medicalCoveragePercent: 80,
          },
          cutOrder: {
            funAbsorbedHKD: 20_000,
            discretionaryAbsorbedHKD: 0,
            liquidAbsorbedHKD: 0,
            investedAbsorbedHKD: 0,
            remainingUncoveredHKD: 0,
          },
        }),
      },
      timeline: makeTimeline(),
    });

    expect(covered.breakdown.crisisResilience).toBeGreaterThan(
      computeFinancialRating({
        pyramid: weakPyramid,
        benchmarks: weakBenchmarks,
        stressTest: weakStress,
        crisis: severeCrisis,
        timeline: makeTimeline({
          goals: [
            {
              goalId: "home",
              targetAge: 40,
              inflatedTargetHKD: 2_000_000,
              attainedAtAge: null,
              status: "red",
            },
          ],
          emergencyFund: { status: "red", targetHKD: 180_000, targetMonths: 6 },
        }),
      }).breakdown.crisisResilience,
    );
  });

  it("scores low with no protection, no emergency fund, red goals, and harsh crisis", () => {
    const rating = computeFinancialRating({
      pyramid: weakPyramid,
      benchmarks: weakBenchmarks,
      stressTest: weakStress,
      crisis: severeCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "home",
            targetAge: 40,
            inflatedTargetHKD: 2_000_000,
            attainedAtAge: null,
            status: "red",
          },
          {
            goalId: "edu",
            targetAge: 45,
            inflatedTargetHKD: 800_000,
            attainedAtAge: null,
            status: "red",
          },
        ],
        emergencyFund: { status: "red", targetHKD: 180_000, targetMonths: 6 },
        retirement: {
          retirementAge: 65,
          passiveIncomeAtRetirement: 0,
          assetsAtRetirement: 0,
          assetsDepletedAtAge: 66,
        },
      }),
    });

    expect(rating.breakdown.protection).toBe(0);
    expect(rating.breakdown.emergencyFund).toBe(0);
    expect(rating.breakdown.goalsOnTrack).toBeLessThan(20);
    expect(rating.breakdown.crisisResilience).toBeLessThan(50);
    expect(rating.score).toBeLessThan(40);
    expect(rating.labelKey).toBe("needsAttention");
  });

  it("goal flags drive goalsOnTrack independent of retirement runway (v4)", () => {
    const sustained = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "wedding",
            targetAge: 40,
            inflatedTargetHKD: 220_000,
            attainedAtAge: 42,
            status: "amber",
          },
        ],
        retirement: {
          retirementAge: 65,
          passiveIncomeAtRetirement: 40_000,
          assetsAtRetirement: 1_000_000,
          assetsDepletedAtAge: null,
        },
      }),
    });
    // amber goals = 50; retirement readiness no longer blends in (v4)
    expect(sustained.breakdown.goalsOnTrack).toBe(
      Math.round(
        50 * GOALS_RETIREMENT_BLEND.goals +
          100 * GOALS_RETIREMENT_BLEND.retirement,
      ),
    );

    const earlyDeplete = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "wedding",
            targetAge: 40,
            inflatedTargetHKD: 220_000,
            attainedAtAge: 42,
            status: "amber",
          },
        ],
        retirement: {
          retirementAge: 65,
          passiveIncomeAtRetirement: 0,
          assetsAtRetirement: 50_000,
          assetsDepletedAtAge: 68,
        },
      }),
    });
    // Same goal flags → identical goalsOnTrack even with early depletion.
    expect(earlyDeplete.breakdown.goalsOnTrack).toBe(
      sustained.breakdown.goalsOnTrack,
    );
  });

  it("gives amber goals half credit on the goals share of goalsOnTrack", () => {
    const rating = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: {
        ...strongStress,
        goalProjections: [
          {
            ...strongStress.goalProjections[0]!,
            status: "amber",
            projectedYear: nowYear + 4,
          },
          {
            goalId: "other",
            label: bilingualBoth("Other"),
            icon: "Target",
            targetAmountHKD: 100_000,
            targetYear: nowYear + 5,
            projectedYear: nowYear + 5,
            status: "green",
          },
        ],
      },
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "wedding",
            targetAge: 40,
            inflatedTargetHKD: 220_000,
            attainedAtAge: 42,
            status: "amber",
          },
          {
            goalId: "other",
            targetAge: 45,
            inflatedTargetHKD: 100_000,
            attainedAtAge: 45,
            status: "green",
          },
        ],
      }),
    });

    // goals flags (0.5+1)/2 = 75; retirement 100 → 75*0.85 + 100*0.15 = 78.75 → 79
    expect(rating.breakdown.goalsOnTrack).toBe(
      Math.round(
        75 * GOALS_RETIREMENT_BLEND.goals +
          100 * GOALS_RETIREMENT_BLEND.retirement,
      ),
    );
  });

  it("scores given-up goals neutrally (not as red failures)", () => {
    const withGivenUp = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "wedding",
            targetAge: 40,
            inflatedTargetHKD: 220_000,
            attainedAtAge: 40,
            status: "green",
          },
        ],
      }),
      journey: {
        decisions: [
          {
            goalId: "yacht",
            status: "given_up",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
    });

    const asRedFailure = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "wedding",
            targetAge: 40,
            inflatedTargetHKD: 220_000,
            attainedAtAge: 40,
            status: "green",
          },
          {
            goalId: "yacht",
            targetAge: 50,
            inflatedTargetHKD: 2_000_000,
            attainedAtAge: null,
            status: "red",
          },
        ],
      }),
    });

    // (1 + 0.6) / 2 = 80 flags; retirement blend is gone in v4 → 80
    expect(withGivenUp.breakdown.goalsOnTrack).toBe(
      Math.round(
        ((1 + GIVEN_UP_GOAL_CREDIT) / 2) * 100 * GOALS_RETIREMENT_BLEND.goals +
          100 * GOALS_RETIREMENT_BLEND.retirement,
      ),
    );
    expect(withGivenUp.breakdown.goalsOnTrack).toBeGreaterThan(
      asRedFailure.breakdown.goalsOnTrack,
    );
  });

  it("scores every goal as a spend goal (no retirementTarget type in v4)", () => {
    const allGreen = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "nest",
            targetAge: 65,
            inflatedTargetHKD: 2_000_000,
            attainedAtAge: 65,
            status: "green",
          },
        ],
      }),
    });

    const allRed = computeFinancialRating({
      pyramid: strongPyramid,
      benchmarks: strongBenchmarks,
      stressTest: strongStress,
      crisis: mildCrisis,
      timeline: makeTimeline({
        goals: [
          {
            goalId: "nest",
            targetAge: 65,
            inflatedTargetHKD: 2_000_000,
            attainedAtAge: null,
            status: "red",
          },
        ],
      }),
    });

    expect(allGreen.breakdown.goalsOnTrack).toBe(100);
    expect(allRed.breakdown.goalsOnTrack).toBe(0);
    expect(allGreen.breakdown.goalsOnTrack).toBeGreaterThan(
      allRed.breakdown.goalsOnTrack,
    );
  });
});

describe("computeGoalImpactPoints", () => {
  it("scales with category weight and remaining gap", () => {
    expect(
      computeGoalImpactPoints("protection", 60, RATING_WEIGHTS.protection),
    ).toBe(15);
    expect(
      computeGoalImpactPoints("goalsOnTrack", 100, RATING_WEIGHTS.goalsOnTrack),
    ).toBe(30);
    expect(computeGoalImpactPoints("emergencyFund", 0, 0.25)).toBe(0);
  });

  it("boosts savings impact when EF is oversaved (redeploy excess lever)", () => {
    const plain = computeGoalImpactPoints("savings", 12, 0.25);
    const oversaved = computeGoalImpactPoints("savings", 12, 0.25, {
      efStatus: "oversaved",
      excessHKD: 200_000,
    });
    expect(oversaved).toBeGreaterThan(plain);
  });
});
