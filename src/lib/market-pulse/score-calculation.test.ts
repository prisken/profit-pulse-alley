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
import { buildScoreEventsForUser } from "@/lib/market-pulse/score-calculation";

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
});
