/** Page loader: cycle-scoped leaderboard, archive selector, and viewer score panel. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  getLeaderboardViewerScore: vi.fn(),
  cycleFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
}));

vi.mock("@/lib/market-pulse/leaderboard-viewer-score", () => ({
  getLeaderboardViewerScore: mocks.getLeaderboardViewerScore,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findMany: mocks.cycleFindMany,
    },
  },
}));

import { getMarketPulseLeaderboardPageData } from "@/lib/market-pulse/leaderboard-data";

const NOW = new Date("2026-07-05T12:00:00.000Z");

function revealedCycle(id: string, revealAt: string) {
  return {
    id,
    name: `Cycle ${id}`,
    startsAt: new Date("2026-06-01T00:00:00.000Z"),
    endsAt: new Date("2026-06-10T00:00:00.000Z"),
    revealAt: new Date(revealAt),
    status: "REVEALED" as const,
  };
}

function activeUnrevealedCycle() {
  return {
    id: "active",
    name: "Active Cycle",
    startsAt: new Date("2026-07-01T00:00:00.000Z"),
    endsAt: new Date("2026-07-10T00:00:00.000Z"),
    revealAt: new Date("2026-07-11T00:00:00.000Z"),
    status: "OPEN" as const,
    cards: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  mocks.isDatabaseConfigured.mockReturnValue(true);
  mocks.getLeaderboardViewerScore.mockResolvedValue({ state: "logged_out" });
});

describe("getMarketPulseLeaderboardPageData", () => {
  it("defaults to active cycle", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeUnrevealedCycle());
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);

    const data = await getMarketPulseLeaderboardPageData();

    expect(data.selectedCycle?.id).toBe("active");
    expect(data.viewState).toBe("locked");
    expect(mocks.getMarketPulseLeaderboard).not.toHaveBeenCalled();
  });

  it("defaults to latest revealed cycle when no active cycle", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("older", "2026-05-01T00:00:00.000Z"),
      revealedCycle("newer", "2026-06-01T00:00:00.000Z"),
    ]);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "u1",
        playerName: "Player 1",
        image: null,
        score: 120,
        participationPoints: 100,
        bonusPoints: 20,
        isRevealed: true,
      },
    ]);

    const data = await getMarketPulseLeaderboardPageData();

    expect(data.selectedCycle?.id).toBe("newer");
    expect(mocks.getMarketPulseLeaderboard).toHaveBeenCalledWith({
      mode: "CURRENT_CYCLE",
      cycleId: "newer",
      limit: 50,
    });
    expect(data.entries).toHaveLength(1);
  });

  it("loads scores only for the selected revealed cycle", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeUnrevealedCycle());
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "u1",
        playerName: "Past winner",
        image: null,
        score: 90,
        participationPoints: 70,
        bonusPoints: 20,
        isRevealed: true,
      },
    ]);

    const data = await getMarketPulseLeaderboardPageData("past");

    expect(data.selectedCycle?.id).toBe("past");
    expect(mocks.getMarketPulseLeaderboard).toHaveBeenCalledTimes(1);
    expect(mocks.getMarketPulseLeaderboard).toHaveBeenCalledWith({
      mode: "CURRENT_CYCLE",
      cycleId: "past",
      limit: 50,
    });
    expect(data.entries[0]?.playerName).toBe("Past winner");
  });

  it("does not expose scores for unrevealed active cycle", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeUnrevealedCycle());
    mocks.cycleFindMany.mockResolvedValue([]);

    const data = await getMarketPulseLeaderboardPageData("active");

    expect(data.viewState).toBe("locked");
    expect(data.entries).toEqual([]);
    expect(mocks.getMarketPulseLeaderboard).not.toHaveBeenCalled();
  });

  it("marks unrevealed historical cycle ids as unavailable", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeUnrevealedCycle());
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);

    const data = await getMarketPulseLeaderboardPageData("secret-future");

    expect(data.viewState).toBe("unavailable");
    expect(data.selectedCycle).toBeNull();
    expect(data.entries).toEqual([]);
    expect(mocks.getMarketPulseLeaderboard).not.toHaveBeenCalled();
  });

  it("returns no_cycles when database has no eligible cycles", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.cycleFindMany.mockResolvedValue([]);

    const data = await getMarketPulseLeaderboardPageData();

    expect(data.viewState).toBe("no_cycles");
    expect(data.cycles).toEqual([]);
  });

  it("returns no_scores for revealed cycle without entries", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);

    const data = await getMarketPulseLeaderboardPageData("past");

    expect(data.viewState).toBe("no_scores");
    expect(data.entries).toEqual([]);
  });

  it("loads viewer score for the authenticated user and selected cycle", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);
    mocks.getLeaderboardViewerScore.mockResolvedValue({
      state: "revealed_summary",
      cycleName: "Cycle past",
      totalScore: 90,
      participationScore: 20,
      rank: 3,
      decisionsSubmitted: 2,
      totalCards: 5,
      breakdown: [],
    });

    const data = await getMarketPulseLeaderboardPageData("past", "viewer-1");

    expect(mocks.getLeaderboardViewerScore).toHaveBeenCalledWith(
      "viewer-1",
      expect.objectContaining({ id: "past" }),
      "en",
    );
    expect(data.viewerScore).toMatchObject({
      state: "revealed_summary",
      totalScore: 90,
    });
  });

  it("does not pass score values in viewer panel before reveal", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeUnrevealedCycle());
    mocks.cycleFindMany.mockResolvedValue([]);
    mocks.getLeaderboardViewerScore.mockResolvedValue({
      state: "locked_participating",
      cycleName: "Active Cycle",
    });

    const data = await getMarketPulseLeaderboardPageData("active", "viewer-1");

    expect(data.viewerScore).toEqual({
      state: "locked_participating",
      cycleName: "Active Cycle",
    });
    expect(data.viewerScore).not.toHaveProperty("totalScore");
  });

  it("returns sign-in state for logged-out visitors", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.cycleFindMany.mockResolvedValue([
      revealedCycle("past", "2026-06-01T00:00:00.000Z"),
    ]);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);

    const data = await getMarketPulseLeaderboardPageData("past", null);

    expect(mocks.getLeaderboardViewerScore).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ id: "past" }),
      "en",
    );
    expect(data.viewerScore).toEqual({ state: "logged_out" });
  });
});
