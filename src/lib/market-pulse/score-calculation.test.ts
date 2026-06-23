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
) {
  return {
    userId: TEST_USER_ID,
    cardId,
    decision,
    card: {
      id: cardId,
      dayIndex,
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
