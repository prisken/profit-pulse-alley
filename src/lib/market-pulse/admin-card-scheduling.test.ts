import { describe, expect, it } from "vitest";

import {
  buildFillMissingSourceDatesPreview,
  deriveCardPublishedAtFromSchedule,
  findDuplicateDayIndexes,
  findDuplicateSourceDateKeys,
  getAdjacentCardInOrder,
  getCardSchedulingPublishBlockReason,
  getCycleDayCapacity,
  nextAvailableDayIndex,
  nextAvailableSourceDate,
  nextSortOrderForDay,
  sourceDateHktDayKey,
  suggestQuickDraftSlot,
} from "@/lib/market-pulse/admin-card-scheduling";
import { findPlayableCardForToday } from "@/lib/market-pulse/playable-card";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import type { MarketPulseCard } from "@prisma/client";

const CYCLE_START = MARKET_PULSE_PUBLIC_LAUNCH_AT;
const CYCLE_END = new Date(CYCLE_START.getTime() + 3 * 24 * 60 * 60 * 1000);

describe("nextAvailableDayIndex", () => {
  it("fills the lowest unused day index first", () => {
    expect(nextAvailableDayIndex([1, 3], 3)).toEqual({
      dayIndex: 2,
      exceedsCycleCapacity: false,
    });
  });

  it("extends beyond cycle capacity when all in-range days are used", () => {
    expect(nextAvailableDayIndex([1, 2, 3], 3)).toEqual({
      dayIndex: 4,
      exceedsCycleCapacity: true,
    });
  });
});

describe("nextAvailableSourceDate", () => {
  it("skips source dates already used in the cycle", () => {
    const dayOne = new Date(CYCLE_START);
    const assignment = nextAvailableSourceDate({
      cycleStartsAt: CYCLE_START,
      preferredDayIndex: 1,
      usedSourceDateKeys: new Set([sourceDateHktDayKey(dayOne)]),
      cycleEndsAt: CYCLE_END,
    });

    expect(sourceDateHktDayKey(assignment.sourceDate)).not.toBe(
      sourceDateHktDayKey(dayOne),
    );
    expect(assignment.skippedUsedDates).toBe(true);
  });
});

describe("scheduling conflicts", () => {
  it("detects duplicate day indexes for reporting only", () => {
    expect(findDuplicateDayIndexes([{ dayIndex: 1 }, { dayIndex: 2 }, { dayIndex: 2 }])).toEqual(
      new Set([2]),
    );
  });

  it("does not block publish for duplicate day indexes", () => {
    const reason = getCardSchedulingPublishBlockReason(
      { id: "c1", dayIndex: 2, sourceDate: null, status: "DRAFT" },
      { startsAt: CYCLE_START, endsAt: CYCLE_END },
      [
        { id: "c1", dayIndex: 2, sourceDate: null, status: "DRAFT" },
        { id: "c2", dayIndex: 2, sourceDate: null, status: "DRAFT" },
      ],
    );

    expect(reason).toBeNull();
  });

  it("detects duplicate source dates", () => {
    const shared = new Date("2026-03-01T12:00:00+08:00");
    expect(
      findDuplicateSourceDateKeys([
        { sourceDate: shared },
        { sourceDate: shared },
        { sourceDate: null },
      ]),
    ).toEqual(new Set([sourceDateHktDayKey(shared)]));
  });

  it("blocks publish when day index exceeds cycle capacity", () => {
    const reason = getCardSchedulingPublishBlockReason(
      { id: "c1", dayIndex: 5, sourceDate: null, status: "DRAFT" },
      { startsAt: CYCLE_START, endsAt: CYCLE_END },
      [{ id: "c1", dayIndex: 5, sourceDate: null, status: "DRAFT" }],
    );

    expect(reason).toContain("exceeds the cycle length");
  });
});

describe("reorder helpers", () => {
  const cards = [
    { id: "a", dayIndex: 1, sortOrder: 0, status: "DRAFT" },
    { id: "b", dayIndex: 1, sortOrder: 1, status: "DRAFT" },
    { id: "c", dayIndex: 2, sortOrder: 0, status: "DRAFT" },
  ];

  it("finds the next card when moving down within a day", () => {
    expect(getAdjacentCardInOrder(cards, "a", "down")?.id).toBe("b");
  });

  it("returns null at the list edge", () => {
    expect(getAdjacentCardInOrder(cards, "c", "down")).toBeNull();
  });
});

describe("derived publish schedule", () => {
  it("sets 9:00 AM HKT on the cycle day", () => {
    const publishedAt = deriveCardPublishedAtFromSchedule(CYCLE_START, 1);
    const hktHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Hong_Kong",
        hour: "numeric",
        hour12: false,
      }).format(publishedAt),
    );
    expect(hktHour).toBe(9);
  });
});

describe("quick draft slot", () => {
  it("assigns next sort order on the current cycle day", () => {
    const slot = suggestQuickDraftSlot({
      cycleStartsAt: CYCLE_START,
      cycleEndsAt: CYCLE_END,
      cards: [{ dayIndex: 1, sortOrder: 0 }],
      now: new Date(CYCLE_START.getTime() + 12 * 60 * 60 * 1000),
    });

    expect(slot.sortOrder).toBe(1);
    expect(nextSortOrderForDay([{ dayIndex: 1, sortOrder: 0 }], 1)).toBe(1);
  });
});

describe("fill missing source dates preview", () => {
  it("only targets draft cards without source dates", () => {
    const preview = buildFillMissingSourceDatesPreview({
      cycleStartsAt: CYCLE_START,
      cards: [
        {
          id: "draft-missing",
          dayIndex: 2,
          headline: "Draft",
          status: "DRAFT",
          sourceDate: null,
        },
        {
          id: "published",
          dayIndex: 1,
          headline: "Live",
          status: "PUBLISHED",
          sourceDate: null,
        },
      ],
    });

    expect(preview.updates).toHaveLength(1);
    expect(preview.updates[0]?.cardId).toBe("draft-missing");
  });
});

describe("public playable ordering", () => {
  it("still resolves cards by day index using existing playable logic", () => {
    const startsAt = new Date("2026-03-01T00:00:00+08:00");
    const now = new Date("2026-03-01T12:00:00+08:00");
    const cards = [
      { dayIndex: 1, status: "PUBLISHED", publishedAt: new Date("2026-02-28T00:00:00Z") },
    ] as MarketPulseCard[];

    const playable = findPlayableCardForToday({ startsAt, cards }, now);
    expect(playable?.dayIndex).toBe(1);
    expect(getCycleDayCapacity(startsAt, new Date(startsAt.getTime() + 2 * 24 * 60 * 60 * 1000))).toBeGreaterThan(
      0,
    );
  });
});
