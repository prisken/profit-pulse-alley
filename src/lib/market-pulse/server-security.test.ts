import { describe, expect, it } from "vitest";
import type { MarketPulseCard } from "@prisma/client";

import {
  getMarketPulseCardPublicPayload,
  isMarketPulseCardRevealed,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/reveal-access";
import { stripPpaFromCardPayload, sanitizeMarketPulseApiCardPayload, toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import { MARKET_PULSE_CARD_TEST_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";

const baseCard = {
  id: "card-1",
  cycleId: "cycle-1",
  dayIndex: 0,
  companyName: "Acme Corp",
  companyNameZh: null,
  ticker: "ACME",
  exchange: "HKEX",
  logoUrl: null,
  priceLabel: "$10",
  priceDirection: "up",
  headline: "Acme expands",
  sourceName: "News",
  sourceUrl: null,
  sourceDate: new Date("2026-01-01T00:00:00.000Z"),
  newsBody: null,
  logoInitials: null,
  cardImageUrl: null,
  cardImageAlt: null,
  summary: "Summary text",
  userPrompt: null,
  status: "PUBLISHED" as const,
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  revealAt: null,
  ppaSignal: "BULLISH" as const,
  ppaInsight: "Hidden insight",
  ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...MARKET_PULSE_CARD_TEST_DEFAULTS,
} satisfies MarketPulseCard;

const baseCycle = {
  status: "OPEN" as const,
  revealAt: new Date("2026-01-10T00:00:00.000Z"),
};

describe("isMarketPulseCycleRevealed", () => {
  it("is false before revealAt when cycle is OPEN", () => {
    expect(
      isMarketPulseCycleRevealed(baseCycle, new Date("2026-01-05T00:00:00.000Z")),
    ).toBe(false);
  });

  it("is true when cycle status is REVEALED", () => {
    expect(
      isMarketPulseCycleRevealed(
        { ...baseCycle, status: "REVEALED" },
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("is true when now >= revealAt", () => {
    expect(
      isMarketPulseCycleRevealed(baseCycle, new Date("2026-01-10T00:00:00.000Z")),
    ).toBe(true);
  });
});

describe("getMarketPulseCardPublicPayload", () => {
  it("omits PPA fields before reveal", () => {
    const payload = getMarketPulseCardPublicPayload(baseCard, {
      cycle: baseCycle,
      at: new Date("2026-01-05T00:00:00.000Z"),
    });

    expect(payload.isRevealed).toBe(false);
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
  });

  it("includes PPA fields after reveal", () => {
    const payload = getMarketPulseCardPublicPayload(baseCard, {
      cycle: baseCycle,
      at: new Date("2026-01-10T00:00:00.000Z"),
    });

    expect(payload.isRevealed).toBe(true);
    expect(payload.ppaSignal).toBe("BULLISH");
    expect(payload.ppaInsight).toBe("Hidden insight");
  });

  it("defaults to English when locale is omitted", () => {
    const payload = getMarketPulseCardPublicPayload(
      {
        ...baseCard,
        headlineZhHant: "繁體標題",
      },
      {
        cycle: baseCycle,
      },
    );

    expect(payload.headline).toBe("Acme expands");
  });

  it("localizes REST card text and never exposes PPA fields", () => {
    const payload = getMarketPulseCardPublicPayload(
      {
        ...baseCard,
        cardType: "REST",
        companyName: "",
        ticker: "REST",
        headline: "Market rest day",
        headlineZhHant: "市場休息日",
        newsBody: "No market signal today.",
        newsBodyZhHant: "今日沒有市場信號。",
        ppaSignal: null,
        ppaInsight: null,
      },
      {
        cycle: { ...baseCycle, status: "REVEALED" },
        at: new Date("2026-01-10T00:00:00.000Z"),
        locale: "zh-Hant",
      },
    );

    expect(payload.cardType).toBe("REST");
    expect(payload.headline).toBe("市場休息日");
    expect(payload.newsBody).toBe("今日沒有市場信號。");
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
  });
});

describe("isMarketPulseCardRevealed", () => {
  it("respects per-card revealAt before cycle reveal", () => {
    const card = {
      revealAt: new Date("2026-01-03T00:00:00.000Z"),
    };

    expect(
      isMarketPulseCardRevealed(card, baseCycle, new Date("2026-01-02T00:00:00.000Z")),
    ).toBe(false);
    expect(
      isMarketPulseCardRevealed(card, baseCycle, new Date("2026-01-03T00:00:00.000Z")),
    ).toBe(true);
  });
});

describe("client payload stripping", () => {
  it("stripPpaFromCardPayload removes hidden fields", () => {
    expect(
      stripPpaFromCardPayload({
        id: "card-1",
        ppaSignal: "BULLISH",
        ppaInsight: "secret",
        ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toEqual({ id: "card-1" });
  });

  it("toMarketPulseSwipeCardData never forwards PPA fields", () => {
    expect(
      toMarketPulseSwipeCardData({
        id: "card-1",
        cardType: "SIGNAL",
        companyName: "Acme",
        ticker: "ACME",
        headline: "Headline",
        ppaSignal: "BULLISH",
        ppaInsight: "secret",
      }),
    ).toEqual({
      id: "card-1",
      cardType: "SIGNAL",
      companyName: "Acme",
      companyNameZh: undefined,
      ticker: "ACME",
      exchange: undefined,
      logoUrl: undefined,
      logoInitials: undefined,
      priceLabel: undefined,
      priceDirection: undefined,
      headline: "Headline",
      newsBody: undefined,
      sourceName: undefined,
      sourceUrl: undefined,
      sourceDate: undefined,
      cardImageUrl: undefined,
      cardImageAlt: undefined,
      summary: undefined,
      userPrompt: undefined,
    });
  });

  it("sanitizeMarketPulseApiCardPayload strips PPA from REST cards", () => {
    const sanitized = sanitizeMarketPulseApiCardPayload({
      id: "rest-1",
      cardType: "REST",
      headline: "Market rest day",
      ppaSignal: "BULLISH",
      ppaInsight: "should not leak",
    });

    expect(sanitized.cardType).toBe("REST");
    expect(sanitized).not.toHaveProperty("ppaSignal");
    expect(sanitized).not.toHaveProperty("ppaInsight");
  });
});
