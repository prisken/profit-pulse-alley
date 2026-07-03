import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findPlayableCardForToday,
  findPlayableCardsForToday,
} from "@/lib/market-pulse/playable-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  decisionFindUnique: vi.fn(),
  decisionCreate: vi.fn(),
  cardFindUnique: vi.fn(),
  gameSettingFindFirst: vi.fn(),
  cycleFindUnique: vi.fn(),
  cycleFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: prismaMocks.userFindUnique },
    marketPulseDecision: {
      findUnique: prismaMocks.decisionFindUnique,
      create: prismaMocks.decisionCreate,
    },
    marketPulseCard: { findUnique: prismaMocks.cardFindUnique },
    marketPulseGameSetting: { findFirst: prismaMocks.gameSettingFindFirst },
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
      findFirst: prismaMocks.cycleFindFirst,
    },
  },
}));

import { submitMarketPulseDecision } from "@/lib/market-pulse/server";

/** Cycle starts 2026-07-01 00:00 HKT. */
const CYCLE_START_HKT = new Date("2026-06-30T16:00:00.000Z");
const CYCLE_REVEAL = new Date("2026-07-10T16:00:00.000Z");

/** 2026-07-01 09:05 HKT */
const DAY_1_AFTER_RELEASE = new Date("2026-07-01T01:05:00.000Z");
/** 2026-07-02 08:59 HKT */
const DAY_2_BEFORE_RELEASE = new Date("2026-07-02T00:59:00.000Z");
/** 2026-07-02 09:00 HKT */
const DAY_2_AT_RELEASE = new Date("2026-07-02T01:00:00.000Z");
/** 2026-07-02 09:05 HKT */
const DAY_2_AFTER_RELEASE = new Date("2026-07-02T01:05:00.000Z");

const TEST_CYCLE_ID = "cycle-july";
const TEST_USER_ID = "user_test_today_only";

function card(
  overrides: Parameters<typeof buildMarketPulseTestCard>[0],
) {
  return buildMarketPulseTestCard({
    id: `card-day-${overrides.dayIndex}-sort-${overrides.sortOrder ?? 0}`,
    cycleId: TEST_CYCLE_ID,
    publishedAt: CYCLE_START_HKT,
    ppaSignalLockedAt: CYCLE_START_HKT,
    createdAt: CYCLE_START_HKT,
    updatedAt: CYCLE_START_HKT,
    ...overrides,
  });
}

function cycleWith(cards: ReturnType<typeof card>[]) {
  return {
    startsAt: CYCLE_START_HKT,
    revealAt: CYCLE_REVEAL,
    cards,
  };
}

describe("today-only playability (HKT dayIndex)", () => {
  const day1 = card({ dayIndex: 1, sortOrder: 0, headline: "Day 1 signal" });
  const day2 = card({ dayIndex: 2, sortOrder: 0, headline: "Day 2 signal" });
  const day2Second = card({
    id: "card-day-2-sort-1",
    dayIndex: 2,
    sortOrder: 1,
    headline: "Day 2 second",
  });
  const day2Rest = card({
    id: "card-day-2-rest",
    dayIndex: 2,
    sortOrder: 2,
    cardType: "REST",
    headline: "Day 2 rest",
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
  });
  const day1Rest = card({
    id: "card-day-1-rest",
    dayIndex: 1,
    sortOrder: 0,
    cardType: "REST",
    headline: "Day 1 rest",
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
  });

  it("plays Day 1 card on Day 1 after 9:00 AM HKT", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_1_AFTER_RELEASE);

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(1);
    expect(findPlayableCardForToday(cycleWith([day1, day2]), DAY_1_AFTER_RELEASE)?.id).toBe(
      day1.id,
    );
  });

  it("does not play Day 1 card on Day 2 even if unplayed", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_AFTER_RELEASE);

    expect(result.every((row) => row.dayIndex !== 1)).toBe(true);
    expect(result.some((row) => row.id === day1.id)).toBe(false);
  });

  it("does not play Day 2 card on Day 1 even if published", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_1_AFTER_RELEASE);

    expect(result.every((row) => row.dayIndex !== 2)).toBe(true);
  });

  it("plays Day 2 card on Day 2 after 9:00 AM HKT", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_AFTER_RELEASE);

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(2);
  });

  it("before 9:00 AM HKT on Day 2 shows no playable card and no Day 1 fallback", () => {
    expect(findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_BEFORE_RELEASE)).toHaveLength(
      0,
    );
    expect(
      findPlayableCardForToday(cycleWith([day1, day2]), DAY_2_BEFORE_RELEASE),
    ).toBeNull();
  });

  it("orders multiple Day 2 cards by sortOrder", () => {
    const result = findPlayableCardsForToday(
      cycleWith([day1, day2, day2Second]),
      DAY_2_AFTER_RELEASE,
    );

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.sortOrder)).toEqual([0, 1]);
  });

  it("plays mixed SIGNAL and REST Day 2 cards on Day 2 only", () => {
    const result = findPlayableCardsForToday(
      cycleWith([day1, day2, day2Rest]),
      DAY_2_AFTER_RELEASE,
    );

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.cardType)).toEqual(["SIGNAL", "REST"]);

    const day1Only = findPlayableCardsForToday(
      cycleWith([day1Rest, day2, day2Rest]),
      DAY_2_AFTER_RELEASE,
    );
    expect(day1Only.every((row) => row.dayIndex === 2)).toBe(true);
    expect(day1Only.some((row) => row.id === day1Rest.id)).toBe(false);
  });

  it("does not surface Day 1 at Day 2 release boundary when Day 1 was unplayed", () => {
    const playable = findPlayableCardForToday(cycleWith([day1, day2]), DAY_2_AT_RELEASE);

    expect(playable?.dayIndex).toBe(2);
    expect(playable?.id).toBe(day2.id);
  });
});

