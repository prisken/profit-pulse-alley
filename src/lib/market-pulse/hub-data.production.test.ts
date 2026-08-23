import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getMarketPulseSettings: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  loadMarketPulseNextCycleStatus: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/next-cycle", () => ({
  loadMarketPulseNextCycleStatus: mocks.loadMarketPulseNextCycleStatus,
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
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });
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
    expect(data.nextCycle).toEqual({ status: "tbc" });
  });

  it("includes next cycle metadata when a future cycle is scheduled", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-aug",
      name: "August 2026 Market Pulse",
      startsAtIso: "2026-07-11T16:00:00.000Z",
      endsAtIso: "2026-07-21T16:00:00.000Z",
      revealAtIso: "2026-07-21T16:00:00.000Z",
      firstCardReleaseAtIso: "2026-07-11T01:00:00.000Z",
    });

    const data = await getMarketPulseHubPageData();

    expect(data.nextCycle.status).toBe("available");
    if (data.nextCycle.status === "available") {
      expect(data.nextCycle.name).toBe("August 2026 Market Pulse");
    }
  });

  it("shows real production cycle data unchanged", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue({
      id: "cycle-july",
      name: "July 2026 Market Pulse",
      prizeLabel: "1-on-1 financial analysis",
      startsAt: new Date("2026-06-30T16:00:00.000Z"),
      endsAt: new Date("2026-07-10T16:00:00.000Z"),
      revealAt: new Date("2026-07-10T16:00:00.000Z"),
      status: "OPEN",
    });

    const data = await getMarketPulseHubPageData();

    expect(data.cycleId).toBe("cycle-july");
    expect(data.challengeName).toBe("July 2026 Market Pulse");
    expect(data.hasDatabaseCycle).toBe(true);
    expect(data.prizeLabel).toBe("1-on-1 financial analysis");
  });
});
