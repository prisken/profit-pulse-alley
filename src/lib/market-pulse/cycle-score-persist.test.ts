import { beforeEach, describe, expect, it, vi } from "vitest";

import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import {
  CYCLE_REVEAL_PAST,
  TEST_CYCLE_ID,
  TEST_USER_ID,
  TEST_USER_ID_2,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cardCount: vi.fn(),
  decisionFindMany: vi.fn(),
  scoreEventDeleteMany: vi.fn(),
  scoreEventCreateMany: vi.fn(),
  cycleScoreDeleteMany: vi.fn(),
  cycleScoreCreateMany: vi.fn(),
  decisionGroupBy: vi.fn(),
  scoreEventGroupBy: vi.fn(),
  userFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    marketPulseCard: {
      count: prismaMocks.cardCount,
    },
    marketPulseDecision: {
      findMany: prismaMocks.decisionFindMany,
      groupBy: prismaMocks.decisionGroupBy,
    },
    marketPulseScoreEvent: {
      deleteMany: prismaMocks.scoreEventDeleteMany,
      createMany: prismaMocks.scoreEventCreateMany,
      groupBy: prismaMocks.scoreEventGroupBy,
    },
    marketPulseScore: {
      deleteMany: prismaMocks.cycleScoreDeleteMany,
      createMany: prismaMocks.cycleScoreCreateMany,
      findUnique: vi.fn(),
    },
    user: {
      findMany: prismaMocks.userFindMany,
    },
    $transaction: prismaMocks.transaction,
  },
}));

import { calculateAndPersistCycleScores } from "@/lib/market-pulse/server";

function decisionRecord(
  userId: string,
  cardId: string,
  dayIndex: number,
  decision: "BULLISH" | "CAUTIOUS",
  ppaSignal: "BULLISH" | "CAUTIOUS",
) {
  return {
    id: `decision-${cardId}`,
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

beforeEach(() => {
  vi.clearAllMocks();
  prismaMocks.transaction.mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        marketPulseScoreEvent: {
          deleteMany: prismaMocks.scoreEventDeleteMany,
          createMany: prismaMocks.scoreEventCreateMany,
        },
        marketPulseScore: {
          deleteMany: prismaMocks.cycleScoreDeleteMany,
          createMany: prismaMocks.cycleScoreCreateMany,
        },
      }),
  );
  prismaMocks.cycleFindUnique.mockResolvedValue({
    id: TEST_CYCLE_ID,
    status: "REVEALED",
    revealAt: CYCLE_REVEAL_PAST,
  });
  prismaMocks.cardCount.mockResolvedValue(3);
  prismaMocks.userFindMany.mockResolvedValue([
    { id: TEST_USER_ID, name: "Player One", image: null },
    { id: TEST_USER_ID_2, name: "Player Two", image: null },
  ]);
  prismaMocks.decisionGroupBy.mockResolvedValue([]);
  prismaMocks.scoreEventGroupBy.mockImplementation((args: { _sum?: unknown; _count?: unknown }) => {
    if (args._count) {
      return [
        { userId: TEST_USER_ID, _count: { _all: 2 } },
        { userId: TEST_USER_ID_2, _count: { _all: 1 } },
      ];
    }
    return [
      {
        userId: TEST_USER_ID,
        _sum: {
          participationPoints: 20,
          matchBonus: 50,
          streakBonus: 0,
          totalPoints: 70,
        },
      },
    ];
  });
});

describe("calculateAndPersistCycleScores", () => {
  it("stores participationScore, decisionsSubmitted, and totalCards per user", async () => {
    prismaMocks.decisionFindMany.mockResolvedValue([
      decisionRecord(TEST_USER_ID, "card-1", 0, "BULLISH", "BULLISH"),
      decisionRecord(TEST_USER_ID, "card-2", 1, "CAUTIOUS", "BULLISH"),
      decisionRecord(TEST_USER_ID_2, "card-3", 2, "BULLISH", "BULLISH"),
    ]);

    await calculateAndPersistCycleScores(TEST_CYCLE_ID);

    expect(prismaMocks.cycleScoreDeleteMany).toHaveBeenCalledWith({
      where: { cycleId: TEST_CYCLE_ID },
    });
    expect(prismaMocks.cycleScoreCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          userId: TEST_USER_ID,
          cycleId: TEST_CYCLE_ID,
          participationScore: 2 * PARTICIPATION_POINTS,
          decisionsSubmitted: 2,
          totalCards: 3,
        },
        {
          userId: TEST_USER_ID_2,
          cycleId: TEST_CYCLE_ID,
          participationScore: PARTICIPATION_POINTS,
          decisionsSubmitted: 1,
          totalCards: 3,
        },
      ]),
    });
  });

  it("does not change total score event points when persisting participation aggregates", async () => {
    prismaMocks.decisionFindMany.mockResolvedValue([
      decisionRecord(TEST_USER_ID, "card-1", 0, "BULLISH", "BULLISH"),
      decisionRecord(TEST_USER_ID, "card-2", 1, "BULLISH", "BULLISH"),
      decisionRecord(TEST_USER_ID, "card-3", 2, "BULLISH", "BULLISH"),
    ]);

    await calculateAndPersistCycleScores(TEST_CYCLE_ID);

    const eventPayload = prismaMocks.scoreEventCreateMany.mock.calls[0]?.[0]
      ?.data as Array<{ totalPoints: number; participationPoints: number }>;
    const totalFromEvents = eventPayload.reduce(
      (sum, event) => sum + event.totalPoints,
      0,
    );
    const participationFromEvents = eventPayload.reduce(
      (sum, event) => sum + event.participationPoints,
      0,
    );

    const scorePayload = prismaMocks.cycleScoreCreateMany.mock.calls[0]?.[0]
      ?.data as Array<{ participationScore: number }>;
    const participationFromScores = scorePayload.reduce(
      (sum, row) => sum + row.participationScore,
      0,
    );

    expect(participationFromScores).toBe(participationFromEvents);
    expect(totalFromEvents).toBeGreaterThan(participationFromEvents);
  });
});
