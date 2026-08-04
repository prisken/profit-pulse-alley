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
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { callDeepSeekParsed } from "@/lib/workshop/deepseek-client";
import { prisma } from "@/lib/prisma";
import {
  buildDeterministicPyramidGuess,
  generateCrisisAction,
  predictPyramidAction,
} from "@/lib/workshop/pyramid-actions";

const mockedParsed = vi.mocked(callDeepSeekParsed);
const mockedCreate = vi.mocked(prisma.workshopSession.create);

const predictInput = {
  age: 32,
  monthlyIncome: 45_000,
  industry: "finance",
  householdStatus: "marriedNoKids",
  tone: "professional" as const,
};

function sampleParsedPyramid() {
  return {
    pyramid: {
      protection: {
        medicalCoveragePercent: 70,
        criticalIllnessAmountHKD: 300_000,
      },
      emergencyFund: { savedAmountHKD: 80_000 },
      goals: {
        goals: [
          {
            id: "home",
            icon: "Home",
            label: { en: "Home", zhHant: "置業" },
            targetAmountHKD: 2_000_000,
            targetYear: 2030,
          },
          {
            id: "retire",
            icon: "PiggyBank",
            label: { en: "Retirement", zhHant: "退休" },
            targetAmountHKD: 4_000_000,
            targetYear: 2055,
          },
        ],
      },
      investment: {
        riskAllocation: { low: 30, mid: 50, high: 20 },
        monthlyInvestmentHKD: 8_000,
        monthlyFunHKD: 2_000,
      },
    },
    rationale: {
      en: "Coverage looks typical for this profile.",
      zhHant: "以這個背景來說，保障水平屬常見水平。",
    },
  };
}

describe("pyramid AI bilingual validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreate.mockResolvedValue({ id: "session_test" } as never);
  });

  it("predictPyramidAction persists a valid bilingual AI pyramid", async () => {
    mockedParsed.mockResolvedValue(sampleParsedPyramid());

    const result = await predictPyramidAction(predictInput);
    expect(result.sessionId).toBe("session_test");
    expect(result.rationale.zhHant).toContain("保障");
    expect(mockedCreate).toHaveBeenCalledOnce();
  });

  it("predictPyramidAction falls back when AI bilingual parse keeps failing", async () => {
    mockedParsed.mockRejectedValue(
      new Error(
        'Invalid bilingual "rationale.zhHant": Traditional Chinese text is missing or empty.',
      ),
    );

    const result = await predictPyramidAction(predictInput);
    expect(result.sessionId).toBe("session_test");
    expect(result.rationale.zhHant).toContain("本地估算");
    expect(mockedCreate).toHaveBeenCalledOnce();
  });

  it("generateCrisisAction rejects title missing zhHant with a clear field error", async () => {
    vi.mocked(prisma.workshopSession.findUnique).mockResolvedValue({
      id: "session_test",
    } as never);
    vi.mocked(prisma.workshopSession.update).mockResolvedValue({
      id: "session_test",
    } as never);

    mockedParsed.mockRejectedValue(
      new Error(
        'Invalid bilingual "title.zhHant": Traditional Chinese text is missing or empty.',
      ),
    );

    await expect(
      generateCrisisAction("session_test", {
        age: 32,
        monthlyIncome: 45_000,
        industry: "finance",
        householdStatus: "marriedNoKids",
        riskProfile: "balanced",
        tone: "professional",
      }),
    ).rejects.toThrow(/title\.zhHant/);
  });
});

describe("buildDeterministicPyramidGuess", () => {
  it("returns a complete bilingual pyramid under recommended benchmarks", () => {
    const { pyramid, rationale } = buildDeterministicPyramidGuess({
      age: 40,
      monthlyIncome: 25_000,
      industry: "finance",
    });
    expect(pyramid.goals.goals.length).toBeGreaterThanOrEqual(2);
    expect(rationale.en.length).toBeGreaterThan(10);
    expect(rationale.zhHant.length).toBeGreaterThan(10);
    expect(
      pyramid.investment.riskAllocation.low +
        pyramid.investment.riskAllocation.mid +
        pyramid.investment.riskAllocation.high,
    ).toBe(100);
  });
});
