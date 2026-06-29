import { describe, expect, it } from "vitest";

import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import {
  TEST_CYCLE_ID,
  TEST_USER_ID,
  TEST_USER_ID_2,
} from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  buildCycleUserScoreRows,
  resolveDecisionsSubmitted,
  resolveParticipationScore,
  resolveTotalCards,
} from "@/lib/market-pulse/cycle-user-score";
import { buildScoreEventsForUser } from "@/lib/market-pulse/score-calculation";

function decisionRow(
  userId: string,
  dayIndex: number,
  decision: "BULLISH" | "CAUTIOUS",
  ppaSignal: "BULLISH" | "CAUTIOUS" | null,
  cardId = `card-${userId}-${dayIndex}`,
) {
  return {
    userId,
    cardId,
    decision,
    card: {
      id: cardId,
      dayIndex,
      ppaSignal,
    },
  };
}

describe("buildCycleUserScoreRows", () => {
  it("stores participationScore, decisionsSubmitted, and totalCards per user", () => {
    const userOneDecisions = [
      decisionRow(TEST_USER_ID, 0, "BULLISH", "BULLISH", "c1"),
      decisionRow(TEST_USER_ID, 1, "CAUTIOUS", "BULLISH", "c2"),
    ];
    const userTwoDecisions = [
      decisionRow(TEST_USER_ID_2, 0, "BULLISH", "BULLISH", "c3"),
    ];

    const byUser = new Map([
      [TEST_USER_ID, userOneDecisions],
      [TEST_USER_ID_2, userTwoDecisions],
    ]);

    const events = [
      ...buildScoreEventsForUser(TEST_CYCLE_ID, userOneDecisions),
      ...buildScoreEventsForUser(TEST_CYCLE_ID, userTwoDecisions),
    ];

    const rows = buildCycleUserScoreRows(TEST_CYCLE_ID, byUser, events, 5);

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.userId === TEST_USER_ID)).toEqual({
      userId: TEST_USER_ID,
      cycleId: TEST_CYCLE_ID,
      participationScore: 2 * PARTICIPATION_POINTS,
      decisionsSubmitted: 2,
      totalCards: 5,
    });
    expect(rows.find((row) => row.userId === TEST_USER_ID_2)).toEqual({
      userId: TEST_USER_ID_2,
      cycleId: TEST_CYCLE_ID,
      participationScore: PARTICIPATION_POINTS,
      decisionsSubmitted: 1,
      totalCards: 5,
    });
  });

  it("keeps participationScore aligned with existing per-card scoring", () => {
    const decisions = [
      decisionRow(TEST_USER_ID, 0, "BULLISH", "BULLISH", "c1"),
      decisionRow(TEST_USER_ID, 1, "BULLISH", "BULLISH", "c2"),
      decisionRow(TEST_USER_ID, 2, "BULLISH", "BULLISH", "c3"),
    ];
    const byUser = new Map([[TEST_USER_ID, decisions]]);
    const events = buildScoreEventsForUser(TEST_CYCLE_ID, decisions);
    const totalEventPoints = events.reduce(
      (sum, event) => sum + event.totalPoints,
      0,
    );
    const participationOnly = events.reduce(
      (sum, event) => sum + event.participationPoints,
      0,
    );

    const [row] = buildCycleUserScoreRows(
      TEST_CYCLE_ID,
      byUser,
      events,
      3,
    );

    expect(row?.participationScore).toBe(participationOnly);
    expect(totalEventPoints).toBeGreaterThan(participationOnly);
  });
});

describe("resolveParticipationScore", () => {
  it("uses stored participation when a score row exists", () => {
    expect(
      resolveParticipationScore(
        { participationScore: 30, decisionsSubmitted: 3, totalCards: 5 },
        1,
      ),
    ).toBe(30);
  });

  it("derives participation from decisions when no stored row exists", () => {
    expect(resolveParticipationScore(null, 4)).toBe(4 * PARTICIPATION_POINTS);
  });

  it("safely treats missing stored participation as zero when row exists", () => {
    expect(
      resolveParticipationScore(
        { participationScore: 0, decisionsSubmitted: 0, totalCards: 5 },
        0,
      ),
    ).toBe(0);
  });
});

describe("resolveDecisionsSubmitted", () => {
  it("prefers stored decisionsSubmitted when available", () => {
    expect(
      resolveDecisionsSubmitted(
        { participationScore: 20, decisionsSubmitted: 2, totalCards: 5 },
        99,
      ),
    ).toBe(2);
  });

  it("falls back to live decision count", () => {
    expect(resolveDecisionsSubmitted(null, 3)).toBe(3);
  });
});

describe("resolveTotalCards", () => {
  it("prefers stored totalCards when positive", () => {
    expect(
      resolveTotalCards(
        { participationScore: 10, decisionsSubmitted: 1, totalCards: 7 },
        2,
      ),
    ).toBe(7);
  });

  it("falls back when stored totalCards is zero", () => {
    expect(
      resolveTotalCards(
        { participationScore: 10, decisionsSubmitted: 1, totalCards: 0 },
        4,
      ),
    ).toBe(4);
  });
});
