import { describe, expect, it } from "vitest";

import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import {
  comparePlayableCards,
  findPlayableCardForToday,
  findPlayableCardsForToday,
  getCardReleaseTime,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const CYCLE_START = new Date("2026-06-01T00:00:00.000Z");
const CYCLE_REVEAL = new Date("2026-06-30T00:00:00.000Z");

function card(
  overrides: Parameters<typeof buildMarketPulseTestCard>[0],
) {
  return buildMarketPulseTestCard({
    id: `card-${overrides.dayIndex}-${overrides.sortOrder ?? 0}`,
    cycleId: "cycle-1",
    publishedAt: CYCLE_START,
    ppaSignalLockedAt: CYCLE_START,
    createdAt: CYCLE_START,
    updatedAt: CYCLE_START,
    ...overrides,
  });
}

describe("findPlayableCardsForToday", () => {
  it("returns all published cards for today's cycle day sorted by sortOrder", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    expect(getCycleDisplayDay(CYCLE_START, now)).toBe(1);

    const result = findPlayableCardsForToday(
      {
        startsAt: CYCLE_START,
        revealAt: CYCLE_REVEAL,
        cards: [
          card({ dayIndex: 1, sortOrder: 1, headline: "Second" }),
          card({ dayIndex: 1, sortOrder: 0, headline: "First" }),
          card({ dayIndex: 2, sortOrder: 0, headline: "Tomorrow" }),
        ],
      },
      now,
    );

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.sortOrder)).toEqual([0, 1]);
    expect(result.every((row) => row.dayIndex === 1)).toBe(true);
  });

  it("uses 9:00 AM HKT release when publishedAt is null", () => {
    const now = new Date("2026-06-01T00:30:00.000Z");
    const releaseAt = getCycleDayReleaseAt(CYCLE_START, 1);

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [card({ dayIndex: 1, publishedAt: null })],
        },
        now,
      ),
    ).toHaveLength(0);

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [card({ dayIndex: 1, publishedAt: null })],
        },
        new Date(releaseAt.getTime() + 1_000),
      ),
    ).toHaveLength(1);
  });

  it("matches admin 1-based day index on the first cycle day", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    const result = findPlayableCardsForToday(
      {
        startsAt: CYCLE_START,
        revealAt: CYCLE_REVEAL,
        cards: [card({ dayIndex: 1 })],
      },
      now,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(1);
  });

  it("matches 0-based day index for legacy rows", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    const result = findPlayableCardsForToday(
      {
        startsAt: CYCLE_START,
        revealAt: CYCLE_REVEAL,
        cards: [card({ dayIndex: 0 })],
      },
      now,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(0);
  });

  it("ignores unpublished or future publishedAt cards", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [card({ dayIndex: 1, status: "READY" })],
        },
        now,
      ),
    ).toHaveLength(0);

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [
            card({
              dayIndex: 1,
              publishedAt: new Date("2026-06-02T08:00:00.000Z"),
            }),
          ],
        },
        now,
      ),
    ).toHaveLength(0);
  });

  it("does not match prior-day cards via zero-based day index", () => {
    const day2Morning = new Date("2026-06-02T12:00:00.000Z");

    const result = findPlayableCardsForToday(
      {
        startsAt: CYCLE_START,
        revealAt: CYCLE_REVEAL,
        cards: [
          card({ dayIndex: 1, headline: "Yesterday" }),
          card({ dayIndex: 2, headline: "Today" }),
        ],
      },
      day2Morning,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(2);
    expect(result[0]?.headline).toBe("Today");
  });

  it("returns empty when only prior-day cards are published", () => {
    const day2Morning = new Date("2026-06-02T12:00:00.000Z");

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [card({ dayIndex: 1, headline: "Yesterday only" })],
        },
        day2Morning,
      ),
    ).toHaveLength(0);
  });
});

describe("findPlayableCardForToday", () => {
  it("returns the first playable card for today", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const cards = [
      card({ dayIndex: 1, sortOrder: 0, headline: "First" }),
      card({ dayIndex: 1, sortOrder: 1, headline: "Second" }),
    ];

    expect(
      findPlayableCardForToday(
        { startsAt: CYCLE_START, revealAt: CYCLE_REVEAL, cards },
        now,
      )?.headline,
    ).toBe("First");
  });
});

describe("comparePlayableCards", () => {
  it("orders by sortOrder then createdAt", () => {
    const a = card({
      dayIndex: 1,
      sortOrder: 0,
      createdAt: new Date("2026-06-01T01:00:00.000Z"),
    });
    const b = card({
      dayIndex: 1,
      sortOrder: 1,
      createdAt: new Date("2026-06-01T02:00:00.000Z"),
    });

    expect(comparePlayableCards(a, b)).toBeLessThan(0);
  });
});

describe("getCardReleaseTime", () => {
  it("derives schedule release when publishedAt is null", () => {
    const releaseAt = getCardReleaseTime(
      card({ dayIndex: 1, publishedAt: null }),
      CYCLE_START,
    );
    expect(releaseAt.getTime()).toBe(
      getCycleDayReleaseAt(CYCLE_START, 1).getTime(),
    );
  });

  it("uses derived release when legacy publishedAt is earlier", () => {
    const releaseAt = getCardReleaseTime(
      card({ dayIndex: 1, publishedAt: CYCLE_START }),
      CYCLE_START,
    );
    expect(releaseAt.getTime()).toBe(getCycleDayReleaseAt(CYCLE_START, 1).getTime());
  });
});
