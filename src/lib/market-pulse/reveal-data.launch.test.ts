/**
 * Launch smoke — reveal page pending vs results (post 1 Jul 2026 HKT).
 * Manual checklist: docs/market-pulse-deploy-checklist.md § Launch smoke test
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isDatabaseConfigured: vi.fn(),
  getMarketPulseSettings: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getRevealedMarketPulseCycleForPage: vi.fn(),
  getMarketPulseRevealForUser: vi.fn(),
  getUserMarketPulseProgress: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: mocks.getMarketPulseSettings,
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
  getRevealedMarketPulseCycleForPage: mocks.getRevealedMarketPulseCycleForPage,
  getMarketPulseRevealForUser: mocks.getMarketPulseRevealForUser,
  getUserMarketPulseProgress: mocks.getUserMarketPulseProgress,
}));

import { getMarketPulseRevealPageData } from "@/lib/market-pulse/reveal-data";

const pendingCycle = {
  id: "cycle-july",
  name: "July 2026 Market Pulse",
  status: "OPEN" as const,
  startsAt: new Date("2026-06-30T16:00:00.000Z"),
  endsAt: new Date("2026-07-10T16:00:00.000Z"),
  revealAt: new Date("2026-07-10T16:00:00.000Z"),
};

describe("Launch smoke — reveal page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(pendingCycle);
    mocks.auth.mockResolvedValue(null);
  });

  it("stays pending before reveal with countdown metadata only", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: null,
      pendingActiveCycle: pendingCycle,
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("pending");
    expect(data.pendingCycle?.name).toBe("July 2026 Market Pulse");
    expect(data.results).toBeNull();
    expect(data.revealedCycle).toBeNull();
  });

  it("shows revealed shell for guests without personal results", async () => {
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: { ...pendingCycle, status: "REVEALED" as const },
      pendingActiveCycle: null,
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("revealed");
    expect(data.isAuthenticated).toBe(false);
    expect(data.results).toBeNull();
    expect(data.revealedCycle?.id).toBe("cycle-july");
  });

  it("returns personal results only after reveal is valid for the signed-in user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: { ...pendingCycle, status: "REVEALED" as const },
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseRevealForUser.mockResolvedValue({
      cycleId: pendingCycle.id,
      cycleName: pendingCycle.name,
      isRevealed: true,
      totals: {
        participationPoints: 100,
        matchBonus: 50,
        streakBonus: 0,
        totalPoints: 150,
      },
      cards: [
        {
          cardId: "card-1",
          dayIndex: 1,
          sortOrder: 0,
          cardsOnDay: 1,
          companyName: "Example Co",
          headline: "Headline",
          userDecision: "BULLISH",
          ppaSignal: "BULLISH",
          ppaInsight: "Insight text",
          participationPoints: 10,
          matchBonus: 50,
          streakBonus: 0,
          totalPoints: 60,
        },
      ],
    });
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      rank: 1,
      currentStreak: 1,
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("revealed");
    expect(data.isAuthenticated).toBe(true);
    expect(data.results?.cards[0]?.ppaSignal).toBe("BULLISH");
    expect(data.results?.cards[0]?.ppaInsight).toBe("Insight text");
    expect(data.results?.totalPoints).toBe(150);
  });

  it("falls back to pending when reveal payload is not yet valid for the user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getRevealedMarketPulseCycleForPage.mockResolvedValue({
      revealedCycle: { ...pendingCycle, status: "REVEALED" as const },
      pendingActiveCycle: null,
    });
    mocks.getMarketPulseRevealForUser.mockResolvedValue({
      cycleId: pendingCycle.id,
      cycleName: pendingCycle.name,
      isRevealed: false,
      totals: null,
      cards: [],
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("pending");
    expect(data.results).toBeNull();
    expect(data.pendingCycle?.name).toBe("July 2026 Market Pulse");
  });
});
