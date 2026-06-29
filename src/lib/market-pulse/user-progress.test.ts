import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import {
  CYCLE_REVEAL_FUTURE,
  CYCLE_REVEAL_PAST,
  CYCLE_START,
  FIXED_NOW,
  TEST_CYCLE_ID,
  TEST_USER_ID,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cycleFindFirst: vi.fn(),
  decisionFindMany: vi.fn(),
  cycleScoreFindUnique: vi.fn(),
  scoreEventAggregate: vi.fn(),
  decisionGroupBy: vi.fn(),
  scoreEventGroupBy: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
      findFirst: prismaMocks.cycleFindFirst,
    },
    marketPulseDecision: {
      findMany: prismaMocks.decisionFindMany,
      groupBy: prismaMocks.decisionGroupBy,
    },
    marketPulseScore: {
      findUnique: prismaMocks.cycleScoreFindUnique,
    },
    marketPulseScoreEvent: {
      aggregate: prismaMocks.scoreEventAggregate,
      groupBy: prismaMocks.scoreEventGroupBy,
    },
    user: {
      findMany: prismaMocks.userFindMany,
    },
    marketPulseGameSetting: {
      findFirst: vi.fn(),
    },
  },
}));

import { getUserMarketPulseProgress } from "@/lib/market-pulse/server";

function buildCycleWithCards(cardStatuses: Array<"PUBLISHED" | "REVEALED">) {
  return {
    id: TEST_CYCLE_ID,
    name: "Test Cycle",
    status: "REVEALED" as const,
    startsAt: CYCLE_START,
    endsAt: CYCLE_REVEAL_FUTURE,
    revealAt: CYCLE_REVEAL_PAST,
    cards: cardStatuses.map((status, index) => ({
      id: `card-${index}`,
      cycleId: TEST_CYCLE_ID,
      dayIndex: index,
      status,
      publishedAt: CYCLE_START,
      ppaSignal: "BULLISH" as const,
    })),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  vi.clearAllMocks();
  prismaMocks.userFindMany.mockResolvedValue([
    { id: TEST_USER_ID, name: "Player One", image: null },
  ]);
  prismaMocks.decisionGroupBy.mockResolvedValue([]);
  prismaMocks.scoreEventGroupBy.mockImplementation((args: { _sum?: unknown; _count?: unknown }) => {
    if (args._count) {
      return [{ userId: TEST_USER_ID, _count: { _all: 2 } }];
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
  prismaMocks.scoreEventAggregate.mockResolvedValue({
    _sum: { totalPoints: 70 },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getUserMarketPulseProgress participation compatibility", () => {
  it("uses stored participationScore when a MarketPulseScore row exists", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      buildCycleWithCards(["REVEALED", "REVEALED", "REVEALED"]),
    );
    prismaMocks.cycleScoreFindUnique.mockResolvedValue({
      participationScore: 30,
      decisionsSubmitted: 3,
      totalCards: 3,
    });
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        decision: "BULLISH",
        card: { dayIndex: 0, ppaSignal: "BULLISH" },
      },
    ]);

    const progress = await getUserMarketPulseProgress(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(progress.participationPoints).toBe(30);
    expect(progress.decisionsCount).toBe(3);
    expect(progress.totalCards).toBe(3);
    expect(progress.totalPoints).toBe(70);
  });

  it("derives participation safely when historical score rows are missing", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      buildCycleWithCards(["REVEALED", "REVEALED"]),
    );
    prismaMocks.cycleScoreFindUnique.mockResolvedValue(null);
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        decision: "BULLISH",
        card: { dayIndex: 0, ppaSignal: "BULLISH" },
      },
      {
        decision: "CAUTIOUS",
        card: { dayIndex: 1, ppaSignal: "BULLISH" },
      },
    ]);

    const progress = await getUserMarketPulseProgress(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(progress.participationPoints).toBe(2 * PARTICIPATION_POINTS);
    expect(progress.decisionsCount).toBe(2);
    expect(progress.totalCards).toBe(2);
    expect(progress.totalPoints).toBe(70);
  });

  it("keeps pre-reveal participation derived from live decisions", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...buildCycleWithCards(["PUBLISHED", "PUBLISHED"]),
      status: "OPEN",
      revealAt: CYCLE_REVEAL_FUTURE,
    });
    prismaMocks.cycleScoreFindUnique.mockResolvedValue(null);
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        decision: "BULLISH",
        card: { dayIndex: 0, ppaSignal: null },
      },
    ]);
    prismaMocks.scoreEventGroupBy.mockResolvedValue([]);
    prismaMocks.decisionGroupBy.mockResolvedValue([
      { userId: TEST_USER_ID, _count: { _all: 1 } },
    ]);

    const progress = await getUserMarketPulseProgress(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(progress.isRevealed).toBe(false);
    expect(progress.participationPoints).toBe(PARTICIPATION_POINTS);
    expect(progress.totalPoints).toBeNull();
    expect(progress.totalCards).toBe(2);
  });
});
