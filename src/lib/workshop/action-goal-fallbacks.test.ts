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
    ...overrides,
  };
}

function intervention(
  partial: Partial<RankedIntervention> &
    Pick<RankedIntervention, "category" | "impactPoints">,
): RankedIntervention {
  return {
    rank: 1,
    icon: "Shield",
    ...partial,
  };
}

describe("buildFallbackReasoning", () => {
  it("(a) PENETRATED payload → protection template includes affectedGoal and delayYears", () => {
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
      intervention({ category: "protection", impactPoints: 18.5 }),
      decisions,
    );

    expect(result.en).toContain("Wedding");
    expect(result.en).toContain("3");
    expect(result.en).toContain(formatCompactHkd(810_000));
    expect(result.en).toContain("+18.5");
    expect(result.en).toMatch(/critical illness/i);
    expect(result.zhHant).toContain("Wedding");
    expect(result.zhHant).toContain("3");
    expect(result.zhHant).not.toBe(result.en);
  });

  it("(b) missing crisisStressTest → else-branch / generic, no crash", () => {
    const withGap = buildFallbackReasoning(
      intervention({ category: "protection", impactPoints: 12, gap: 40 }),
      baseDecisions({ crisisStressTest: null }),
    );
    expect(withGap.en).toContain(formatCompactHkd(40));
    expect(withGap.en).toMatch(/protection layer/i);
    expect(withGap.zhHant.length).toBeGreaterThan(0);
    expect(withGap.zhHant).not.toBe(withGap.en);

    const generic = buildFallbackReasoning(
      intervention({ category: "protection", impactPoints: 12 }),
      baseDecisions({ crisisStressTest: null }),
    );
    expect(generic.en).toContain("+12");
    expect(generic.en).not.toMatch(/Step\s*\d+/i);
  });

  it("(c) zero surplus → investment else-branch", () => {
    const result = buildFallbackReasoning(
      intervention({
        category: "investment",
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
      }),
    );
    expect(result.en).toMatch(/accepted budget adjustments/i);
    expect(result.en).toContain("Conservative");
    expect(result.en).not.toMatch(/You have .+ in monthly surplus/);
    expect(result.zhHant).toContain("Conservative");
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
      expect(result.en).toContain("+7");
      expect(result.zhHant).toContain("+7");
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
        goal: intervention({ category: "protection", impactPoints: 15 }),
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
        goal: intervention({ category: "protection", impactPoints: 11, gap: 55 }),
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
        goal: intervention({ category: "goal", impactPoints: 9, icon: "Target" }),
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
      intervention({ category: "savings", impactPoints: 10, icon: "PiggyBank" }),
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
