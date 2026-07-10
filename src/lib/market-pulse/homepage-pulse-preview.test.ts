/** Homepage pulse board preview — reveal-safe leaderboard rows for the marketing page. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  getRevealedMarketPulseCycleForPage: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  isMarketPulseCycleRevealed: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getRevealedMarketPulseCycleForPage: mocks.getRevealedMarketPulseCycleForPage,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed: mocks.isMarketPulseCycleRevealed,
}));

import {
  buildSamplePulseBoardPreview,
  getHomePulseBoardPreview,
} from "@/lib/market-pulse/homepage-pulse-preview";

const NOW = new Date("2026-07-05T12:00:00.000Z");

function activeUnrevealedCycle() {
  return {
    id: "active",
    name: "July 2026 Market Pulse",
    startsAt: new Date("2026-07-01T00:00:00.000Z"),
    endsAt: new Date("2026-07-10T00:00:00.000Z"),
    revealAt: new Date("2026-07-11T00:00:00.000Z"),
    status: "OPEN" as const,
  };
}

function revealedCycle() {
  return {
    id: "revealed",
    name: "June 2026 Market Pulse",
    startsAt: new Date("2026-06-01T00:00:00.000Z"),
    endsAt: new Date("2026-06-10T00:00:00.000Z"),
    revealAt: new Date("2026-06-10T16:00:00.000Z"),
    status: "REVEALED" as const,
  };
}

function assertNoSensitiveFields(preview: Awaited<ReturnType<typeof getHomePulseBoardPreview>>) {
  const serialized = JSON.stringify(preview);
  expect(serialized).not.toMatch(/ppaInsight|ppaSignal|"email"|contactNumber|userId/i);
  for (const row of preview.rows) {
    expect(row).not.toHaveProperty("userId");
    expect(row).not.toHaveProperty("email");
    expect(row).not.toHaveProperty("phone");
    expect(row).not.toHaveProperty("contactNumber");
    expect(row).not.toHaveProperty("ppaInsight");
    expect(row).not.toHaveProperty("ppaSignal");
    expect(row).not.toHaveProperty("image");
    expect(row).not.toHaveProperty("participationPoints");
    expect(row).not.toHaveProperty("bonusPoints");
    expect(row).not.toHaveProperty("isRevealed");
  }
}

function assertNoScores(preview: Awaited<ReturnType<typeof getHomePulseBoardPreview>>) {
  expect(JSON.stringify(preview)).not.toMatch(/"score":\s*\d/);
  for (const row of preview.rows) {
    expect(row.score).toBeUndefined();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  mocks.isDatabaseConfigured.mockReturnValue(true);
  mocks.isMarketPulseCycleRevealed.mockImplementation(
    (cycle: { status: string; revealAt: Date }) =>
      cycle.status === "REVEALED" || NOW >= cycle.revealAt,
  );
});

describe("getHomePulseBoardPreview", () => {
  it("returns locked state without scores when the active cycle is unrevealed", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: null,
      pendingActiveCycle: activeUnrevealedCycle(),
    });

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("locked");
    expect(preview.cycleName).toBe("July 2026 Market Pulse");
    expect(preview.rows).toHaveLength(3);
    expect(preview.rows.every((row) => row.score === undefined)).toBe(true);
    expect(preview.rows.every((row) => row.rank === null)).toBe(true);
    expect(mocks.getMarketPulseLeaderboard).not.toHaveBeenCalled();
    assertNoScores(preview);
    assertNoSensitiveFields(preview);
  });

  it("returns revealed rows with scores from the latest revealed cycle", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: revealedCycle(),
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "user-1",
        playerName: "Alex",
        image: null,
        score: 180,
        participationPoints: 100,
        bonusPoints: 80,
        isRevealed: true,
      },
      {
        rank: 2,
        userId: "user-2",
        playerName: "Jordan",
        image: null,
        score: 150,
        participationPoints: 90,
        bonusPoints: 60,
        isRevealed: true,
      },
    ]);

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("revealed");
    expect(mocks.getMarketPulseLeaderboard).toHaveBeenCalledWith({
      mode: "CURRENT_CYCLE",
      cycleId: "revealed",
      limit: 5,
    });
    expect(preview.rows).toEqual([
      { rank: 1, playerName: "Alex", score: 180 },
      { rank: 2, playerName: "Jordan", score: 150 },
    ]);
    expect(JSON.stringify(preview)).not.toMatch(/userId|email|contactNumber|ppaInsight/i);
    assertNoSensitiveFields(preview);
  });

  it("does not expose unrevealed row scores even if the loader returns them", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: revealedCycle(),
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "user-1",
        playerName: "Alex",
        image: null,
        score: 40,
        participationPoints: 40,
        bonusPoints: 0,
        isRevealed: false,
      },
    ]);

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([]);
  });

  it("returns sample state when no usable real data exists", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(false);

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([]);
    expect(mocks.getRevealedMarketPulseCycleForPage).not.toHaveBeenCalled();
    assertNoSensitiveFields(preview);
  });

  it("falls back to sample when a revealed cycle has no public entries", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: revealedCycle(),
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([]);
    assertNoScores(preview);
  });

  it("returns sample state when cycle resolution fails", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockRejectedValue(
      new Error("db unavailable"),
    );

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([]);
    assertNoSensitiveFields(preview);
  });

  it("returns sample state when leaderboard fetch fails for a revealed cycle", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: revealedCycle(),
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseLeaderboard.mockRejectedValue(new Error("leaderboard down"));

    const preview = await getHomePulseBoardPreview();

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([]);
    assertNoScores(preview);
  });
});

describe("buildSamplePulseBoardPreview", () => {
  it("labels sample players clearly and omits scores", () => {
    const preview = buildSamplePulseBoardPreview([
      "Sample · Player A",
      "Sample · Player B",
      "Sample · Player C",
    ]);

    expect(preview.state).toBe("sample");
    expect(preview.rows).toEqual([
      { rank: 1, playerName: "Sample · Player A", score: undefined },
      { rank: 2, playerName: "Sample · Player B", score: undefined },
      { rank: 3, playerName: "Sample · Player C", score: undefined },
    ]);
    assertNoScores(preview);
    for (const row of preview.rows) {
      expect(row.playerName).toMatch(/sample/i);
    }
  });

  it("never includes PPA or contact fields in sample rows", () => {
    const preview = buildSamplePulseBoardPreview(["示範 · 玩家 A"]);
    assertNoSensitiveFields(preview);
  });
});
