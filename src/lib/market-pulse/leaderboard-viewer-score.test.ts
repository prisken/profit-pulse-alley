/** Viewer score panel: unrevealed cycles hide scores; revealed cycles expose personal summary. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  decisionCount: vi.fn(),
  getUserMarketPulseProgress: vi.fn(),
  cycleScoreFindUnique: vi.fn(),
  getLeaderboardViewerScoreBreakdown: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseDecision: {
      count: mocks.decisionCount,
    },
    marketPulseScore: {
      findUnique: mocks.cycleScoreFindUnique,
    },
  },
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getUserMarketPulseProgress: mocks.getUserMarketPulseProgress,
}));

vi.mock("@/lib/market-pulse/leaderboard-score-breakdown", () => ({
  getLeaderboardViewerScoreBreakdown: mocks.getLeaderboardViewerScoreBreakdown,
}));

import { getLeaderboardViewerScore } from "@/lib/market-pulse/leaderboard-viewer-score";
import type { LeaderboardCycleOption } from "@/lib/market-pulse/leaderboard-cycle-select";

const USER_ID = "user-viewer";
const CYCLE_ID = "cycle-selected";

function cycleOption(
  overrides: Partial<LeaderboardCycleOption> = {},
): LeaderboardCycleOption {
  return {
    id: CYCLE_ID,
    name: "Selected Cycle",
    startsAtIso: "2026-06-01T00:00:00.000Z",
    endsAtIso: "2026-06-10T00:00:00.000Z",
    revealAtIso: "2026-06-11T00:00:00.000Z",
    isActive: false,
    isRevealed: true,
    labelKind: "archived",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getLeaderboardViewerScoreBreakdown.mockResolvedValue([]);
});

describe("getLeaderboardViewerScore", () => {
  it("returns logged_out when no user id is provided", async () => {
    await expect(getLeaderboardViewerScore(null, cycleOption())).resolves.toEqual({
      state: "logged_out",
    });
  });

  it("does not expose score values before reveal", async () => {
    mocks.decisionCount.mockResolvedValue(2);

    const panel = await getLeaderboardViewerScore(
      USER_ID,
      cycleOption({ isRevealed: false, isActive: true, labelKind: "current" }),
    );

    expect(panel).toEqual({
      state: "locked_participating",
      cycleName: "Selected Cycle",
    });
    expect(mocks.getUserMarketPulseProgress).not.toHaveBeenCalled();
    expect(mocks.cycleScoreFindUnique).not.toHaveBeenCalled();
    expect(mocks.getLeaderboardViewerScoreBreakdown).not.toHaveBeenCalled();
    expect(panel).not.toHaveProperty("totalScore");
    expect(panel).not.toHaveProperty("participationScore");
  });

  it("shows locked no-participation when unrevealed and user has no decisions", async () => {
    mocks.decisionCount.mockResolvedValue(0);

    const panel = await getLeaderboardViewerScore(
      USER_ID,
      cycleOption({ isRevealed: false }),
    );

    expect(panel).toEqual({
      state: "locked_no_participation",
      cycleName: "Selected Cycle",
    });
  });

  it("loads revealed summary for the selected cycle only", async () => {
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      cycleId: CYCLE_ID,
      decisionsCount: 3,
      cardsPlayed: 3,
      cardsRemaining: 0,
      totalCards: 5,
      participationPoints: 30,
      totalPoints: 180,
      rank: 4,
      currentStreak: 2,
      isRevealed: true,
    });
    mocks.cycleScoreFindUnique.mockResolvedValue({
      participationScore: 30,
    });
    mocks.getLeaderboardViewerScoreBreakdown.mockResolvedValue([
      {
        cardId: "card-1",
        dayIndex: 0,
        ticker: "AAPL",
        headline: "Apple",
        userDecision: "BULLISH",
        ppaSignal: "BULLISH",
        isMatch: true,
        participationPoints: 10,
        matchBonus: 50,
        streakBonus: 0,
        totalPoints: 60,
      },
    ]);

    const panel = await getLeaderboardViewerScore(USER_ID, cycleOption());

    expect(mocks.getLeaderboardViewerScoreBreakdown).toHaveBeenCalledWith(
      USER_ID,
      CYCLE_ID,
    );
    expect(mocks.getUserMarketPulseProgress).toHaveBeenCalledWith(
      USER_ID,
      CYCLE_ID,
    );
    expect(panel).toEqual({
      state: "revealed_summary",
      cycleName: "Selected Cycle",
      totalScore: 180,
      participationScore: 30,
      rank: 4,
      decisionsSubmitted: 3,
      totalCards: 5,
      breakdown: [
        expect.objectContaining({
          ticker: "AAPL",
          totalPoints: 60,
        }),
      ],
    });
  });

  it("returns revealed_no_score when user did not participate", async () => {
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      cycleId: CYCLE_ID,
      decisionsCount: 0,
      cardsPlayed: 0,
      cardsRemaining: 5,
      totalCards: 5,
      participationPoints: 0,
      totalPoints: 0,
      rank: null,
      currentStreak: null,
      isRevealed: true,
    });
    mocks.cycleScoreFindUnique.mockResolvedValue(null);

    const panel = await getLeaderboardViewerScore(USER_ID, cycleOption());

    expect(panel).toEqual({
      state: "revealed_no_score",
      cycleName: "Selected Cycle",
      decisionsSubmitted: 0,
      totalCards: 5,
    });
  });

  it("derives participation when stored score row is missing", async () => {
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      cycleId: CYCLE_ID,
      decisionsCount: 2,
      cardsPlayed: 2,
      cardsRemaining: 1,
      totalCards: 3,
      participationPoints: 20,
      totalPoints: 120,
      rank: 2,
      currentStreak: 1,
      isRevealed: true,
    });
    mocks.cycleScoreFindUnique.mockResolvedValue(null);

    const panel = await getLeaderboardViewerScore(USER_ID, cycleOption());

    expect(panel).toMatchObject({
      state: "revealed_summary",
      participationScore: 20,
      totalScore: 120,
    });
  });

  it("never includes other users in the payload", async () => {
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      cycleId: CYCLE_ID,
      decisionsCount: 1,
      cardsPlayed: 1,
      cardsRemaining: 0,
      totalCards: 1,
      participationPoints: 10,
      totalPoints: 60,
      rank: 1,
      currentStreak: 1,
      isRevealed: true,
    });
    mocks.cycleScoreFindUnique.mockResolvedValue({ participationScore: 10 });

    const panel = await getLeaderboardViewerScore(USER_ID, cycleOption());

    expect(JSON.stringify(panel)).not.toContain("other-user");
    expect(mocks.getUserMarketPulseProgress).toHaveBeenCalledWith(
      USER_ID,
      CYCLE_ID,
    );
  });
});
