import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/workshop/deepseek-client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/workshop/deepseek-client")>();
  return {
    ...actual,
    callDeepSeekParsed: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workshopSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { callDeepSeekParsed } from "@/lib/workshop/deepseek-client";
import { prisma } from "@/lib/prisma";
import { generateActionGoalsAction } from "@/lib/workshop/pyramid-actions";
import type {
  ExpensesState,
  PyramidState,
  StressTestResult,
} from "@/lib/workshop/types";

const mockedParsed = vi.mocked(callDeepSeekParsed);
const mockedFind = vi.mocked(prisma.workshopSession.findUnique);
const mockedUpdate = vi.mocked(prisma.workshopSession.update);

const pyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 0,
    criticalIllnessAmountHKD: 0,
  },
  emergencyFund: { savedAmountHKD: 20_000 },
  goals: {
    goals: [
      {
        id: "wedding",
        icon: "Heart",
        label: { en: "Wedding", zhHant: "婚禮" },
        targetAmountHKD: 200_000,
        targetAge: 38,
        targetYear: 2029,
        goalType: "spend",
      },
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 50_000,
    monthlyInvestmentHKD: 2_000,
    monthlyFunHKD: 1_000,
  },
};

const expenses: ExpensesState = {
  totalHKD: 25_000,
  categories: [
    { key: "housing", icon: "Home", amountHKD: 12_000 },
    { key: "food_living", icon: "Utensils", amountHKD: 5_000 },
    { key: "transport", icon: "Bus", amountHKD: 2_000 },
    { key: "insurance", icon: "Shield", amountHKD: 1_000 },
    { key: "discretionary", icon: "Sparkles", amountHKD: 5_000 },
  ],
};

const stressTest: StressTestResult = {
  monthlySurplusByYear: [
    { year: 1, income: 50_000, expenses: 25_000, surplus: 25_000 },
  ],
  emergencyFundProjection: {
    targetMonths: 6,
    projectedMonths: 1,
    status: "red",
  },
  goalProjections: [
    {
      goalId: "wedding",
      label: { en: "Wedding", zhHant: "婚禮" },
      icon: "Heart",
      targetAmountHKD: 200_000,
      targetYear: 2029,
      projectedYear: null,
      status: "red",
    },
  ],
};

describe("generateActionGoalsAction fallback after impactPoints mismatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFind.mockResolvedValue({
      id: "session_fallback",
      age: 35,
      industry: "Healthcare",
      monthlyIncome: 50_000,
      retirementAge: 65,
      macroResultJson: null,
      goalJourneyJson: {
        decisions: [
          {
            goalId: "wedding",
            status: "applied",
            allowLiquidation: true,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date(0).toISOString(),
      },
      crisisJson: null,
      riskQuizJson: {
        answers: [],
        score: 40,
        profile: "aggressive",
      },
      expensesJson: expenses,
    } as never);
    mockedUpdate.mockResolvedValue({ id: "session_fallback" } as never);
  });

  it("renders 3 complete bilingual cards and logs a structured fallback event", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    // callDeepSeekParsed already exhausted its internal retry — surface the
    // validation failure once so generateActionGoalsAction uses templates.
    mockedParsed.mockRejectedValue(
      new Error(
        "Invalid action goals response: impactPoints mismatch at rank 1 (got 99, expected 18.5).",
      ),
    );

    const summary = await generateActionGoalsAction("session_fallback", {
      tone: "professional",
      pyramid,
      benchmarks: {
        medicalCoveragePercent: 80,
        criticalIllnessAmountHKD: 800_000,
        emergencyFundTargetMonths: 6,
        emergencyFundTargetHKD: 180_000,
      },
      stressTest,
      expenses,
      monthlyIncome: 50_000,
      age: 35,
      industry: "Healthcare",
    });

    expect(summary.actionGoals).toHaveLength(3);
    for (const goal of summary.actionGoals) {
      expect(goal.title.en.trim().length).toBeGreaterThan(0);
      expect(goal.title.zhHant.trim().length).toBeGreaterThan(0);
      expect(goal.reasoning.en.trim().length).toBeGreaterThan(0);
      expect(goal.reasoning.zhHant.trim().length).toBeGreaterThan(0);
      expect(goal.reasoning.zhHant).not.toBe(goal.reasoning.en);
      expect(goal.impactPoints).toBeTypeOf("number");
      expect(goal.reasoning.en).not.toMatch(/\bStep\s*\d+\b/i);
      // Same card shape the Summary CollapsibleWidgets expect.
      expect(goal).toEqual(
        expect.objectContaining({
          rank: expect.any(Number),
          category: expect.any(String),
          icon: expect.any(String),
          impactPoints: expect.any(Number),
          title: expect.objectContaining({ en: expect.any(String), zhHant: expect.any(String) }),
          reasoning: expect.objectContaining({
            en: expect.any(String),
            zhHant: expect.any(String),
          }),
        }),
      );
    }

    const logLine = infoSpy.mock.calls
      .map((args) => String(args[0] ?? ""))
      .find((line) => line.includes("workshop.action_goals.fallback"));
    expect(logLine).toBeTruthy();
    const parsed = JSON.parse(logLine!);
    expect(parsed).toMatchObject({
      event: "workshop.action_goals.fallback",
      sessionId: "session_fallback",
      ranks: [1, 2, 3],
    });
    expect(parsed.reason).toMatch(/impactPoints mismatch/i);
    expect(Array.isArray(parsed.categories)).toBe(true);
    expect(parsed.categories).toHaveLength(3);

    expect(mockedUpdate).toHaveBeenCalledOnce();
    const updateArg = mockedUpdate.mock.calls[0]![0] as {
      data: { goalsJson: unknown };
    };
    const persisted = updateArg.data.goalsJson as {
      actionGoals: unknown[];
    };
    expect(persisted.actionGoals).toHaveLength(3);

    infoSpy.mockRestore();
  });
});
