import { describe, expect, it } from "vitest";

import {
  MARKET_PULSE_CARD_BILINGUAL_FIELD_PAIRS,
  MARKET_PULSE_CARD_LEGACY_FIELD_MAP,
  MARKET_PULSE_CARD_SCHEDULING_FIELDS,
  MARKET_PULSE_CARD_ZH_HANT_FIELDS,
  MARKET_PULSE_NEW_CARD_CONTENT_FIELDS,
} from "@/lib/market-pulse/card-fields";
import { MARKET_PULSE_CARD_TEST_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  getMarketPulseCardPublicPayload,
  type MarketPulseCardPublicPayload,
} from "@/lib/market-pulse/reveal-access";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import type { MarketPulseCard } from "@prisma/client";

const baseCycle = {
  status: "OPEN" as const,
  revealAt: new Date("2026-01-10T00:00:00.000Z"),
};

function buildCard(
  overrides: Partial<MarketPulseCard> = {},
): MarketPulseCard {
  return {
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    companyName: "Acme Corp",
    companyNameZh: null,
    ticker: "ACME",
    exchange: "HKEX",
    logoUrl: "https://example.com/logo.png",
    logoInitials: "AC",
    priceLabel: "$10.00",
    priceDirection: "+2.1%",
    headline: "Acme expands capacity",
    newsBody: "Acme announced a multi-year expansion plan across three regions.",
    sourceName: "Demo Wire",
    sourceUrl: "https://example.com/story",
    sourceDate: new Date("2026-01-01T00:00:00.000Z"),
    cardImageUrl: "https://example.com/hero.jpg",
    cardImageAlt: "Factory floor at Acme plant",
    summary: "Expansion supports medium-term revenue visibility.",
    userPrompt: "What is your read on this signal?",
    ppaSignal: "BULLISH",
    ppaInsight: "Hidden insight",
    ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
    status: "PUBLISHED",
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    revealAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...MARKET_PULSE_CARD_TEST_DEFAULTS,
    ...overrides,
  };
}

describe("Market Pulse card field mapping", () => {
  it("documents legacy design-to-schema mappings", () => {
    expect(MARKET_PULSE_CARD_LEGACY_FIELD_MAP.newsSourceName).toBe("sourceName");
    expect(MARKET_PULSE_CARD_LEGACY_FIELD_MAP.currentPriceText).toBe("priceLabel");
    expect(MARKET_PULSE_CARD_LEGACY_FIELD_MAP.companyLogoUrl).toBe("logoUrl");
  });

  it("lists net-new optional content columns", () => {
    expect(MARKET_PULSE_NEW_CARD_CONTENT_FIELDS).toEqual([
      "newsBody",
      "logoInitials",
      "cardImageUrl",
      "cardImageAlt",
      "userPrompt",
    ]);
  });

  it("documents zh-Hant and scheduling model fields", () => {
    expect(MARKET_PULSE_CARD_ZH_HANT_FIELDS).toContain("headlineZhHant");
    expect(MARKET_PULSE_CARD_BILINGUAL_FIELD_PAIRS.headline).toBe("headlineZhHant");
    expect(MARKET_PULSE_CARD_BILINGUAL_FIELD_PAIRS.companyName).toBe("companyNameZh");
    expect(MARKET_PULSE_CARD_SCHEDULING_FIELDS).toContain("sortOrder");
    expect(MARKET_PULSE_CARD_SCHEDULING_FIELDS).toContain("publishedAt");
  });
});

describe("card payload shape", () => {
  it("public payload includes new content fields before reveal", () => {
    const payload = getMarketPulseCardPublicPayload(buildCard(), {
      cycle: baseCycle,
      at: new Date("2026-01-05T00:00:00.000Z"),
    });

    expect(payload.newsBody).toMatch(/expansion plan/i);
    expect(payload.cardImageUrl).toBe("https://example.com/hero.jpg");
    expect(payload.cardImageAlt).toMatch(/factory/i);
    expect(payload.userPrompt).toMatch(/read on this signal/i);
    expect(payload.logoInitials).toBe("AC");
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
  });

  it("swipe serialization forwards public content fields only", () => {
    const payload: MarketPulseCardPublicPayload = getMarketPulseCardPublicPayload(
      buildCard(),
      { cycle: baseCycle, at: new Date("2026-01-05T00:00:00.000Z") },
    );

    expect(toMarketPulseSwipeCardData(payload)).toEqual({
      id: "card-1",
      cardType: "SIGNAL",
      companyName: "Acme Corp",
      companyNameZh: null,
      ticker: "ACME",
      exchange: "HKEX",
      logoUrl: "https://example.com/logo.png",
      logoInitials: "AC",
      priceLabel: "$10.00",
      priceDirection: "+2.1%",
      headline: "Acme expands capacity",
      newsBody: "Acme announced a multi-year expansion plan across three regions.",
      sourceName: "Demo Wire",
      sourceUrl: "https://example.com/story",
      sourceDate: payload.sourceDate,
      cardImageUrl: "https://example.com/hero.jpg",
      cardImageAlt: "Factory floor at Acme plant",
      summary: "Expansion supports medium-term revenue visibility.",
      userPrompt: "What is your read on this signal?",
    });
  });

  it("allows null new fields for legacy cards", () => {
    const payload = getMarketPulseCardPublicPayload(
      buildCard({
        newsBody: null,
        logoInitials: null,
        cardImageUrl: null,
        cardImageAlt: null,
        userPrompt: null,
      }),
      { cycle: baseCycle, at: new Date("2026-01-05T00:00:00.000Z") },
    );

    expect(payload.newsBody).toBeNull();
    expect(payload.cardImageUrl).toBeNull();
    expect(payload.userPrompt).toBeNull();
  });
});
