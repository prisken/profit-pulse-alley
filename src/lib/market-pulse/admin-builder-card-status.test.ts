import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { getBuilderCardValidationStatus } from "@/lib/market-pulse/admin-builder-card-status";

function baseCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    companyName: "Acme",
    companyNameZh: null,
    ticker: "ACME",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: null,
    sourceName: "Test Source",
    sourceUrl: "https://example.com/news/market-article-1",
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: null,
    status: "DRAFT",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("getBuilderCardValidationStatus", () => {
  it("returns published for published cards", () => {
    expect(
      getBuilderCardValidationStatus(
        baseCard({ status: "PUBLISHED", publishedAt: "2026-01-02T00:00:00.000Z" }),
      ),
    ).toBe("published");
  });

  it("returns ppa_incomplete when PPA is missing", () => {
    expect(
      getBuilderCardValidationStatus(
        baseCard({ ppaSignal: null, ppaInsight: null, ppaSignalLockedAt: null }),
      ),
    ).toBe("ppa_incomplete");
  });

  it("returns missing_required when required publish fields are missing", () => {
    expect(getBuilderCardValidationStatus(baseCard({ headline: "" }))).toBe(
      "missing_required",
    );
  });

  it("returns missing_required for quick draft placeholder content", () => {
    expect(
      getBuilderCardValidationStatus(
        baseCard({
          headline: "Untitled signal",
          companyName: "Untitled company",
          ticker: "TBD",
          summary: null,
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ),
    ).toBe("missing_required");
  });

  it("returns ready_to_publish when draft card meets publish rules", () => {
    expect(getBuilderCardValidationStatus(baseCard())).toBe("ready_to_publish");
  });
});
