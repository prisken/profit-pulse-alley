import { describe, expect, it } from "vitest";

import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
} from "@/lib/market-pulse/constants";
import {
  TEST_CARD_ID,
  TEST_CYCLE_ID,
  TEST_USER_ID,
} from "@/lib/market-pulse/market-pulse-test-fixtures";
import { buildScoreEventsForUser, computeSignalMatchStreak } from "@/lib/market-pulse/score-calculation";

function decisionRow(
  dayIndex: number,
  decision: "BULLISH" | "CAUTIOUS",
  ppaSignal: "BULLISH" | "CAUTIOUS" | null,
  cardId = `card-day-${dayIndex}`,
  options: { sortOrder?: number; createdAt?: string } = {},
) {
  return {
    userId: TEST_USER_ID,
    cardId,
    decision,
    card: {
      id: cardId,
      dayIndex,
      sortOrder: options.sortOrder ?? 0,
      createdAt: options.createdAt ?? "2026-06-01T00:00:00.000Z",
      ppaSignal,
    },
  };
}

describe("buildScoreEventsForUser", () => {
  it("awards +10 participation per card", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "CAUTIOUS"),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      participationPoints: PARTICIPATION_POINTS,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
    });
  });

  it("awards +50 match bonus when decision matches PPA signal", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "BULLISH"),
    ]);

    expect(events[0]).toMatchObject({
      participationPoints: PARTICIPATION_POINTS,
      matchBonus: MATCH_BONUS_POINTS,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS + MATCH_BONUS_POINTS,
    });
  });

  it("awards no match bonus when decision does not match PPA signal", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "CAUTIOUS", "BULLISH"),
    ]);

    expect(events[0]?.matchBonus).toBe(0);
    expect(events[0]?.totalPoints).toBe(PARTICIPATION_POINTS);
  });

  it("awards +100 streak bonus on every 3 consecutive matches", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "BULLISH", "card-0"),
      decisionRow(1, "BULLISH", "BULLISH", "card-1"),
      decisionRow(2, "BULLISH", "BULLISH", "card-2"),
      decisionRow(3, "CAUTIOUS", "CAUTIOUS", "card-3"),
      decisionRow(4, "CAUTIOUS", "CAUTIOUS", "card-4"),
      decisionRow(5, "CAUTIOUS", "CAUTIOUS", "card-5"),
    ]);

    expect(events[2]).toMatchObject({
      matchBonus: MATCH_BONUS_POINTS,
      streakBonus: STREAK_BONUS_POINTS,
      totalPoints:
        PARTICIPATION_POINTS + MATCH_BONUS_POINTS + STREAK_BONUS_POINTS,
    });
    expect(events[5]).toMatchObject({
      matchBonus: MATCH_BONUS_POINTS,
      streakBonus: STREAK_BONUS_POINTS,
    });
  });

  it("resets streak after a non-match", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "BULLISH", "card-0"),
      decisionRow(1, "BULLISH", "BULLISH", "card-1"),
      decisionRow(2, "CAUTIOUS", "BULLISH", "card-2"),
      decisionRow(3, "BULLISH", "BULLISH", "card-3"),
    ]);

    expect(events[1]?.streakBonus).toBe(0);
    expect(events[2]?.matchBonus).toBe(0);
    expect(events[3]?.streakBonus).toBe(0);
  });

  it("sorts cards by dayIndex before scoring", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(2, "BULLISH", "BULLISH", "card-2"),
      decisionRow(0, "BULLISH", "BULLISH", "card-0"),
      decisionRow(1, "BULLISH", "BULLISH", "card-1"),
    ]);

    expect(events.map((event) => event.cardId)).toEqual([
      "card-0",
      "card-1",
      "card-2",
    ]);
    expect(events[2]?.streakBonus).toBe(STREAK_BONUS_POINTS);
  });

  it("scores two cards on the same day as separate events", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(3, "BULLISH", "BULLISH", "card-a", {
        sortOrder: 0,
        createdAt: "2026-06-01T09:00:00.000Z",
      }),
      decisionRow(3, "CAUTIOUS", "CAUTIOUS", "card-b", {
        sortOrder: 1,
        createdAt: "2026-06-01T10:00:00.000Z",
      }),
    ]);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.cardId)).toEqual(["card-a", "card-b"]);
    expect(events[0]?.participationPoints).toBe(PARTICIPATION_POINTS);
    expect(events[1]?.participationPoints).toBe(PARTICIPATION_POINTS);
    expect(events[0]?.matchBonus).toBe(MATCH_BONUS_POINTS);
    expect(events[1]?.matchBonus).toBe(MATCH_BONUS_POINTS);
  });

  it("orders same-day cards by sortOrder then createdAt for streaks", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(2, "BULLISH", "BULLISH", "card-late", {
        sortOrder: 1,
        createdAt: "2026-06-03T12:00:00.000Z",
      }),
      decisionRow(2, "BULLISH", "BULLISH", "card-early", {
        sortOrder: 0,
        createdAt: "2026-06-03T09:00:00.000Z",
      }),
      decisionRow(2, "BULLISH", "BULLISH", "card-third", {
        sortOrder: 2,
        createdAt: "2026-06-03T15:00:00.000Z",
      }),
    ]);

    expect(events.map((event) => event.cardId)).toEqual([
      "card-early",
      "card-late",
      "card-third",
    ]);
    expect(events[2]?.streakBonus).toBe(STREAK_BONUS_POINTS);
  });

  it("tags each event with cycle and card metadata", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(4, "CAUTIOUS", "BULLISH", TEST_CARD_ID),
    ]);

    expect(events[0]).toMatchObject({
      userId: TEST_USER_ID,
      cycleId: TEST_CYCLE_ID,
      cardId: TEST_CARD_ID,
      reason: `cycle_score:card:${TEST_CARD_ID}:day:4`,
    });
  });

  function restRow(
    dayIndex: number,
    cardId = `rest-day-${dayIndex}`,
    options: { sortOrder?: number; createdAt?: string } = {},
  ) {
    return {
      userId: TEST_USER_ID,
      cardId,
      decision: "ACKNOWLEDGED" as const,
      card: {
        id: cardId,
        dayIndex,
        sortOrder: options.sortOrder ?? 0,
        createdAt: options.createdAt ?? "2026-06-01T00:00:00.000Z",
        cardType: "REST" as const,
        ppaSignal: null,
      },
    };
  }

  it("awards +10 participation only for acknowledged rest cards", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      restRow(1, "rest-1"),
    ]);

    expect(events[0]).toMatchObject({
      participationPoints: PARTICIPATION_POINTS,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
    });
  });

  it("does not reset signal streak when a rest card is played between matches", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "BULLISH", "sig-0"),
      restRow(1, "rest-1"),
      decisionRow(2, "BULLISH", "BULLISH", "sig-2"),
      decisionRow(3, "BULLISH", "BULLISH", "sig-3"),
    ]);

    expect(events.map((event) => event.cardId)).toEqual([
      "sig-0",
      "rest-1",
      "sig-2",
      "sig-3",
    ]);
    expect(events[1]).toMatchObject({
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
    });
    expect(events[3]?.streakBonus).toBe(STREAK_BONUS_POINTS);
  });

  it("earns streak bonus across three matching signals with rest cards between them", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(0, "BULLISH", "BULLISH", "sig-0"),
      restRow(1, "rest-1"),
      decisionRow(2, "BULLISH", "BULLISH", "sig-2"),
      restRow(3, "rest-2"),
      decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
    ]);

    expect(events[4]?.streakBonus).toBe(STREAK_BONUS_POINTS);
    expect(events[4]?.matchBonus).toBe(MATCH_BONUS_POINTS);
  });

  it("scores canonical REST-neutral streak example: signal, rest, signal, signal → 290 total", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
      restRow(2, "rest-2"),
      decisionRow(3, "BULLISH", "BULLISH", "sig-3"),
      decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
    ]);

    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({
      cardId: "sig-1",
      participationPoints: 10,
      matchBonus: 50,
      streakBonus: 0,
      totalPoints: 60,
    });
    expect(events[1]).toMatchObject({
      cardId: "rest-2",
      participationPoints: 10,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: 10,
    });
    expect(events[2]).toMatchObject({
      cardId: "sig-3",
      participationPoints: 10,
      matchBonus: 50,
      streakBonus: 0,
      totalPoints: 60,
    });
    expect(events[3]).toMatchObject({
      cardId: "sig-4",
      participationPoints: 10,
      matchBonus: 50,
      streakBonus: 100,
      totalPoints: 160,
    });

    const totals = events.reduce(
      (acc, event) => ({
        participation: acc.participation + event.participationPoints,
        match: acc.match + event.matchBonus,
        streak: acc.streak + event.streakBonus,
        total: acc.total + event.totalPoints,
      }),
      { participation: 0, match: 0, streak: 0, total: 0 },
    );

    expect(totals).toEqual({
      participation: 40,
      match: 150,
      streak: 100,
      total: 290,
    });
  });

  it("skips multiple rest cards without breaking signal streak progression", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
      restRow(2, "rest-a"),
      restRow(3, "rest-b"),
      decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
      decisionRow(5, "BULLISH", "BULLISH", "sig-5"),
    ]);

    expect(events[4]?.streakBonus).toBe(STREAK_BONUS_POINTS);
    expect(events[1]).toMatchObject({
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
    });
    expect(events[2]).toMatchObject({
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
    });
  });

  it("resets signal streak to 0 after a wrong SIGNAL even when rest cards were skipped", () => {
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, [
      decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
      restRow(2, "rest-2"),
      decisionRow(3, "CAUTIOUS", "BULLISH", "sig-3"),
      decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
      decisionRow(5, "BULLISH", "BULLISH", "sig-5"),
      decisionRow(6, "BULLISH", "BULLISH", "sig-6"),
    ]);

    expect(events[2]?.matchBonus).toBe(0);
    expect(events[2]?.streakBonus).toBe(0);
    expect(events[4]?.streakBonus).toBe(0);
    expect(events[5]?.streakBonus).toBe(STREAK_BONUS_POINTS);
  });

  describe("REST-neutral streak behavior", () => {
    it("SIGNAL correct → REST acknowledged → SIGNAL correct → SIGNAL correct earns one +100 streak bonus", () => {
      const decisions = [
        decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
        restRow(2, "rest-2"),
        decisionRow(3, "BULLISH", "BULLISH", "sig-3"),
        decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
      ];
      const events = buildScoreEventsForUser(TEST_CYCLE_ID, decisions);

      expect(events.filter((event) => event.streakBonus > 0)).toHaveLength(1);
      expect(events[3]?.streakBonus).toBe(STREAK_BONUS_POINTS);
      expect(computeSignalMatchStreak(decisions)).toBe(3);
    });

    it("SIGNAL correct → REST acknowledged → SIGNAL wrong resets streak to 0", () => {
      const decisions = [
        decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
        restRow(2, "rest-2"),
        decisionRow(3, "CAUTIOUS", "BULLISH", "sig-3"),
      ];
      const events = buildScoreEventsForUser(TEST_CYCLE_ID, decisions);

      expect(events[2]).toMatchObject({
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: PARTICIPATION_POINTS,
      });
      expect(computeSignalMatchStreak(decisions)).toBe(0);
    });

    it("SIGNAL correct → REST acknowledged → REST acknowledged → SIGNAL correct gives streak count 2, no bonus yet", () => {
      const decisions = [
        decisionRow(1, "BULLISH", "BULLISH", "sig-1"),
        restRow(2, "rest-a"),
        restRow(3, "rest-b"),
        decisionRow(4, "BULLISH", "BULLISH", "sig-4"),
      ];
      const events = buildScoreEventsForUser(TEST_CYCLE_ID, decisions);

      expect(events[3]).toMatchObject({
        matchBonus: MATCH_BONUS_POINTS,
        streakBonus: 0,
        totalPoints: PARTICIPATION_POINTS + MATCH_BONUS_POINTS,
      });
      expect(computeSignalMatchStreak(decisions)).toBe(2);
    });

    it("REST-only cycle awards participation only and no streak", () => {
      const decisions = [restRow(1, "rest-1"), restRow(2, "rest-2"), restRow(3, "rest-3")];
      const events = buildScoreEventsForUser(TEST_CYCLE_ID, decisions);

      expect(events).toHaveLength(3);
      expect(events.every((event) => event.totalPoints === PARTICIPATION_POINTS)).toBe(
        true,
      );
      expect(events.every((event) => event.matchBonus === 0)).toBe(true);
      expect(events.every((event) => event.streakBonus === 0)).toBe(true);
      expect(computeSignalMatchStreak(decisions)).toBe(0);
    });
  });
});
