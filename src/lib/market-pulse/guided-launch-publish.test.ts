import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  planGuidedLaunchCardPublish,
  planGuidedLaunchPublishes,
} from "@/lib/market-pulse/guided-launch-publish";

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
    ...overrides,
  };
}

const CYCLE = {
  startsAt: new Date("2026-08-01T01:00:00.000Z"),
  endsAt: new Date("2026-08-10T13:00:00.000Z"),
};

describe("planGuidedLaunchPublishes", () => {
  it("skips already published cards", () => {
    const cards = [
      baseCard({
        id: "published",
        status: "PUBLISHED",
        publishedAt: "2026-08-01T01:00:00.000Z",
      }),
      baseCard({ id: "draft" }),
    ];

    const result = planGuidedLaunchPublishes({ cards, cycle: CYCLE });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plans).toHaveLength(1);
      expect(result.plans[0]?.cardId).toBe("draft");
    }
  });

  it("preserves existing publishedAt when republishing plan is built", () => {
    const existingPublishedAt = new Date("2026-07-01T00:00:00.000Z");
    const card = baseCard({
      status: "PUBLISHED",
      publishedAt: existingPublishedAt.toISOString(),
    });

    const result = planGuidedLaunchCardPublish({
      card,
      cycle: CYCLE,
      allCards: [card],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.publishedAt).toEqual(existingPublishedAt);
    }
  });

  it("derives publishedAt from schedule for unpublished ready cards", () => {
    const card = baseCard();
    const result = planGuidedLaunchCardPublish({
      card,
      cycle: CYCLE,
      allCards: [card],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.publishedAt).toEqual(new Date("2026-08-01T01:00:00.000Z"));
    }
  });
});
