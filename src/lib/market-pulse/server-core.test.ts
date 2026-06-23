import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CYCLE_END,
  CYCLE_REVEAL_FUTURE,
  CYCLE_REVEAL_PAST,
  CYCLE_START,
  FIXED_NOW,
  PLAYABLE_DAY_INDEX,
  TEST_CARD_ID,
  TEST_CYCLE_ID,
  TEST_DECISION_ID,
  TEST_SETTINGS_ID,
  TEST_USER_ID,
  TEST_USER_ID_2,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  decisionFindUnique: vi.fn(),
  decisionCreate: vi.fn(),
  decisionGroupBy: vi.fn(),
  cardFindUnique: vi.fn(),
  gameSettingFindFirst: vi.fn(),
  cycleFindUnique: vi.fn(),
  cycleFindFirst: vi.fn(),
  scoreEventGroupBy: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: prismaMocks.userFindUnique,
      findMany: prismaMocks.userFindMany,
    },
    marketPulseDecision: {
      findUnique: prismaMocks.decisionFindUnique,
      create: prismaMocks.decisionCreate,
      groupBy: prismaMocks.decisionGroupBy,
    },
    marketPulseCard: {
      findUnique: prismaMocks.cardFindUnique,
    },
    marketPulseGameSetting: {
      findFirst: prismaMocks.gameSettingFindFirst,
      create: vi.fn(),
    },
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
      findFirst: prismaMocks.cycleFindFirst,
    },
    marketPulseScoreEvent: {
      groupBy: prismaMocks.scoreEventGroupBy,
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import {
  getMarketPulseLeaderboard,
  submitMarketPulseDecision,
} from "@/lib/market-pulse/server";

function buildPlayableCard(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_CARD_ID,
    cycleId: TEST_CYCLE_ID,
    dayIndex: PLAYABLE_DAY_INDEX,
    status: "PUBLISHED",
    publishedAt: CYCLE_START,
    ppaSignalLockedAt: CYCLE_START,
    revealAt: null,
    cycle: {
      id: TEST_CYCLE_ID,
      name: "Test Cycle",
      status: "OPEN",
      startsAt: CYCLE_START,
      endsAt: CYCLE_END,
      revealAt: CYCLE_REVEAL_FUTURE,
    },
    ...overrides,
  };
}

function buildActiveCycleWithCards(cards: ReturnType<typeof buildPlayableCard>[]) {
  return {
    id: TEST_CYCLE_ID,
    name: "Test Cycle",
    status: "OPEN",
    startsAt: CYCLE_START,
    endsAt: CYCLE_END,
    revealAt: CYCLE_REVEAL_FUTURE,
    cards,
  };
}

function setupOpenRuntime() {
  prismaMocks.userFindUnique.mockResolvedValue({ id: TEST_USER_ID });
  prismaMocks.gameSettingFindFirst.mockResolvedValue({
    id: TEST_SETTINGS_ID,
    runtimeStatus: "OPEN",
    activeCycleId: TEST_CYCLE_ID,
    activeCycle: null,
  });
  prismaMocks.cycleFindUnique.mockResolvedValue(
    buildActiveCycleWithCards([buildPlayableCard()]),
  );
  prismaMocks.cardFindUnique.mockResolvedValue(buildPlayableCard());
}

