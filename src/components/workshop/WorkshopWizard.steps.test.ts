import { describe, expect, it } from "vitest";

import {
  TOTAL_STEPS,
  WIZARD_STEPS,
} from "@/lib/workshop/wizard-steps";

describe("WorkshopWizard step model", () => {
  it("has exactly 8 steps with riskquiz and crisis as separate states", () => {
    expect(TOTAL_STEPS).toBe(8);
    expect([...WIZARD_STEPS]).toEqual([
      "intake",
      "pyramid",
      "expenses",
      "stresstest",
      "riskquiz",
      "crisis",
      "summary",
      "capture",
    ]);
  });

  it("places riskquiz immediately before crisis", () => {
    expect(WIZARD_STEPS.indexOf("riskquiz")).toBe(
      WIZARD_STEPS.indexOf("crisis") - 1,
    );
  });
});
