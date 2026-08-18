import { describe, expect, it } from "vitest";

import {
  buildFallbackReasoning,
  type DecisionsPayload,
  type RankedIntervention,
} from "@/lib/workshop/action-goal-fallbacks";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";

function baseDecisions(
  overrides?: Partial<DecisionsPayload>,
): DecisionsPayload {
  return {
    goalsApplied: [],
    goalsGivenUp: [],
    squeezesAccepted: [],
    squeezesRejected: [],
    postJourneyState: {
      remainingMonthlySurplus: 8_000,
      emergencyFundMonthsRemaining: 4,
      investmentBalanceRemaining: 200_000,
    },
    crisisStressTest: {
      scenario: "medical",
      verdict: "PARTIAL",
      penetrationAmount: 120_000,
      affectedGoal: null,
      delayYears: null,
    },
    riskQuizProfile: "Balanced",
    profileBehaviorMismatch: false,
    runway: { beforeAge: 63, afterAge: 81 },
    ...overrides,
  };
}

function intervention(
  partial: Partial<RankedIntervention> &
    Pick<RankedIntervention, "category" | "impactPoints">,
): RankedIntervention {
  return {
    rank: 1,
    leverType: "instant",
    icon: "Shield",
    ...partial,
  };
}

describe("buildFallbackReasoning", () => {
  it("(a) structural + PENETRATED payload → protection template includes affectedGoal and delayYears", () => {
    const decisions = baseDecisions({
      crisisStressTest: {
        scenario: "critical_illness",
        verdict: "PENETRATED",
        penetrationAmount: 810_000,
        affectedGoal: "Wedding",
        delayYears: 3,
      },
    });
    const result = buildFallbackReasoning(
      intervention({
        category: "protection",
        leverType: "structural",
        impactPoints: 18.5,
      }),
      decisions,
    );

    expect(result.en).toContain("Wedding");
    expect(result.en).toContain("3");
    expect(result.en).toContain(formatCompactHkd(810_000));
    expect(result.en).toMatch(/critical illness/i);
    expect(result.zhHant).toContain("Wedding");
    expect(result.zhHant).toContain("3");
    expect(result.zhHant).not.toBe(result.en);
  });

  it("(b) structural + missing crisisStressTest → gap else-branch / generic, no crash", () => {
    const withGap = buildFallbackReasoning(
      intervention({
        category: "protection",
        leverType: "structural",
        impactPoints: 12,
        gap: 40,
      }),
      baseDecisions({ crisisStressTest: null }),
    );
    expect(withGap.en).toContain(formatCompactHkd(40));
    expect(withGap.en).toMatch(/protection/i);
    expect(withGap.zhHant.length).toBeGreaterThan(0);
    expect(withGap.zhHant).not.toBe(withGap.en);

    const generic = buildFallbackReasoning(
      intervention({
        category: "protection",
        leverType: "structural",
        impactPoints: 12,
      }),
      baseDecisions({ crisisStressTest: null }),
    );
    expect(generic.en).not.toMatch(/Step\s*\d+/i);
  });

  it("(c) behavioral + zero surplus but an applied goal → cites the protected goal and runway", () => {
    const result = buildFallbackReasoning(
      intervention({
        category: "investment",
        leverType: "behavioral",
        impactPoints: 9,
        icon: "TrendingUp",
      }),
      baseDecisions({
        postJourneyState: {
          remainingMonthlySurplus: 0,
          emergencyFundMonthsRemaining: 5,
          investmentBalanceRemaining: 100_000,
        },
        riskQuizProfile: "Conservative",
        goalsApplied: [
          {
            name: "Wedding",
            targetAge: 38,
            usedLiquidation: false,
            liquidationSource: null,
          },
        ],
        runway: { beforeAge: 63, afterAge: 81 },
      }),
    );
    expect(result.en).toMatch(/keeping Wedding on track/i);
    expect(result.en).not.toMatch(/You have .+ in monthly surplus/);
    expect(result.zhHant).toContain("Wedding");
    expect(result.zhHant).not.toBe(result.en);
  });

  it("(d) all-nulls payload → final generic lines render in both languages", () => {
    const decisions: DecisionsPayload = {
      goalsApplied: [],
      goalsGivenUp: [],
      squeezesAccepted: [],
      squeezesRejected: [],
      postJourneyState: {
        remainingMonthlySurplus: null,
        emergencyFundMonthsRemaining: null,
        investmentBalanceRemaining: null,
      },
      crisisStressTest: null,
      riskQuizProfile: null,
      profileBehaviorMismatch: false,
      runway: null,
    };

    for (const category of [
      "protection",
      "savings",
      "investment",
      "goal",
    ] as const) {
      const result = buildFallbackReasoning(
        intervention({ category, impactPoints: 7, icon: "Circle" }),
        decisions,
      );
      expect(result.en.length).toBeGreaterThan(20);
      expect(result.zhHant.length).toBeGreaterThan(10);
      expect(result.zhHant).not.toBe(result.en);
      expect(result.en).not.toMatch(/Step\s*\d+/i);
      expect(result.en).not.toMatch(/gave up|given.?up/i);
      expect(result.en).not.toMatch(/mismatch/i);
    }
  });

  it("(e) zhHant output present and non-identical to en for every branch", () => {
    const branches: Array<{
      goal: RankedIntervention;
      decisions: DecisionsPayload;
    }> = [
      {
        goal: intervention({
          category: "protection",
          leverType: "structural",
          impactPoints: 15,
        }),
        decisions: baseDecisions({
          crisisStressTest: {
            scenario: "medical",
            verdict: "PENETRATED",
            penetrationAmount: 200_000,
            affectedGoal: "Home Deposit",
            delayYears: 2,
          },
        }),
      },
      {
        goal: intervention({
          category: "protection",
          leverType: "structural",
          impactPoints: 11,
          gap: 55,
        }),
        decisions: baseDecisions({
          crisisStressTest: {
            scenario: "medical",
            verdict: "SHIELDED",
            penetrationAmount: null,
            affectedGoal: null,
            delayYears: null,
          },
        }),
      },
      {
        goal: intervention({
          category: "savings",
          leverType: "instant",
          impactPoints: 14,
          icon: "PiggyBank",
        }),
        decisions: baseDecisions({
          postJourneyState: {
            remainingMonthlySurplus: 1_000,
            emergencyFundMonthsRemaining: 1.5,
            investmentBalanceRemaining: 50_000,
          },
        }),
      },
      {
        goal: intervention({
          category: "savings",
          leverType: "instant",
          impactPoints: 8,
          icon: "PiggyBank",
        }),
        decisions: baseDecisions({
          postJourneyState: {
            remainingMonthlySurplus: 1_000,
            emergencyFundMonthsRemaining: 4.2,
            investmentBalanceRemaining: 50_000,
          },
        }),
      },
      {
        goal: intervention({
          category: "investment",
          leverType: "behavioral",
          impactPoints: 10,
          icon: "TrendingUp",
        }),
        decisions: baseDecisions({
          postJourneyState: {
            remainingMonthlySurplus: 12_000,
            emergencyFundMonthsRemaining: 6,
            investmentBalanceRemaining: 300_000,
          },
          riskQuizProfile: "Aggressive",
        }),
      },
      {
        goal: intervention({
          category: "investment",
          leverType: "behavioral",
          impactPoints: 6,
          icon: "TrendingUp",
        }),
        decisions: baseDecisions({
          postJourneyState: {
            remainingMonthlySurplus: 0,
            emergencyFundMonthsRemaining: 6,
            investmentBalanceRemaining: 300_000,
          },
          riskQuizProfile: "Balanced",
        }),
      },
      {
        goal: intervention({
          category: "goal",
          leverType: "behavioral",
          impactPoints: 9,
          icon: "Target",
        }),
        decisions: baseDecisions({
          goalsApplied: [
            {
              name: "Wedding",
              targetAge: 38,
              usedLiquidation: false,
              liquidationSource: null,
            },
          ],
        }),
      },
    ];

    for (const branch of branches) {
      const result = buildFallbackReasoning(branch.goal, branch.decisions);
      expect(result.zhHant.trim().length).toBeGreaterThan(0);
      expect(result.zhHant).not.toBe(result.en);
    }
  });

  it("never references goalsGivenUp or profileBehaviorMismatch", () => {
    const result = buildFallbackReasoning(
      intervention({
        category: "savings",
        leverType: "instant",
        impactPoints: 10,
        icon: "PiggyBank",
      }),
      baseDecisions({
        goalsGivenUp: [{ name: "Education", targetAge: 45 }],
        profileBehaviorMismatch: true,
        postJourneyState: {
          remainingMonthlySurplus: 2_000,
          emergencyFundMonthsRemaining: 2,
          investmentBalanceRemaining: 10_000,
        },
      }),
    );
    expect(result.en).not.toContain("Education");
    expect(result.zhHant).not.toContain("Education");
    expect(result.en).not.toMatch(/mismatch|quiz profile|inconsistent/i);
  });
});

