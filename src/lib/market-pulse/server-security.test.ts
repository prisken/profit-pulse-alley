import { describe, expect, it } from "vitest";
import type { MarketPulseCard } from "@prisma/client";

import {
  getMarketPulseCardPublicPayload,
  isMarketPulseCardRevealed,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/reveal-access";
import { stripPpaFromCardPayload, toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";

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
  summary: "Summary text",
  status: "PUBLISHED" as const,
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  revealAt: null,
  ppaSignal: "BULLISH" as const,
  ppaInsight: "Hidden insight",
  ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
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
      }),
    ).toEqual({ id: "card-1" });
  });

  it("toMarketPulseSwipeCardData never forwards PPA fields", () => {
    expect(
      toMarketPulseSwipeCardData({
        id: "card-1",
        companyName: "Acme",
        ticker: "ACME",
        headline: "Headline",
        ppaSignal: "BULLISH",
        ppaInsight: "secret",
      }),
    ).toEqual({
      id: "card-1",
      companyName: "Acme",
      companyNameZh: undefined,
      ticker: "ACME",
      exchange: undefined,
      logoUrl: undefined,
      priceLabel: undefined,
      priceDirection: undefined,
      headline: "Headline",
      sourceName: undefined,
      sourceDate: undefined,
      summary: undefined,
    });
  });
});