describe("submitMarketPulseDecision — today-only playability", () => {

  function buildCycleCard(overrides: Partial<ReturnType<typeof card>> = {}) {
    const base = card({ dayIndex: 1, ...overrides });
    return {
      ...base,
      cycle: {
        id: TEST_CYCLE_ID,
        name: "July QA",
        status: "OPEN" as const,
        startsAt: CYCLE_START_HKT,
        endsAt: CYCLE_REVEAL,
        revealAt: CYCLE_REVEAL,
      },
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    prismaMocks.userFindUnique.mockResolvedValue({ id: TEST_USER_ID, role: "USER" });
    prismaMocks.decisionFindUnique.mockResolvedValue(null);
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      id: "settings",
      runtimeStatus: "OPEN",
      activeCycleId: TEST_CYCLE_ID,
      activeCycle: null,
    });
    prismaMocks.decisionCreate.mockResolvedValue({
      id: "decision-1",
      decision: "BULLISH",
      decidedAt: new Date(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupActiveCycle(cards: ReturnType<typeof buildCycleCard>[]) {
    const cycle = {
      id: TEST_CYCLE_ID,
      name: "July QA",
      status: "OPEN" as const,
      startsAt: CYCLE_START_HKT,
      endsAt: CYCLE_REVEAL,
      revealAt: CYCLE_REVEAL,
      cards: cards.map((row) => {
        const { cycle: _ignored, ...cardRow } = row;
        void _ignored;
        return cardRow;
      }),
    };
    prismaMocks.cycleFindUnique.mockResolvedValue(cycle);
    prismaMocks.cycleFindFirst.mockResolvedValue(cycle);
    return cycle;
  }

  it("rejects submitting Day 1 card on Day 2", async () => {
    vi.setSystemTime(DAY_2_AFTER_RELEASE);
    const day1Card = buildCycleCard({ id: "card-day-1", dayIndex: 1 });
    setupActiveCycle([day1Card, buildCycleCard({ id: "card-day-2", dayIndex: 2 })]);
    prismaMocks.cardFindUnique.mockResolvedValue(day1Card);

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: day1Card.id,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not available for decisions right now");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects submitting Day 2 card on Day 1", async () => {
    vi.setSystemTime(DAY_1_AFTER_RELEASE);
    const day2Card = buildCycleCard({ id: "card-day-2", dayIndex: 2 });
    setupActiveCycle([buildCycleCard({ id: "card-day-1", dayIndex: 1 }), day2Card]);
    prismaMocks.cardFindUnique.mockResolvedValue(day2Card);

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: day2Card.id,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not available for decisions right now");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("allows submitting today's card on the matching HKT day", async () => {
    vi.setSystemTime(DAY_2_AFTER_RELEASE);
    const day2Card = buildCycleCard({ id: "card-day-2", dayIndex: 2 });
    setupActiveCycle([buildCycleCard({ id: "card-day-1", dayIndex: 1 }), day2Card]);
    prismaMocks.cardFindUnique.mockResolvedValue(day2Card);

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: day2Card.id,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(true);
    expect(prismaMocks.decisionCreate).toHaveBeenCalledTimes(1);
  });
});
