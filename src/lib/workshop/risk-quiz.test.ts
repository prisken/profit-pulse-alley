import { describe, expect, it } from "vitest";

import {
  RISK_QUIZ_QUESTIONS,
  computeRiskProfile,
} from "@/lib/workshop/risk-quiz";
import type { RiskQuizAnswer } from "@/lib/workshop/types";

function answersAll(choice: "a" | "b" | "c"): RiskQuizAnswer[] {
  return RISK_QUIZ_QUESTIONS.map((q) => ({
    questionId: q.id,
    choice,
  }));
}

describe("computeRiskProfile", () => {
  it("maps all-conservative (a) answers to conservative", () => {
    const result = computeRiskProfile(answersAll("a"));
    expect(result.score).toBe(0);
    expect(result.profile).toBe("conservative");
  });

  it("maps all-aggressive (c) answers to aggressive", () => {
    const result = computeRiskProfile(answersAll("c"));
    expect(result.score).toBe(100);
    expect(result.profile).toBe("aggressive");
  });

  it("maps a mid-range mix to balanced", () => {
    // Raw points: 0+1+1+1+2 = 5 → 50/100 → balanced (41–70)
    const mixed: RiskQuizAnswer[] = [
      { questionId: "windfall", choice: "a" },
      { questionId: "market_drop", choice: "b" },
      { questionId: "job_type", choice: "b" },
      { questionId: "dependents", choice: "b" },
      { questionId: "emergency_feel", choice: "c" },
    ];
    const result = computeRiskProfile(mixed);
    expect(result.score).toBe(50);
    expect(result.profile).toBe("balanced");
  });

  it("rejects incomplete answer sets", () => {
    expect(() =>
      computeRiskProfile([{ questionId: "windfall", choice: "a" }]),
    ).toThrow(/exactly 5/);
  });
});