describe("goal stress signal (v5.3)", () => {
  it("calls out a late goal (retirement fund lands at 69 vs target 65)", () => {
    const decisions = baseDecisions({
      goalsApplied: [
        {
          name: "Retirement Comfort",
          targetAge: 65,
          usedLiquidation: false,
          liquidationSource: null,
        },
      ],
      goalOutlooks: [
        {
          name: "Retirement Comfort",
          targetAge: 65,
          attainedAge: 69,
          delayYears: 4,
          requiredExtraMonthlyHKD: 8_000,
          monthlySurplus: 10_000,
          effortRatio: 0.8,
          late: true,
          heavyMonthlyCommitment: true,
        },
      ],
    });
    const result = buildFallbackReasoning(
      intervention({
        category: "goal",
        leverType: "behavioral",
        impactPoints: 9,
        icon: "Target",
      }),
      decisions,
    );
    expect(result.en).toMatch(/Retirement Comfort/);
    expect(result.en).toMatch(/69/);
    expect(result.en).toMatch(/4 years late/);
    expect(result.zhHant).toMatch(/69/);
    expect(result.zhHant).not.toBe(result.en);
  });

  it("flags a heavy monthly commitment even when on time", () => {
    const decisions = baseDecisions({
      goalOutlooks: [
        {
          name: "Kids Education",
          targetAge: 50,
          attainedAge: 50,
          delayYears: 0,
          requiredExtraMonthlyHKD: 6_000,
          monthlySurplus: 8_000,
          effortRatio: 0.75,
          late: false,
          heavyMonthlyCommitment: true,
        },
      ],
    });
    const result = buildFallbackReasoning(
      intervention({
        category: "goal",
        leverType: "behavioral",
        impactPoints: 9,
        icon: "Target",
      }),
      decisions,
    );
    expect(result.en).toMatch(/Kids Education/);
    expect(result.en).toMatch(/75%/);
  });

  it("keeps every fallback within word limits (≤40 EN words / ≤70 zh chars)", () => {
    const cases = [
      intervention({ category: "protection", leverType: "structural", impactPoints: 12, gap: 40 }),
      intervention({ category: "protection", leverType: "structural", impactPoints: 12 }),
      intervention({ category: "savings", leverType: "instant", impactPoints: 10, icon: "PiggyBank" }),
      intervention({ category: "investment", leverType: "behavioral", impactPoints: 9, icon: "TrendingUp" }),
      intervention({ category: "goal", leverType: "behavioral", impactPoints: 9, icon: "Target" }),
      intervention({ category: "goal", leverType: "instant", impactPoints: 7, icon: "Target" }),
    ];
    const decisions = baseDecisions({
      goalsApplied: [
        {
          name: "Wedding",
          targetAge: 38,
          usedLiquidation: false,
          liquidationSource: null,
        },
      ],
      goalOutlooks: [
        {
          name: "Wedding",
          targetAge: 38,
          attainedAge: 41,
          delayYears: 3,
          requiredExtraMonthlyHKD: 2_000,
          monthlySurplus: 8_000,
          effortRatio: 0.25,
          late: true,
          heavyMonthlyCommitment: false,
        },
      ],
    });
    for (const goal of cases) {
      const result = buildFallbackReasoning(goal, decisions);
      expect(result.en.trim().split(/\s+/).length).toBeLessThanOrEqual(45);
      expect(result.zhHant.trim().length).toBeLessThanOrEqual(75);
    }
  });
});

