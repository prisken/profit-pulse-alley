import { describe, expect, it } from "vitest";

import {
  validateCardPublishable,
  validateMarketPulseCardForm,
} from "@/lib/market-pulse/card-validation";
import { DEFAULT_CARD_FORM_VALUES } from "@/lib/market-pulse/card-validation";

const baseValues = {
  ...DEFAULT_CARD_FORM_VALUES,
  cycleId: "cycle-1",
  dayIndex: 1,
  companyName: "Acme Corp",
  ticker: "ACME",
  headline: "Earnings beat expectations",
};

describe("validateMarketPulseCardForm", () => {
  it("requires core fields", () => {
    const result = validateMarketPulseCardForm({
      ...DEFAULT_CARD_FORM_VALUES,
      cycleId: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.cycleId).toBeTruthy();
    expect(result.errors.companyName).toBeTruthy();
  });

  it("requires unique day index within cycle", () => {
    const result = validateMarketPulseCardForm(baseValues, {
      existingDayIndexes: [1, 2],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.dayIndex).toMatch(/unique/i);
  });

  it("requires PPA for READY status", () => {
    const result = validateMarketPulseCardForm({
      ...baseValues,
      status: "READY",
      ppaSignal: "",
      ppaInsight: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.ppaSignal).toBeTruthy();
    expect(result.errors.ppaInsight).toBeTruthy();
  });
});

describe("validateCardPublishable", () => {
  it("requires locked PPA", () => {
    const error = validateCardPublishable({
      headline: "News",
      companyName: "Acme",
      ticker: "ACME",
      ppaSignal: "BULLISH",
      ppaInsight: "Strong outlook",
      ppaSignalLockedAt: null,
    });
    expect(error).toMatch(/locked/i);
  });
});
