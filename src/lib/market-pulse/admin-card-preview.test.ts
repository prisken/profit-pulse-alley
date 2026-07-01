import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import {
  adminPreviewDataToSwipeCard,
  adminPreviewIsReadOnly,
  swipeCardPayloadHasNoPpaFields,
} from "@/lib/market-pulse/admin-card-preview-data";
import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const previewCard: MarketPulseAdminCardPreviewData = {
  companyName: "Acme Corp",
  ticker: "ACME",
  headline: "Acme expands",
  summary: "Summary text",
  newsBody: "Full story body",
  userPrompt: "What is your read?",
  cardImageUrl: "https://example.com/card.png",
  cardImageAlt: "Chart",
  ppaSignal: "BULLISH",
  ppaInsight: "Hidden admin insight",
  ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
};

describe("adminPreviewDataToSwipeCard", () => {
  it("maps admin preview fields to the player swipe card shape", () => {
    const swipe = adminPreviewDataToSwipeCard(previewCard, "card-1");

    expect(swipe.id).toBe("card-1");
    expect(swipe.headline).toBe("Acme expands");
    expect(swipe.newsBody).toBe("Full story body");
    expect(swipe.userPrompt).toBe("What is your read?");
    expect(swipe.cardImageUrl).toBe("https://example.com/card.png");
  });

  it("never forwards PPA fields to the public swipe payload", () => {
    const swipe = adminPreviewDataToSwipeCard(previewCard, "card-1");

    expect(swipeCardPayloadHasNoPpaFields(swipe)).toBe(true);
    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
  });

  it("keeps preview read-only with no submit side effects", () => {
    expect(adminPreviewIsReadOnly()).toBe(true);
  });
});

describe("admin preview privacy", () => {
  it("does not expose PPA on unrevealed public card payloads", () => {
    const card = buildMarketPulseTestCard({
      id: "card-1",
      cycleId: "cycle-1",
      dayIndex: 1,
      companyName: "Acme",
      ticker: "ACME",
      headline: "Headline",
      publishedAt: new Date("2026-03-01T00:00:00.000Z"),
      ppaSignal: "BULLISH",
      ppaInsight: "Secret",
      ppaSignalLockedAt: new Date("2026-03-01T00:00:00.000Z"),
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: {
        status: "OPEN",
        revealAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      at: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
  });
});

describe("draft card preview does not make card playable", () => {
  it("draft cards remain not live for players", () => {
    const draftCard = {
      status: "DRAFT",
      publishedAt: null,
      dayIndex: 1,
    } satisfies Pick<MarketPulseAdminCardRow, "status" | "publishedAt" | "dayIndex">;

    expect(isCardLiveForPlayers(draftCard, MARKET_PULSE_PUBLIC_LAUNCH_AT)).toBe(false);
  });
});
