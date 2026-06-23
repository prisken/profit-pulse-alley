import { describe, expect, it } from "vitest";

import {
  findPlayableCardForToday,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";
import type { MarketPulseCard } from "@prisma/client";

const CYCLE_START = new Date("2026-06-01T00:00:00.000Z");

function card(
  overrides: Partial<MarketPulseCard> & Pick<MarketPulseCard, "dayIndex">,
): MarketPulseCard {
  const { dayIndex, ...rest } = overrides;
  return {
    id: `card-${dayIndex}`,
    cycleId: "cycle-1",
    dayIndex,
    companyName: "Test Co",
    companyNameZh: null,
    ticker: "TEST",
    exchange: null,
    logoUrl: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Test headline",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    summary: null,
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: CYCLE_START,
    status: "PUBLISHED",
    publishedAt: CYCLE_START,
    revealAt: null,
    createdAt: CYCLE_START,
    updatedAt: CYCLE_START,
    ...rest,
  };
}

describe("findPlayableCardForToday", () => {
  it("matches admin 1-based day index on the first cycle day", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    expect(getCycleDisplayDay(CYCLE_START, now)).toBe(1);

    const result = findPlayableCardForToday(
      {
        startsAt: CYCLE_START,
        cards: [card({ dayIndex: 1 })],
      },
      now,
    );

    expect(result?.dayIndex).toBe(1);
  });

  it("matches 0-based day index for legacy rows", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    const result = findPlayableCardForToday(
      {
        startsAt: CYCLE_START,
        cards: [card({ dayIndex: 0 })],
      },
      now,
    );

    expect(result?.dayIndex).toBe(0);
  });

  it("ignores unpublished or future publishedAt cards", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    expect(
      findPlayableCardForToday(
        {
          startsAt: CYCLE_START,
          cards: [card({ dayIndex: 1, status: "READY" })],
        },
        now,
      ),
    ).toBeNull();

    expect(
      findPlayableCardForToday(
        {
          startsAt: CYCLE_START,
          cards: [
            card({
              dayIndex: 1,
              publishedAt: new Date("2026-06-02T08:00:00.000Z"),
            }),
          ],
        },
        now,
      ),
    ).toBeNull();
  });
});
