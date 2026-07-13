import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  getHubCycleActionLinks,
  getMarketPulseCycleNextAction,
} from "@/lib/market-pulse/admin-cycle-next-action";
import {
  buildGuidedHubProgressSummary,
  enrichCycleRowsWithGuidedProgress,
  guidedHubProgressExcludesSensitiveFields,
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

const READY_CARDS = [
  baseCard({ id: "card-1" }),
  baseCard({
    id: "card-2",
    dayIndex: 2,
    cardType: "REST",
    companyName: "",
    ticker: "",
    headline: "Rest",
    newsBody: "Rest body",
    summary: "Rest body",
    userPrompt: null,
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
  }),
];

describe("buildGuidedHubProgressSummary", () => {
  it("returns non-null summary for DRAFT and OPEN guided cycles", () => {
    const draft = buildGuidedHubProgressSummary({
      cycleStatus: "DRAFT",
      cards: READY_CARDS,
    });
    const open = buildGuidedHubProgressSummary({
      cycleStatus: "OPEN",
      cards: READY_CARDS,
    });

    expect(draft).not.toBeNull();
    expect(open).not.toBeNull();
    expect(draft?.totalCards).toBe(2);
    expect(draft?.readyCount).toBe(2);
  });

  it("returns null for CLOSED, REVEALED, and ARCHIVED cycles", () => {
    expect(
      buildGuidedHubProgressSummary({ cycleStatus: "CLOSED", cards: READY_CARDS }),
    ).toBeNull();
    expect(
      buildGuidedHubProgressSummary({ cycleStatus: "REVEALED", cards: READY_CARDS }),
    ).toBeNull();
    expect(
      buildGuidedHubProgressSummary({ cycleStatus: "ARCHIVED", cards: READY_CARDS }),
    ).toBeNull();
  });

  it("includes progress counts and maps next focus reason without cardId", () => {
    const cards = [
      baseCard({ id: "missing-ppa", ppaSignal: null, ppaInsight: null, ppaSignalLockedAt: null }),
      baseCard({ id: "ready-2", dayIndex: 2 }),
    ];

    const summary = buildGuidedHubProgressSummary({
      cycleStatus: "DRAFT",
      cards,
    });

    expect(summary).toEqual({
      totalCards: 2,
      readyCount: 1,
      publishedCount: 0,
      missingContentCount: 0,
      missingPpaCount: 1,
      saveBlockingCount: 0,
      nextSuggestedFocusReason: "missing_ppa",
    });
    expect(JSON.stringify(summary)).not.toContain("cardId");
    expect(JSON.stringify(summary)).not.toContain("missing-ppa");
  });

  it("excludes sensitive fields from serialized summary output", () => {
    const summary = buildGuidedHubProgressSummary({
      cycleStatus: "OPEN",
      cards: [
        baseCard({
          ppaSignal: "BULLISH",
          ppaInsight: "Secret",
          ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
          newsBody: "Full article",
          cardImageUrl: "https://example.com/image.png",
          cardImageAlt: "Alt",
        }),
      ],
    });

    expect(summary).not.toBeNull();
    if (!summary) {
      throw new Error("expected summary");
    }

    expect(guidedHubProgressExcludesSensitiveFields(summary)).toBe(true);
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("cardRows");
    expect(serialized).not.toContain("cardsByStatus");
    expect(serialized).not.toContain("ppaSignal");
    expect(serialized).not.toContain("newsBody");
  });
});

describe("enrichCycleRowsWithGuidedProgress", () => {
  it("attaches guidedProgress for guided cycles and null for terminal statuses", () => {
    const cardsByCycleId = new Map<string, MarketPulseAdminCardRow[]>([
      ["cycle-draft", READY_CARDS],
      ["cycle-closed", READY_CARDS],
    ]);

    const enriched = enrichCycleRowsWithGuidedProgress(
      [
        { id: "cycle-draft", status: "DRAFT" },
        { id: "cycle-closed", status: "CLOSED" },
      ],
      cardsByCycleId,
    );

    expect(enriched[0]?.guidedProgress).not.toBeNull();
    expect(enriched[0]?.guidedProgress?.totalCards).toBe(2);
    expect(enriched[1]?.guidedProgress).toBeNull();
    expect(JSON.stringify(enriched[0]?.guidedProgress)).not.toContain("ppaSignal");
  });
});

describe("hub next-action regression with guided progress", () => {
  it("keeps launched guided cycles muted without review-and-launch CTA", () => {
    const launchedCards = READY_CARDS.map((card) => ({
      ...card,
      status: "PUBLISHED" as const,
      publishedAt: "2026-08-01T01:00:00.000Z",
    }));

    const progress = buildGuidedHubProgressSummary({
      cycleStatus: "OPEN",
      cards: launchedCards,
    });

    expect(progress?.publishedCount).toBe(2);
    expect(progress?.totalCards).toBe(2);

    const nextAction = getMarketPulseCycleNextAction({
      cycleId: "cycle-1",
      cycleStatus: "OPEN",
      cards: launchedCards,
      activeCycleId: "cycle-1",
      runtimeStatus: "OPEN",
    });
    const links = getHubCycleActionLinks(nextAction, "cycle-1", "OPEN");

    expect(nextAction.kind).toBe("launched");
    expect(links.showReviewAndLaunch).toBe(false);
    expect(links.primaryHref).toBeNull();
  });
});
