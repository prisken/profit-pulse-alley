import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import {
  CYCLE_REVEAL_FUTURE,
  CYCLE_REVEAL_PAST,
  FIXED_NOW,
  TEST_CYCLE_ID,
  TEST_USER_ID,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const mocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  decisionFindMany: vi.fn(),
  scoreEventFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: mocks.cycleFindUnique,
    },
    marketPulseDecision: {
      findMany: mocks.decisionFindMany,
    },
    marketPulseScoreEvent: {
      findMany: mocks.scoreEventFindMany,
    },
  },
}));

import { getLeaderboardViewerScoreBreakdown } from "@/lib/market-pulse/leaderboard-score-breakdown";

const OTHER_CYCLE_ID = "other-cycle";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  vi.clearAllMocks();
  mocks.cycleFindUnique.mockResolvedValue({
    id: TEST_CYCLE_ID,
    status: "REVEALED",
    revealAt: CYCLE_REVEAL_PAST,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getLeaderboardViewerScoreBreakdown", () => {
  it("returns empty array before reveal", async () => {
    mocks.cycleFindUnique.mockResolvedValue({
      id: TEST_CYCLE_ID,
      status: "OPEN",
      revealAt: CYCLE_REVEAL_FUTURE,
    });

    const rows = await getLeaderboardViewerScoreBreakdown(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(rows).toEqual([]);
    expect(mocks.decisionFindMany).not.toHaveBeenCalled();
    expect(mocks.scoreEventFindMany).not.toHaveBeenCalled();
  });

  it("loads breakdown for the selected user and cycle only", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        decision: "BULLISH",
        card: {
          id: "card-1",
          dayIndex: 0,
          ticker: "AAPL",
          headline: "Apple climbs",
          ppaSignal: "BULLISH",
        },
      },
    ]);
    mocks.scoreEventFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        participationPoints: PARTICIPATION_POINTS,
        matchBonus: 50,
        streakBonus: 0,
        totalPoints: 60,
      },
    ]);

    const rows = await getLeaderboardViewerScoreBreakdown(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(mocks.decisionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID, cycleId: TEST_CYCLE_ID },
      }),
    );
    expect(mocks.scoreEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID, cycleId: TEST_CYCLE_ID },
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      dayIndex: 0,
      cardType: "SIGNAL",
      isRestCard: false,
      ticker: "AAPL",
      headline: "Apple climbs",
      userDecision: "BULLISH",
      ppaSignal: "BULLISH",
      isMatch: true,
      participationPoints: PARTICIPATION_POINTS,
      matchBonus: 50,
      totalPoints: 60,
    });
  });

  it("does not include PPA insight text in breakdown rows", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "card-1",
        decision: "CAUTIOUS",
        card: {
          id: "card-1",
          dayIndex: 1,
          ticker: "TSLA",
          headline: "Tesla dips",
          ppaSignal: "BULLISH",
          ppaInsight: "Secret insight must not leak",
        },
      },
    ]);
    mocks.scoreEventFindMany.mockResolvedValue([]);

    const rows = await getLeaderboardViewerScoreBreakdown(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(JSON.stringify(rows)).not.toContain("Secret insight");
    expect(rows[0]).not.toHaveProperty("ppaInsight");
  });

  it("includes both same-day cards in play order", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "card-b",
        decision: "BULLISH",
        card: {
          id: "card-b",
          dayIndex: 3,
          sortOrder: 1,
          createdAt: "2026-06-03T10:00:00.000Z",
          ticker: "BETA",
          headline: "Beta climbs",
          ppaSignal: "BULLISH",
        },
      },
      {
        cardId: "card-a",
        decision: "CAUTIOUS",
        card: {
          id: "card-a",
          dayIndex: 3,
          sortOrder: 0,
          createdAt: "2026-06-03T09:00:00.000Z",
          ticker: "ACME",
          headline: "Acme dips",
          ppaSignal: "BULLISH",
        },
      },
    ]);
    mocks.scoreEventFindMany.mockResolvedValue([
      {
        cardId: "card-a",
        participationPoints: PARTICIPATION_POINTS,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: PARTICIPATION_POINTS,
      },
      {
        cardId: "card-b",
        participationPoints: PARTICIPATION_POINTS,
        matchBonus: 50,
        streakBonus: 0,
        totalPoints: 60,
      },
    ]);

    const rows = await getLeaderboardViewerScoreBreakdown(
      TEST_USER_ID,
      TEST_CYCLE_ID,
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.cardId)).toEqual(["card-a", "card-b"]);
    expect(rows[0]).toMatchObject({
      sortOrder: 0,
      cardsOnDay: 2,
      ticker: "ACME",
      isMatch: false,
    });
    expect(rows[1]).toMatchObject({
      sortOrder: 1,
      cardsOnDay: 2,
      ticker: "BETA",
      isMatch: true,
    });
  });

  it("scopes queries to the requested cycle id", async () => {
    mocks.decisionFindMany.mockResolvedValue([]);
    mocks.scoreEventFindMany.mockResolvedValue([]);

    await getLeaderboardViewerScoreBreakdown(TEST_USER_ID, OTHER_CYCLE_ID);

    expect(mocks.decisionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER_ID, cycleId: OTHER_CYCLE_ID },
      }),
    );
  });

  it("includes rest cards with participation-only breakdown", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        cardId: "rest-1",
        decision: "ACKNOWLEDGED",
        card: {
          id: "rest-1",
          dayIndex: 2,
          sortOrder: 0,
          createdAt: "2026-06-03T09:00:00.000Z",
          cardType: "REST",
          ticker: "",
          headline: "Market rest day",
          headlineZhHant: "市場休息日",
          companyName: "Market rest",
          companyNameZh: null,
          newsBody: null,
          newsBodyZhHant: null,
          summary: null,
          summaryZhHant: null,
          cardImageAlt: null,
          cardImageAltZhHant: null,
          userPrompt: null,
          userPromptZhHant: null,
          ppaSignal: null,
          ppaInsight: null,
          ppaInsightZhHant: null,
        },
      },
    ]);
    mocks.scoreEventFindMany.mockResolvedValue([
      {
        cardId: "rest-1",
        participationPoints: PARTICIPATION_POINTS,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: PARTICIPATION_POINTS,
      },
    ]);

    const rows = await getLeaderboardViewerScoreBreakdown(
      TEST_USER_ID,
      TEST_CYCLE_ID,
      "zh-Hant",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      isRestCard: true,
      cardType: "REST",
      userDecision: "ACKNOWLEDGED",
      ppaSignal: null,
      isMatch: false,
      participationPoints: PARTICIPATION_POINTS,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: PARTICIPATION_POINTS,
      headline: "市場休息日",
    });
  });
});
