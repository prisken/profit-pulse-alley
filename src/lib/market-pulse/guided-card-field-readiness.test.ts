import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
} from "@/lib/market-pulse/cycle-card-defaults";
import { getGuidedCardFieldReadiness } from "@/lib/market-pulse/guided-card-field-readiness";
import {
  collectGuidedRestMissingContentFields,
  collectGuidedSignalMissingContentFields,
  isGuidedRestContentComplete,
  isGuidedSignalContentComplete,
} from "@/lib/market-pulse/guided-card-status";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";

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

describe("getGuidedCardFieldReadiness", () => {
  it("reports missing SIGNAL content and PPA fields for an empty draft card", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        headline: QUICK_DRAFT_CARD_HEADLINE,
        companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
        ticker: QUICK_DRAFT_CARD_TICKER,
        newsBody: "",
        summary: "",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    );

    expect(readiness.status).toBe("missing_content");
    expect(readiness.missingContentFields).toEqual(
      expect.arrayContaining([
        "headline",
        "newsBody",
        "companyName",
        "ticker",
        "summary",
      ]),
    );
    expect(readiness.missingPpaFields).toEqual(
      expect.arrayContaining(["ppaSignal", "ppaInsight", "ppaApproval"]),
    );
    expect(readiness.hintKeys).toContain(
      "auth.admin.mp.guidedCards.readiness.ppaBeforeContent",
    );
  });

  it("reports missing PPA only when SIGNAL content is complete", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    );

    expect(readiness.status).toBe("missing_ppa");
    expect(readiness.missingContentFields).toEqual([]);
    expect(readiness.missingPpaFields).toEqual(
      expect.arrayContaining(["ppaSignal", "ppaInsight", "ppaApproval"]),
    );
  });

  it("reports missing content only when SIGNAL PPA is approved but content is incomplete", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        headline: QUICK_DRAFT_CARD_HEADLINE,
        companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
        ticker: QUICK_DRAFT_CARD_TICKER,
        newsBody: "",
        summary: "",
      }),
    );

    expect(readiness.status).toBe("missing_content");
    expect(readiness.missingContentFields.length).toBeGreaterThan(0);
    expect(readiness.missingPpaFields).toEqual([]);
  });

  it("reports ready with no missing fields when SIGNAL content and PPA are complete", () => {
    const readiness = getGuidedCardFieldReadiness(baseCard());

    expect(readiness.status).toBe("ready");
    expect(readiness.missingContentFields).toEqual([]);
    expect(readiness.missingSaveFields).toEqual([]);
    expect(readiness.missingPpaFields).toEqual([]);
    expect(readiness.hintKeys).toContain(
      "auth.admin.mp.guidedCards.readiness.readyToLaunch",
    );
  });

  it("reports missing REST title and body without summary or PPA fields", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: "",
        newsBody: "",
        summary: "",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    );

    expect(readiness.status).toBe("missing_content");
    expect(readiness.missingContentFields).toEqual(
      expect.arrayContaining(["headline", "newsBody"]),
    );
    expect(readiness.missingContentFields).not.toContain("summary");
    expect(readiness.missingPpaFields).toEqual([]);
    expect(readiness.hintKeys).toContain(
      "auth.admin.mp.guidedCards.readiness.restNoPpa",
    );
  });

  it("reports REST ready when title and body are complete", () => {
    const readiness = getGuidedCardFieldReadiness(
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
    );

    expect(readiness.status).toBe("ready");
    expect(readiness.missingContentFields).toEqual([]);
    expect(readiness.missingPpaFields).toEqual([]);
  });

  it("reports image alt as a save-blocking field when image URL is set", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        cardImageUrl: "https://example.com/card.jpg",
        cardImageAlt: "",
      }),
    );

    expect(readiness.missingSaveFields).toContain("cardImageAlt");
    expect(readiness.status).toBe("ready");
  });

  it("reports published status without missing-field noise", () => {
    const readiness = getGuidedCardFieldReadiness(
      baseCard({
        status: "PUBLISHED",
        publishedAt: "2026-01-02T00:00:00.000Z",
        headline: "",
        newsBody: "",
        summary: "",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    );

    expect(readiness.status).toBe("published");
    expect(readiness.isPublished).toBe(true);
    expect(readiness.missingContentFields).toEqual([]);
    expect(readiness.missingSaveFields).toEqual([]);
    expect(readiness.missingPpaFields).toEqual([]);
    expect(readiness.hintKeys).toEqual([
      "auth.admin.mp.guidedCards.editor.publishedNotice",
    ]);
  });
});

describe("guided content field collectors agree with completeness helpers", () => {
  const signalCases = [
    {
      headline: "Headline",
      newsBody: "Body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
    },
    {
      headline: QUICK_DRAFT_CARD_HEADLINE,
      newsBody: "",
      companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
      ticker: QUICK_DRAFT_CARD_TICKER,
      summary: "",
    },
    {
      headline: "Only headline",
      newsBody: "",
      companyName: "",
      ticker: "",
      summary: "",
    },
  ] as const;

  it.each(signalCases)(
    "SIGNAL collector matches isGuidedSignalContentComplete",
    (card) => {
      const missing = collectGuidedSignalMissingContentFields(card);
      expect(isGuidedSignalContentComplete(card)).toBe(missing.length === 0);
    },
  );

  const restCases = [
    { headline: "Rest", newsBody: "Body" },
    { headline: "", newsBody: "" },
    {
      headline: QUICK_REST_DRAFT_CARD_HEADLINE,
      newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
    },
  ] as const;

  it.each(restCases)(
    "REST collector matches isGuidedRestContentComplete",
    (card) => {
      const missing = collectGuidedRestMissingContentFields(card);
      expect(isGuidedRestContentComplete(card)).toBe(missing.length === 0);
    },
  );
});
