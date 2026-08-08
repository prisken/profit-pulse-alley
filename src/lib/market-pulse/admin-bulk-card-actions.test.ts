import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  getCardPublishBlockReason,
  getCardUnpublishBlockReason,
  getReadyToPublishCards,
  planBulkPublish,
  planBulkUnpublish,
} from "@/lib/market-pulse/admin-bulk-card-actions";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

const CYCLE_START = MARKET_PULSE_PUBLIC_LAUNCH_AT;

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
    userPrompt: "Prompt",
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

describe("planBulkPublish", () => {
  it("publishes only valid selected cards in the plan", () => {
    const cards = [
      baseCard({ id: "ready", dayIndex: 1 }),
      baseCard({
        id: "invalid",
        dayIndex: 2,
        summary: null,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ];

    const plan = planBulkPublish(cards, ["ready", "invalid"]);

    expect(plan.publishable.map((card) => card.cardId)).toEqual(["ready"]);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0]?.cardId).toBe("invalid");
  });

  it("skips already published cards", () => {
    const cards = [
      baseCard({
        id: "published",
        status: "PUBLISHED",
        publishedAt: "2026-03-01T00:00:00.000Z",
      }),
    ];

    const plan = planBulkPublish(cards, ["published"]);

    expect(plan.publishable).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe("Already published.");
  });

  it("publishes REST cards without ticker or PPA", () => {
    const cards = [
      baseCard({
        id: "rest-ready",
        cardType: "REST",
        companyName: "",
        ticker: "",
        summary: null,
        newsBody: "Weekend break.",
        userPrompt: null,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
      baseCard({
        id: "signal-invalid",
        cardType: "SIGNAL",
        summary: null,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ];

    const plan = planBulkPublish(cards, ["rest-ready", "signal-invalid"]);

    expect(plan.publishable.map((card) => card.cardId)).toEqual(["rest-ready"]);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0]?.cardId).toBe("signal-invalid");
  });
});

describe("planBulkUnpublish", () => {
  it("blocks unpublish when decisions exist", () => {
    const cards = [
      baseCard({
        id: "locked",
        status: "PUBLISHED",
        publishedAt: "2026-03-01T00:00:00.000Z",
        decisionCount: 2,
      }),
      baseCard({
        id: "open",
        status: "PUBLISHED",
        publishedAt: "2026-03-02T00:00:00.000Z",
        decisionCount: 0,
      }),
    ];

    const plan = planBulkUnpublish(cards, ["locked", "open"]);

    expect(plan.unpublishable.map((card) => card.cardId)).toEqual(["open"]);
    expect(plan.skipped[0]?.reason).toContain("decisions");
  });
});

describe("getReadyToPublishCards", () => {
  it("returns only cards that pass builder publish readiness", () => {
    const cards = [
      baseCard({ id: "ready" }),
      baseCard({ id: "draft", headline: "" }),
    ];

    expect(getReadyToPublishCards(cards).map((card) => card.id)).toEqual(["ready"]);
  });
});

describe("publish visibility rules", () => {
  it("keeps draft cards off player surfaces", () => {
    const draft = baseCard({ status: "DRAFT", publishedAt: null });

    expect(isCardPublished(draft)).toBe(false);
    expect(isCardLiveForPlayers(draft, CYCLE_START)).toBe(false);
    expect(getCardPublishBlockReason(draft)).toBeNull();
  });

  it("requires publish validation before marking live", () => {
    const invalid = baseCard({ summary: null });

    expect(getCardPublishBlockReason(invalid)).toBeTruthy();
    expect(isCardLiveForPlayers(invalid, CYCLE_START)).toBe(false);
  });

  it("allows unpublish only without decisions", () => {
    const published = baseCard({
      status: "PUBLISHED",
      publishedAt: "2026-03-01T00:00:00.000Z",
      decisionCount: 1,
    });

    expect(getCardUnpublishBlockReason(published)).toContain("decisions");
  });
});
