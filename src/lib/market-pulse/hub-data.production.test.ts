import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getMarketPulseSettings: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
  getMarketPulseSettings: mocks.getMarketPulseSettings,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed: vi.fn(() => false),
}));

import { getMarketPulseHubPageData } from "@/lib/market-pulse/hub-data";

describe("getMarketPulseHubPageData production hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not use synthetic challenge fallback when the database is unavailable", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(false);

    const data = await getMarketPulseHubPageData();

    expect(data.cycleId).toBeNull();
    expect(data.hasDatabaseCycle).toBe(false);
    expect(data.dayCurrent).toBe(0);
    expect(data.dayTotal).toBe(0);
    expect(data.challengeName).toBe("Market Pulse Challenge");
    expect(data.challengeName).not.toMatch(/\[DEMO\]/i);
    expect(mocks.getActiveMarketPulseCycle).not.toHaveBeenCalled();
  });

  it("returns empty hub state when production has no public active cycle", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);

    const data = await getMarketPulseHubPageData();

    expect(data.cycleId).toBeNull();
    expect(data.hasDatabaseCycle).toBe(false);
    expect(data.challengeName).not.toMatch(/\[DEMO\]/i);
  });

  it("shows real production cycle data unchanged", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue({
      id: "cycle-july",
      name: "July 2026 Market Pulse",
      prizeLabel: "Ocean Park ticket",
      startsAt: new Date("2026-06-30T16:00:00.000Z"),
      endsAt: new Date("2026-07-10T16:00:00.000Z"),
      revealAt: new Date("2026-07-10T16:00:00.000Z"),
      status: "OPEN",
    });

    const data = await getMarketPulseHubPageData();

    expect(data.cycleId).toBe("cycle-july");
    expect(data.challengeName).toBe("July 2026 Market Pulse");
    expect(data.hasDatabaseCycle).toBe(true);
    expect(data.prizeLabel).toBe("Ocean Park ticket");
  });
});
