import { describe, expect, it } from "vitest";

import {
  TOTAL_STEPS,
  WIZARD_STEPS,
} from "@/lib/workshop/wizard-steps";

describe("WorkshopWizard step model", () => {
  it("has exactly 7 steps without a standalone crisis screen", () => {
    expect(TOTAL_STEPS).toBe(7);
    expect([...WIZARD_STEPS]).toEqual([
      "intake",
      "pyramid",
      "expenses",
      "stresstest",
      "riskquiz",
      "summary",
      "capture",
    ]);
  });

  it("places summary immediately after riskquiz", () => {
    expect(WIZARD_STEPS.indexOf("riskquiz")).toBe(
      WIZARD_STEPS.indexOf("summary") - 1,
    );
  });
});
