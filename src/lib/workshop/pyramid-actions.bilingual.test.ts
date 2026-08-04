import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/workshop/deepseek-client", () => ({
  callDeepSeek: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workshopSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { callDeepSeek } from "@/lib/workshop/deepseek-client";
import { prisma } from "@/lib/prisma";
import {
  generateCrisisAction,
  predictPyramidAction,
} from "@/lib/workshop/pyramid-actions";

const mockedDeepSeek = vi.mocked(callDeepSeek);
const mockedCreate = vi.mocked(prisma.workshopSession.create);

const predictInput = {
  age: 32,
  monthlyIncome: 45_000,
  industry: "finance",
  householdStatus: "marriedNoKids",
  tone: "professional" as const,
};

function samplePyramidAi(overrides: Record<string, unknown> = {}) {
  return {
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
    rationale: {
      en: "Coverage looks typical for this profile.",
      zhHant: "以這個背景來說，保障水平屬常見水平。",
    },
    ...overrides,
  };
}

describe("pyramid AI bilingual validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreate.mockResolvedValue({ id: "session_test" } as never);
  });

  it("predictPyramidAction rejects rationale missing zhHant with a clear field error", async () => {
    mockedDeepSeek.mockResolvedValue(
      JSON.stringify(
        samplePyramidAi({
          rationale: { en: "English only rationale" },
        }),
      ),
    );

    await expect(predictPyramidAction(predictInput)).rejects.toThrow(
      /rationale\.zhHant/,
    );
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("predictPyramidAction rejects goal label missing zhHant with a clear field error", async () => {
    mockedDeepSeek.mockResolvedValue(
      JSON.stringify(
        samplePyramidAi({
          goals: {
            goals: [
              {
                id: "home",
                icon: "Home",
                label: { en: "Home" },
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
        }),
      ),
    );

    await expect(predictPyramidAction(predictInput)).rejects.toThrow(
      /goals\.goals\[0\]\.label\.zhHant/,
    );
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("generateCrisisAction rejects title missing zhHant with a clear field error", async () => {
    vi.mocked(prisma.workshopSession.findUnique).mockResolvedValue({
      id: "session_test",
    } as never);
    vi.mocked(prisma.workshopSession.update).mockResolvedValue({
      id: "session_test",
    } as never);

    mockedDeepSeek.mockResolvedValue(
      JSON.stringify({
        title: { en: "Industry shock only" },
        description: {
          en: "A short description.",
          zhHant: "一段簡短說明。",
        },
        monthlyIncomeImpactPercent: 40,
        oneTimeCostHKD: 50_000,
        durationMonths: 6,
        impacts: [
          {
            layer: "emergencyFund",
            icon: "PiggyBank",
            headline: { en: "Cash short", zhHant: "現金不足" },
            detailMonths: 3,
          },
          {
            layer: "goals",
            icon: "Target",
            headline: { en: "Goals delayed", zhHant: "目標延期" },
            detailMonths: 12,
          },
        ],
      }),
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
