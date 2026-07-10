import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findActiveScheduleDayIndex,
  findPlayableCardForToday,
  findPlayableCardsForToday,
  getCardActiveWindowEnd,
  getCardAvailableAt,
  isCardWithinActivePlayWindow,
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
const CYCLE_REVEAL = new Date("2026-07-12T16:00:00.000Z");

/** 2026-07-01 09:05 HKT */
const DAY_1_AFTER_RELEASE = new Date("2026-07-01T01:05:00.000Z");
/** 2026-07-10 22:00 HKT */
const JUL_10_2200_HKT = new Date("2026-07-10T14:00:00.000Z");
/** 2026-07-11 08:59 HKT */
const JUL_11_0859_HKT = new Date("2026-07-11T00:59:00.000Z");
/** 2026-07-11 09:00 HKT */
const JUL_11_0900_HKT = new Date("2026-07-11T01:00:00.000Z");
/** 2026-07-11 09:01 HKT */
const JUL_11_0901_HKT = new Date("2026-07-11T01:01:00.000Z");
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

describe("active-window playability (HKT schedule days)", () => {
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

  it("keeps Day 1 active overnight before Day 2 9:00 AM HKT", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_BEFORE_RELEASE);

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(1);
    expect(result[0]?.id).toBe(day1.id);
  });

  it("does not play Day 2 card before its 9:00 AM HKT release", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_BEFORE_RELEASE);

    expect(result.every((row) => row.dayIndex !== 2)).toBe(true);
  });

  it("does not play Day 2 card on Day 1 before Day 2 release window", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_1_AFTER_RELEASE);

    expect(result.every((row) => row.dayIndex !== 2)).toBe(true);
  });

  it("plays Day 2 card on Day 2 after 9:00 AM HKT", () => {
    const result = findPlayableCardsForToday(cycleWith([day1, day2]), DAY_2_AFTER_RELEASE);

    expect(result).toHaveLength(1);
    expect(result[0]?.dayIndex).toBe(2);
  });

  it("does not surface Day 1 at Day 2 release boundary when Day 1 was unplayed", () => {
    const playable = findPlayableCardForToday(cycleWith([day1, day2]), DAY_2_AT_RELEASE);

    expect(playable?.dayIndex).toBe(2);
    expect(playable?.id).toBe(day2.id);
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

  it("does not allow submitting to Day 1 after Day 2 becomes active", () => {
    const cycle = cycleWith([day1, day2]);
    expect(isCardWithinActivePlayWindow(day1, cycle, cycle.cards, DAY_2_AFTER_RELEASE)).toBe(
      false,
    );
    expect(isCardWithinActivePlayWindow(day2, cycle, cycle.cards, DAY_2_AFTER_RELEASE)).toBe(
      true,
    );
  });
});

describe("seamless overnight card windows (Card A Jul 10 / Card B Jul 11)", () => {
  const cardA = card({ id: "card-a", dayIndex: 10, headline: "Card A" });
  const cardB = card({ id: "card-b", dayIndex: 11, headline: "Card B" });
  const cycle = cycleWith([cardA, cardB]);

  it("keeps Card A active at 2026-07-10 22:00 HKT", () => {
    const result = findPlayableCardsForToday(cycle, JUL_10_2200_HKT);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(cardA.id);
    expect(findActiveScheduleDayIndex(cycle.cards, cycle, JUL_10_2200_HKT)).toBe(10);
  });

  it("keeps Card A active at 2026-07-11 08:59 HKT before Card B release", () => {
    const result = findPlayableCardsForToday(cycle, JUL_11_0859_HKT);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(cardA.id);
    expect(result.some((row) => row.id === cardB.id)).toBe(false);
  });

  it("switches to Card B at 2026-07-11 09:00 HKT", () => {
    const result = findPlayableCardsForToday(cycle, JUL_11_0900_HKT);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(cardB.id);
    expect(isCardWithinActivePlayWindow(cardA, cycle, cycle.cards, JUL_11_0900_HKT)).toBe(
      false,
    );
  });

  it("keeps Card B active at 2026-07-11 09:01 HKT", () => {
    const result = findPlayableCardsForToday(cycle, JUL_11_0901_HKT);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(cardB.id);
  });

  it("exposes Card A window end at Card B availableAt", () => {
    const windowEnd = getCardActiveWindowEnd(cardA, cycle.startsAt, cycle.cards);
    const cardBAvailableAt = getCardAvailableAt(cardB, cycle.startsAt);

    expect(windowEnd?.getTime()).toBe(cardBAvailableAt.getTime());
    expect(windowEnd?.getTime()).toBe(JUL_11_0900_HKT.getTime());
  });

  it("returns no playable cards when nothing has been released yet", () => {
    const early = new Date("2026-06-30T16:30:00.000Z");
    expect(findPlayableCardsForToday(cycle, early)).toHaveLength(0);
  });
});

describe("submitMarketPulseDecision — active-window playability", () => {

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

  it("rejects submitting Day 1 card after Day 2 becomes active", async () => {
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

  it("rejects submitting Day 2 card before its release window", async () => {
    vi.setSystemTime(DAY_2_BEFORE_RELEASE);
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

  it("allows submitting Day 1 card overnight before Day 2 release", async () => {
    vi.setSystemTime(DAY_2_BEFORE_RELEASE);
    const day1Card = buildCycleCard({ id: "card-day-1", dayIndex: 1 });
    setupActiveCycle([day1Card, buildCycleCard({ id: "card-day-2", dayIndex: 2 })]);
    prismaMocks.cardFindUnique.mockResolvedValue(day1Card);

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: day1Card.id,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(true);
    expect(prismaMocks.decisionCreate).toHaveBeenCalledTimes(1);
  });

  it("allows submitting the active card after the next day releases", async () => {
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
