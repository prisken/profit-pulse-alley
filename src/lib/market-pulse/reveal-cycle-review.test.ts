import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CYCLE_REVEAL_PAST,
  TEST_CYCLE_ID,
  TEST_USER_ID,
  buildMarketPulseTestCard,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cardFindMany: vi.fn(),
  decisionFindMany: vi.fn(),
  scoreEventFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    marketPulseCard: {
      findMany: prismaMocks.cardFindMany,
    },
    marketPulseDecision: {
      findMany: prismaMocks.decisionFindMany,
    },
    marketPulseScoreEvent: {
      findMany: prismaMocks.scoreEventFindMany,
    },
  },
}));

import { getMarketPulseRevealForUser } from "@/lib/market-pulse/server";

function buildRevealedCycle() {
  return {
    id: TEST_CYCLE_ID,
    name: "Test Cycle",
    status: "REVEALED" as const,
    revealAt: CYCLE_REVEAL_PAST,
  };
}

function buildPublishedSignalCard(
  id: string,
  dayIndex: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    ...buildMarketPulseTestCard({ id, dayIndex, ...overrides }),
    cardType: "SIGNAL" as const,
    status: "PUBLISHED" as const,
  };
}

describe("getMarketPulseRevealForUser — cycle review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.cycleFindUnique.mockResolvedValue(buildRevealedCycle());
  });

  it("returns one row per published card with partial participation", async () => {
    const cards = Array.from({ length: 10 }, (_, index) =>
      buildPublishedSignalCard(`card-${index + 1}`, index + 1, {
        ppaSignal: index % 2 === 0 ? "BULLISH" : "CAUTIOUS",
      }),
    );

    prismaMocks.cardFindMany.mockResolvedValue(cards);
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        decision: "BULLISH",
        decidedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        cardId: "card-3",
        decision: "CAUTIOUS",
        decidedAt: new Date("2026-01-04T00:00:00.000Z"),
      },
      {
        cardId: "card-5",
        decision: "BULLISH",
        decidedAt: new Date("2026-01-06T00:00:00.000Z"),
      },
    ]);
    prismaMocks.scoreEventFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        participationPoints: 10,
        matchBonus: 50,
        streakBonus: 0,
        totalPoints: 60,
      },
      {
        cardId: "card-3",
        participationPoints: 10,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 10,
      },
      {
        cardId: "card-5",
        participationPoints: 10,
        matchBonus: 50,
        streakBonus: 25,
        totalPoints: 85,
      },
    ]);

    const result = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);

    expect(result?.cards).toHaveLength(10);
    expect(result?.cards.filter((card) => card.played)).toHaveLength(3);
    expect(result?.cards.filter((card) => !card.played)).toHaveLength(7);

    const playedMatch = result?.cards.find((card) => card.cardId === "card-1");
    expect(playedMatch).toMatchObject({
      played: true,
      viewerDecision: "BULLISH",
      isMatch: true,
      totalPoints: 60,
    });

    const playedNoMatch = result?.cards.find((card) => card.cardId === "card-3");
    expect(playedNoMatch).toMatchObject({
      played: true,
      viewerDecision: "CAUTIOUS",
      isMatch: false,
    });

    const skipped = result?.cards.find((card) => card.cardId === "card-2");
    expect(skipped).toMatchObject({
      played: false,
      viewerDecision: null,
      decidedAt: null,
      isMatch: null,
      participationPoints: null,
      matchBonus: null,
      streakBonus: null,
      totalPoints: null,
      ppaSignal: "CAUTIOUS",
    });
    expect(skipped?.ppaInsight).toBeTruthy();
  });

  it("returns all published cards when the viewer did not participate", async () => {
    prismaMocks.cardFindMany.mockResolvedValue([
      buildPublishedSignalCard("card-1", 1),
      buildPublishedSignalCard("card-2", 2),
    ]);
    prismaMocks.decisionFindMany.mockResolvedValue([]);
    prismaMocks.scoreEventFindMany.mockResolvedValue([]);

    const result = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);

    expect(result?.cards).toHaveLength(2);
    expect(result?.cards.every((card) => !card.played)).toBe(true);
    expect(result?.cards.every((card) => card.viewerDecision === null)).toBe(true);
    expect(result?.cards.every((card) => card.isMatch === null)).toBe(true);
    expect(result?.totals.totalPoints).toBe(0);
  });

  it("keeps score fields null when score events are missing for played cards", async () => {
    prismaMocks.cardFindMany.mockResolvedValue([
      buildPublishedSignalCard("card-1", 1),
    ]);
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        decision: "BULLISH",
        decidedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
    prismaMocks.scoreEventFindMany.mockResolvedValue([]);

    const result = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);

    expect(result?.cards[0]).toMatchObject({
      played: true,
      viewerDecision: "BULLISH",
      isMatch: true,
      participationPoints: null,
      matchBonus: null,
      streakBonus: null,
      totalPoints: null,
    });
    expect(result?.totals.totalPoints).toBe(0);
  });

  it("does not expose cards before the cycle is revealed", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: TEST_CYCLE_ID,
      name: "Test Cycle",
      status: "OPEN" as const,
      revealAt: new Date("2099-01-01T00:00:00.000Z"),
    });

    const result = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);

    expect(result?.isRevealed).toBe(false);
    expect(result?.cards).toEqual([]);
    expect(prismaMocks.cardFindMany).not.toHaveBeenCalled();
  });

  it("nulls PPA and match fields for REST cards", async () => {
    const restCard = {
      ...buildMarketPulseTestCard({ id: "rest-1", dayIndex: 2, cardType: "REST" }),
      headline: "Market rest day",
      ppaSignal: "BULLISH",
      ppaInsight: "Should not leak",
      status: "PUBLISHED" as const,
    };

    prismaMocks.cardFindMany.mockResolvedValue([restCard]);
    prismaMocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "rest-1",
        decision: "ACKNOWLEDGED",
        decidedAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);
    prismaMocks.scoreEventFindMany.mockResolvedValue([
      {
        cardId: "rest-1",
        participationPoints: 10,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 10,
      },
    ]);

    const played = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);
    expect(played?.cards[0]).toMatchObject({
      played: true,
      viewerDecision: "ACKNOWLEDGED",
      ppaSignal: null,
      ppaInsight: null,
      isMatch: null,
      matchBonus: null,
      streakBonus: null,
      totalPoints: 10,
    });

    prismaMocks.decisionFindMany.mockResolvedValue([]);
    prismaMocks.scoreEventFindMany.mockResolvedValue([]);

    const skipped = await getMarketPulseRevealForUser(TEST_USER_ID, TEST_CYCLE_ID);
    expect(skipped?.cards[0]).toMatchObject({
      played: false,
      viewerDecision: null,
      ppaSignal: null,
      ppaInsight: null,
      isMatch: null,
      totalPoints: null,
    });
  });
});