describe("submitMarketPulseDecision", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    prismaMocks.decisionFindUnique.mockResolvedValue(null);
    prismaMocks.decisionCreate.mockResolvedValue({
      id: TEST_DECISION_ID,
      decision: "BULLISH",
      decidedAt: FIXED_NOW,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates one MarketPulseDecision for a valid submission", async () => {
    setupOpenRuntime();

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySubmitted).toBe(false);
      expect(result.decision.id).toBe(TEST_DECISION_ID);
    }
    expect(prismaMocks.decisionCreate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.decisionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: TEST_USER_ID,
          cardId: TEST_CARD_ID,
          cycleId: TEST_CYCLE_ID,
          decision: "BULLISH",
        }),
      }),
    );
  });

  it("does not create a duplicate row when decision already exists", async () => {
    setupOpenRuntime();
    prismaMocks.decisionFindUnique.mockResolvedValue({
      id: TEST_DECISION_ID,
      decision: "BULLISH",
      decidedAt: FIXED_NOW,
    });

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySubmitted).toBe(true);
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid decision values", async () => {
    setupOpenRuntime();

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "MAYBE",
    });

    expect(result).toEqual({
      ok: false,
      error: "Decision must be BULLISH or CAUTIOUS.",
    });
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects when runtime status is closed", async () => {
    setupOpenRuntime();
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      id: TEST_SETTINGS_ID,
      runtimeStatus: "CLOSED",
      activeCycleId: TEST_CYCLE_ID,
      activeCycle: null,
    });

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not open");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects when cycle is not open", async () => {
    setupOpenRuntime();
    prismaMocks.cardFindUnique.mockResolvedValue(
      buildPlayableCard({
        cycle: {
          id: TEST_CYCLE_ID,
          name: "Test Cycle",
          status: "REVEALED",
          startsAt: CYCLE_START,
          endsAt: CYCLE_END,
          revealAt: CYCLE_REVEAL_FUTURE,
        },
      }),
    );

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not open");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects unpublished cards", async () => {
    setupOpenRuntime();
    prismaMocks.cardFindUnique.mockResolvedValue(
      buildPlayableCard({ status: "DRAFT" }),
    );

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not published");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects when PPA signal is not locked", async () => {
    setupOpenRuntime();
    prismaMocks.cardFindUnique.mockResolvedValue(
      buildPlayableCard({ ppaSignalLockedAt: null }),
    );

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not ready");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects decisions after reveal deadline", async () => {
    setupOpenRuntime();
    prismaMocks.cardFindUnique.mockResolvedValue(
      buildPlayableCard({
        cycle: {
          id: TEST_CYCLE_ID,
          name: "Test Cycle",
          status: "OPEN",
          startsAt: CYCLE_START,
          endsAt: CYCLE_END,
          revealAt: CYCLE_REVEAL_PAST,
        },
      }),
    );
    prismaMocks.cycleFindUnique.mockResolvedValue(
      buildActiveCycleWithCards([
        buildPlayableCard({
          cycle: {
            id: TEST_CYCLE_ID,
            name: "Test Cycle",
            status: "OPEN",
            startsAt: CYCLE_START,
            endsAt: CYCLE_END,
            revealAt: CYCLE_REVEAL_PAST,
          },
        }),
      ]),
    );

    const result = await submitMarketPulseDecision({
      userId: TEST_USER_ID,
      cardId: TEST_CARD_ID,
      decision: "BULLISH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("window for this card has closed");
    }
    expect(prismaMocks.decisionCreate).not.toHaveBeenCalled();
  });
});

describe("getMarketPulseLeaderboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    prismaMocks.userFindMany.mockResolvedValue([
      { id: TEST_USER_ID, name: "Player One", image: null },
      { id: TEST_USER_ID_2, name: "Player Two", image: null },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows participation-only standings before reveal", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: TEST_CYCLE_ID,
      status: "OPEN",
      revealAt: CYCLE_REVEAL_FUTURE,
    });
    prismaMocks.decisionGroupBy.mockResolvedValue([
      { userId: TEST_USER_ID, _count: { _all: 2 } },
      { userId: TEST_USER_ID_2, _count: { _all: 1 } },
    ]);

    const entries = await getMarketPulseLeaderboard({
      mode: "CURRENT_CYCLE",
      cycleId: TEST_CYCLE_ID,
      limit: 10,
    });

    expect(prismaMocks.decisionGroupBy).toHaveBeenCalled();
    expect(prismaMocks.scoreEventGroupBy).not.toHaveBeenCalled();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      userId: TEST_USER_ID,
      score: 20,
      participationPoints: 20,
      bonusPoints: 0,
      isRevealed: false,
      playerName: "Player One",
    });
  });

  it("shows final score events after reveal", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: TEST_CYCLE_ID,
      status: "REVEALED",
      revealAt: CYCLE_REVEAL_PAST,
    });
    prismaMocks.scoreEventGroupBy
      .mockResolvedValueOnce([
        {
          userId: TEST_USER_ID,
          _sum: {
            participationPoints: 20,
            matchBonus: 50,
            streakBonus: 0,
            totalPoints: 70,
          },
        },
      ])
      .mockResolvedValueOnce([
        { userId: TEST_USER_ID, _count: { _all: 2 } },
      ]);

    const entries = await getMarketPulseLeaderboard({
      mode: "CURRENT_CYCLE",
      cycleId: TEST_CYCLE_ID,
      limit: 10,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      userId: TEST_USER_ID,
      score: 70,
      participationPoints: 20,
      bonusPoints: 50,
      isRevealed: true,
      playerName: "Player One",
    });
    expect(prismaMocks.decisionGroupBy).not.toHaveBeenCalled();
  });
});
