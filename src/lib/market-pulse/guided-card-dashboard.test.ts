import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
} from "@/lib/market-pulse/cycle-card-defaults";
import {
  filterGuidedCycleCardDashboardRows,
  getGuidedCardDashboard,
  guidedCardDashboardExcludesSensitiveFields,
} from "@/lib/market-pulse/guided-card-dashboard";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";

function baseCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    sortOrder: 0,
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

function readySignal(id: string, dayIndex: number): MarketPulseAdminCardRow {
  return baseCard({
    id,
    dayIndex,
    sortOrder: 0,
    cardType: "SIGNAL",
  });
}

function readyRest(id: string, dayIndex: number): MarketPulseAdminCardRow {
  return baseCard({
    id,
    dayIndex,
    sortOrder: 0,
    cardType: "REST",
    companyName: "",
    ticker: "",
    headline: "Rest day",
    newsBody: "Rest body",
    summary: "Rest body",
    userPrompt: null,
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
  });
}

describe("getGuidedCardDashboard", () => {
  it("returns zero counts and null focus for an empty cycle", () => {
    const dashboard = getGuidedCardDashboard([]);

    expect(dashboard.totalCards).toBe(0);
    expect(dashboard.signalCount).toBe(0);
    expect(dashboard.restCount).toBe(0);
    expect(dashboard.publishedCount).toBe(0);
    expect(dashboard.readyCount).toBe(0);
    expect(dashboard.missingContentCount).toBe(0);
    expect(dashboard.missingPpaCount).toBe(0);
    expect(dashboard.saveBlockingCount).toBe(0);
    expect(dashboard.nextSuggestedFocus).toBeNull();
  });

  it("counts all ready SIGNAL + REST and focuses first unpublished ready card", () => {
    const dashboard = getGuidedCardDashboard([
      readySignal("signal-1", 1),
      readyRest("rest-1", 2),
    ]);

    expect(dashboard.totalCards).toBe(2);
    expect(dashboard.signalCount).toBe(1);
    expect(dashboard.restCount).toBe(1);
    expect(dashboard.readyCount).toBe(2);
    expect(dashboard.missingContentCount).toBe(0);
    expect(dashboard.missingPpaCount).toBe(0);
    expect(dashboard.nextSuggestedFocus).toEqual({
      cardId: "signal-1",
      reason: "unpublished_ready",
    });
  });

  it("increments missingContentCount and focuses missing content card", () => {
    const dashboard = getGuidedCardDashboard([
      readySignal("ready-1", 1),
      baseCard({
        id: "missing-content",
        dayIndex: 2,
        newsBody: "",
        summary: "",
      }),
    ]);

    expect(dashboard.missingContentCount).toBe(1);
    expect(dashboard.nextSuggestedFocus).toEqual({
      cardId: "missing-content",
      reason: "missing_content",
    });
  });

  it("prioritizes missing PPA SIGNAL over missing content", () => {
    const dashboard = getGuidedCardDashboard([
      baseCard({
        id: "missing-content-first",
        dayIndex: 1,
        newsBody: "",
        summary: "",
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
        ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
      }),
      baseCard({
        id: "missing-ppa",
        dayIndex: 2,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(dashboard.missingPpaCount).toBe(1);
    expect(dashboard.missingContentCount).toBe(1);
    expect(dashboard.nextSuggestedFocus).toEqual({
      cardId: "missing-ppa",
      reason: "missing_ppa",
    });
  });

  it("counts published cards separately and supports published filter", () => {
    const cards = [
      {
        ...readySignal("published-1", 1),
        status: "PUBLISHED" as const,
        publishedAt: "2026-08-01T01:00:00.000Z",
      },
      readySignal("ready-1", 2),
    ];

    const dashboard = getGuidedCardDashboard(cards);

    expect(dashboard.publishedCount).toBe(1);
    expect(dashboard.readyCount).toBe(1);
    expect(
      filterGuidedCycleCardDashboardRows(dashboard.cardRows, "published"),
    ).toHaveLength(1);
    expect(
      filterGuidedCycleCardDashboardRows(dashboard.cardRows, "published")[0]?.id,
    ).toBe("published-1");
  });

  it("focuses save-blocking after missing content and before unpublished ready", () => {
    const dashboard = getGuidedCardDashboard([
      readySignal("ready-1", 1),
      baseCard({
        id: "save-blocking",
        dayIndex: 2,
        cardImageUrl: "https://example.com/card.png",
        cardImageAlt: "",
      }),
      baseCard({
        id: "missing-content",
        dayIndex: 3,
        newsBody: "",
        summary: "",
      }),
    ]);

    expect(dashboard.saveBlockingCount).toBe(1);
    expect(dashboard.nextSuggestedFocus).toEqual({
      cardId: "missing-content",
      reason: "missing_content",
    });

    const saveOnly = getGuidedCardDashboard([
      readySignal("ready-1", 1),
      baseCard({
        id: "save-blocking",
        dayIndex: 2,
        cardImageUrl: "https://example.com/card.png",
        cardImageAlt: "",
      }),
    ]);

    expect(saveOnly.nextSuggestedFocus).toEqual({
      cardId: "save-blocking",
      reason: "save_blocking",
    });
  });

  it("follows explicit next focus priority ordering", () => {
    const cards = [
      baseCard({
        id: "ready-unpublished",
        dayIndex: 4,
      }),
      baseCard({
        id: "save-blocking",
        dayIndex: 3,
        cardImageUrl: "https://example.com/card.png",
        cardImageAlt: "",
      }),
      baseCard({
        id: "missing-content",
        dayIndex: 2,
        newsBody: "",
        summary: "",
      }),
      baseCard({
        id: "missing-ppa",
        dayIndex: 1,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ];

    expect(getGuidedCardDashboard(cards).nextSuggestedFocus).toEqual({
      cardId: "missing-ppa",
      reason: "missing_ppa",
    });

    const withoutPpa = cards.filter((card) => card.id !== "missing-ppa");
    expect(getGuidedCardDashboard(withoutPpa).nextSuggestedFocus).toEqual({
      cardId: "missing-content",
      reason: "missing_content",
    });

    const withoutContent = withoutPpa.filter((card) => card.id !== "missing-content");
    expect(getGuidedCardDashboard(withoutContent).nextSuggestedFocus).toEqual({
      cardId: "save-blocking",
      reason: "save_blocking",
    });

    const withoutSave = withoutContent.filter((card) => card.id !== "save-blocking");
    expect(getGuidedCardDashboard(withoutSave).nextSuggestedFocus).toEqual({
      cardId: "ready-unpublished",
      reason: "unpublished_ready",
    });
  });

  it("excludes sensitive fields from serialized dashboard output", () => {
    const dashboard = getGuidedCardDashboard([
      baseCard({
        id: "sensitive",
        ppaSignal: "BULLISH",
        ppaInsight: "Secret insight",
        ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
        newsBody: "Full article body",
        cardImageUrl: "https://example.com/image.png",
        cardImageAlt: "Alt text",
      }),
      baseCard({
        id: "placeholder",
        headline: QUICK_DRAFT_CARD_HEADLINE,
        companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
        ticker: QUICK_DRAFT_CARD_TICKER,
        newsBody: "",
        summary: "",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
      readyRest("rest-1", 2),
    ]);

    expect(guidedCardDashboardExcludesSensitiveFields(dashboard)).toBe(true);
    expect(JSON.stringify(dashboard)).not.toContain("ppaSignal");
    expect(JSON.stringify(dashboard)).not.toContain("newsBody");
    expect(JSON.stringify(dashboard)).not.toContain("cardImageUrl");
  });
});

describe("filterGuidedCycleCardDashboardRows", () => {
  const cards = [
    readySignal("signal-ready", 1),
    {
      ...readySignal("signal-published", 2),
      status: "PUBLISHED" as const,
      publishedAt: "2026-08-01T01:00:00.000Z",
    },
    baseCard({
      id: "signal-missing-ppa",
      dayIndex: 3,
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    }),
    baseCard({
      id: "signal-missing-content",
      dayIndex: 4,
      headline: QUICK_DRAFT_CARD_HEADLINE,
      companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
      ticker: QUICK_DRAFT_CARD_TICKER,
      newsBody: "",
      summary: "",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    }),
    readyRest("rest-ready", 5),
    baseCard({
      id: "rest-missing-content",
      dayIndex: 6,
      cardType: "REST",
      companyName: "",
      ticker: "",
      headline: QUICK_REST_DRAFT_CARD_HEADLINE,
      newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
      summary: "",
      userPrompt: null,
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    }),
  ];

  const rows = getGuidedCardDashboard(cards).cardRows;

  it("returns all rows for the all filter", () => {
    expect(filterGuidedCycleCardDashboardRows(rows, "all")).toHaveLength(rows.length);
  });

  it("filters missing content rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "missing_content");
    expect(filtered.map((row) => row.id)).toEqual([
      "signal-missing-content",
      "rest-missing-content",
    ]);
  });

  it("filters missing PPA SIGNAL rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "missing_ppa");
    expect(filtered.map((row) => row.id)).toEqual(["signal-missing-ppa"]);
  });

  it("filters ready rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "ready");
    expect(filtered.map((row) => row.id)).toEqual(["signal-ready", "rest-ready"]);
  });

  it("filters published rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "published");
    expect(filtered.map((row) => row.id)).toEqual(["signal-published"]);
  });

  it("filters SIGNAL rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "signal");
    expect(filtered.every((row) => row.cardType === "SIGNAL")).toBe(true);
    expect(filtered).toHaveLength(4);
  });

  it("filters REST rows", () => {
    const filtered = filterGuidedCycleCardDashboardRows(rows, "rest");
    expect(filtered.map((row) => row.id)).toEqual(["rest-ready", "rest-missing-content"]);
  });
});
