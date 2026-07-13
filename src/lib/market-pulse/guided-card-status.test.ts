import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  getGuidedCardStatus,
  isGuidedRestContentComplete,
  isGuidedSignalContentComplete,
} from "@/lib/market-pulse/guided-card-status";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
} from "@/lib/market-pulse/cycle-card-defaults";

function baseCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
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
    newsBody: "Body",
    sourceName: null,
    sourceUrl: null,
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
    ...overrides,
  };
}

describe("getGuidedCardStatus", () => {
  it("returns published for published cards", () => {
    expect(
      getGuidedCardStatus(
        baseCard({ status: "PUBLISHED", publishedAt: "2026-01-02T00:00:00.000Z" }),
      ),
    ).toBe("published");
  });

  it("returns missing_content for incomplete SIGNAL content even when PPA is approved", () => {
    expect(
      getGuidedCardStatus(
        baseCard({
          headline: QUICK_DRAFT_CARD_HEADLINE,
          companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
          ticker: QUICK_DRAFT_CARD_TICKER,
          newsBody: "",
          summary: "",
          ppaSignal: "BULLISH",
          ppaInsight: "Insight",
          ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
    ).toBe("missing_content");
  });

  it("returns missing_ppa when SIGNAL content is complete but PPA is not approved", () => {
    expect(
      getGuidedCardStatus(
        baseCard({
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ),
    ).toBe("missing_ppa");
  });

  it("returns ready when SIGNAL content is complete and PPA is approved", () => {
    expect(getGuidedCardStatus(baseCard())).toBe("ready");
  });

  it("returns ready for REST cards with title and body", () => {
    expect(
      getGuidedCardStatus(
        baseCard({
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: "Rest day",
          newsBody: "Take a break.",
          summary: "Take a break.",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ),
    ).toBe("ready");
  });

  it("returns missing_content for REST placeholder content", () => {
    expect(
      getGuidedCardStatus(
        baseCard({
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: QUICK_REST_DRAFT_CARD_HEADLINE,
          newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
          summary: QUICK_REST_DRAFT_CARD_NEWS_BODY,
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ),
    ).toBe("missing_content");
  });
});

describe("guided content completeness helpers", () => {
  it("requires all SIGNAL content fields", () => {
    expect(
      isGuidedSignalContentComplete({
        headline: "Headline",
        newsBody: "Body",
        companyName: "Acme",
        ticker: "ACME",
        summary: "Summary",
      }),
    ).toBe(true);
  });

  it("requires REST title and body", () => {
    expect(
      isGuidedRestContentComplete({
        headline: "Rest",
        newsBody: "Body",
      }),
    ).toBe(true);
  });
});
