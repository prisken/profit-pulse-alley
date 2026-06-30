import { describe, expect, it } from "vitest";

import { buildBuilderCardValidationSummary } from "@/lib/market-pulse/admin-builder-card-validation";
import { DEFAULT_CARD_FORM_VALUES } from "@/lib/market-pulse/card-validation";

describe("buildBuilderCardValidationSummary", () => {
  it("reports missing publish fields for incomplete drafts", () => {
    const summary = buildBuilderCardValidationSummary({
      values: {
        ...DEFAULT_CARD_FORM_VALUES,
        cycleId: "cycle-1",
        dayIndex: 1,
        companyName: "Acme",
        ticker: "ACME",
        headline: "Headline",
        summary: "",
      },
      existingDayIndexes: [1],
      excludeDayIndex: 1,
      ppaSignalLockedAt: null,
    });

    expect(summary.publishReady).toBe(false);
    expect(summary.issues.some((issue) => issue.includes("Summary"))).toBe(true);
  });

  it("is ready when all publish requirements are met", () => {
    const summary = buildBuilderCardValidationSummary({
      values: {
        ...DEFAULT_CARD_FORM_VALUES,
        cycleId: "cycle-1",
        dayIndex: 1,
        companyName: "Acme",
        ticker: "ACME",
        headline: "Headline",
        summary: "Summary",
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
      },
      existingDayIndexes: [1],
      excludeDayIndex: 1,
      ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(summary.publishReady).toBe(true);
    expect(summary.issues).toHaveLength(0);
  });
});