describe("data gaps / refine note (v5.4)", () => {
  it("appends a refine ask when a matching input is missing", () => {
    const decisions = baseDecisions({
      dataGaps: [
        {
          key: "medicalCoverage",
          label: { en: "medical coverage", zhHant: "醫療保障" },
          severity: "high",
        },
      ],
    });
    const result = buildFallbackReasoning(
      intervention({
        category: "protection",
        leverType: "structural",
        impactPoints: 12,
        gap: 40,
      }),
      decisions,
    );
    expect(result.en).toMatch(/Tell us your actual medical coverage/);
    expect(result.zhHant).toMatch(/醫療保障/);
    // Still within word limits with the refine sentence.
    expect(result.en.trim().split(/\s+/).length).toBeLessThanOrEqual(50);
    // Refine must never mention step numbers.
    expect(result.en).not.toMatch(/Step\s*\d+/i);
  });

  it("does not append a refine ask when no matching gap exists", () => {
    const decisions = baseDecisions({
      dataGaps: [
        {
          key: "lumpSum",
          label: { en: "invested capital", zhHant: "已投資本金" },
          severity: "medium",
        },
      ],
    });
    const result = buildFallbackReasoning(
      intervention({
        category: "protection",
        leverType: "structural",
        impactPoints: 12,
        gap: 40,
      }),
      decisions,
    );
    expect(result.en).not.toMatch(/Tell us your actual/);
  });
});
