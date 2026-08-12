import { describe, expect, it } from "vitest";

import {
  MACRO_RESULT_VERSION_LIFE_TIMELINE,
  parseMacroResultJson,
  stressTestFromMacroResult,
  timelineToLegacyStressTest,
} from "@/lib/workshop/macro-result";
import { runLifeTimeline } from "@/lib/workshop/timeline-engine";
import type { PyramidState } from "@/lib/workshop/types";

const NOW_YEAR = 2026;

const pyramid: PyramidState = {
  protection: { medicalCoveragePercent: 80, criticalIllnessAmountHKD: 500_000 },
  emergencyFund: { savedAmountHKD: 120_000 },
  goals: {
    goals: [
      {
        id: "wedding",
        icon: "Heart",
        label: { en: "Wedding", zhHant: "婚禮" },
        targetAmountHKD: 150_000,
        targetAge: 40,
        targetYear: NOW_YEAR + 5,
      },
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 200_000,
  },
};

describe("macro-result versioning", () => {
  it("round-trips a lifeTimeline payload", () => {
    const timeline = runLifeTimeline({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 50_000,
      monthlyExpenses: 20_000,
      emergencyFundSavedHKD: 120_000,
      investment: {
        lumpSumHKD: 200_000,
        allocation: { low: 40, mid: 40, high: 20 },
      },
      goals: pyramid.goals.goals,
      industry: "Tech",
      nowYear: NOW_YEAR,
    });

    const stored = {
      version: MACRO_RESULT_VERSION_LIFE_TIMELINE,
      timeline,
      notes: [
        {
          id: "emergencyFund",
          note: { en: "Note", zhHant: "說明" },
        },
      ],
    };

    const parsed = parseMacroResultJson(stored);
    expect(parsed?.kind).toBe("lifeTimeline");
    if (parsed?.kind !== "lifeTimeline") {
      return;
    }
    expect(parsed.timeline.rows.length).toBe(timeline.rows.length);
    expect(parsed.notes).toHaveLength(1);

    const legacy = stressTestFromMacroResult(stored, pyramid);
    expect(legacy).not.toBeNull();
    expect(legacy!.goalProjections[0]?.goalId).toBe("wedding");
    expect(legacy!.goalProjections[0]?.label.zhHant).toBe("婚禮");
  });

  it("parses legacy StressTestResult without crashing", () => {
    const legacyBlob = {
      monthlySurplusByYear: [
        { year: 1, income: 100, expenses: 80, surplus: 20 },
      ],
      emergencyFundProjection: {
        targetMonths: 6,
        projectedMonths: 12,
        status: "amber",
      },
      goalProjections: [
        {
          goalId: "g1",
          label: { en: "Trip", zhHant: "旅行" },
          icon: "Plane",
          targetAmountHKD: 50_000,
          targetYear: 2030,
          projectedYear: 2031,
          status: "amber",
        },
      ],
      notes: [],
    };

    const parsed = parseMacroResultJson(legacyBlob);
    expect(parsed?.kind).toBe("legacy");
    expect(stressTestFromMacroResult(legacyBlob, pyramid)?.goalProjections).toHaveLength(
      1,
    );
  });

  it("maps oversaved EF to amber in the legacy bridge", () => {
    const timeline = runLifeTimeline({
      age: 35,
      retirementAge: 65,
      monthlyIncome: 50_000,
      monthlyExpenses: 20_000,
      emergencyFundSavedHKD: 300_000,
      investment: {
        lumpSumHKD: 0,
        allocation: { low: 100, mid: 0, high: 0 },
      },
      goals: [],
      industry: "Tech",
      nowYear: NOW_YEAR,
    });
    expect(timeline.emergencyFund.status).toBe("oversaved");
    const legacy = timelineToLegacyStressTest(timeline, pyramid);
    expect(legacy.emergencyFundProjection.status).toBe("amber");
    expect(legacy.emergencyFundProjection.projectedMonths).toBe(0);
  });
});
