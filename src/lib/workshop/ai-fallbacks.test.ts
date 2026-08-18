import { describe, expect, it } from "vitest";

import {
  buildDeterministicPyramidGuess,
  buildDeterministicSqueezeReasoning,
} from "@/lib/workshop/ai-fallbacks";

describe("buildDeterministicPyramidGuess investment", () => {
  it("produces lumpSumHKD and monthlyInvestmentHKD (~15% of income, /500)", () => {
    const { pyramid } = buildDeterministicPyramidGuess({
      age: 35,
      monthlyIncome: 50_000,
      industry: "Tech",
      retirementAge: 65,
    });

    expect(pyramid.investment.lumpSumHKD).toBeGreaterThan(0);
    expect(
      pyramid.goals.goals.every((g) => g.targetAge > 0 && g.targetAmountHKD > 0),
    ).toBe(true);
  });

  it("scales lump sum with longer saving runway", () => {
    const short = buildDeterministicPyramidGuess({
      age: 55,
      monthlyIncome: 50_000,
      industry: "Tech",
      retirementAge: 60,
    }).pyramid.investment.lumpSumHKD;

    const long = buildDeterministicPyramidGuess({
      age: 30,
      monthlyIncome: 50_000,
      industry: "Tech",
      retirementAge: 65,
    }).pyramid.investment.lumpSumHKD;

    expect(long).toBeGreaterThan(short);
  });

  it("always returns bilingual CI and EF formula explanations", () => {
    const {
      protectionExplanation,
      emergencyFundExplanation,
    } = buildDeterministicPyramidGuess({
      age: 35,
      monthlyIncome: 40_000,
      industry: "Tech",
    });
    expect(protectionExplanation.en).toMatch(/critical-illness|×/i);
    expect(protectionExplanation.zhHant.length).toBeGreaterThan(10);
    expect(emergencyFundExplanation.en).toMatch(/months|emergency/i);
    expect(emergencyFundExplanation.zhHant.length).toBeGreaterThan(10);
  });
});

describe("buildDeterministicSqueezeReasoning", () => {
  it("interpolates cut amounts and achievable age", () => {
    const note = buildDeterministicSqueezeReasoning({
      funCutMonthlyHKD: 2_000,
      discretionaryCutMonthlyHKD: 1_000,
      achievableAtAge: 37,
      partial: false,
    });
    expect(note.en).toMatch(/2,000/);
    expect(note.en).toMatch(/1,000/);
    expect(note.en).toMatch(/37/);
    expect(note.zhHant).toMatch(/37/);
  });

  it("states partial caps honestly", () => {
    const note = buildDeterministicSqueezeReasoning({
      funCutMonthlyHKD: 1_000,
      discretionaryCutMonthlyHKD: 0,
      achievableAtAge: 41,
      partial: true,
    });
    expect(note.en.toLowerCase()).toMatch(/cannot fully|alone cannot/);
    expect(note.zhHant).toMatch(/不足以|缺口/);
  });
});
