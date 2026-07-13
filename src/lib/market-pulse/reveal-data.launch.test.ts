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
  loadMarketPulseNextCycleStatus: vi.fn(),
  shouldShowNextStepPreferencePrompt: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/next-cycle", () => ({
  loadMarketPulseNextCycleStatus: mocks.loadMarketPulseNextCycleStatus,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: mocks.getMarketPulseSettings,
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
  getRevealedMarketPulseCycleForPage: mocks.getRevealedMarketPulseCycleForPage,
  getMarketPulseRevealForUser: mocks.getMarketPulseRevealForUser,
  getUserMarketPulseProgress: mocks.getUserMarketPulseProgress,
}));

vi.mock("@/lib/acquisition/profile", () => ({
  shouldShowNextStepPreferencePrompt: mocks.shouldShowNextStepPreferencePrompt,
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
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });
    mocks.auth.mockResolvedValue(null);
    mocks.shouldShowNextStepPreferencePrompt.mockResolvedValue(false);
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
    expect(data.acquisition.showNextStepPreferencePrompt).toBe(false);
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
    expect(data.acquisition.showNextStepPreferencePrompt).toBe(false);
    expect(mocks.shouldShowNextStepPreferencePrompt).not.toHaveBeenCalled();
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
          cardType: "SIGNAL",
          companyName: "Example Co",
          headline: "Headline",
          ticker: null,
          summary: null,
          newsBody: null,
          cardImageUrl: null,
          cardImageAlt: null,
          played: true,
          viewerDecision: "BULLISH",
          decidedAt: new Date("2026-07-01T00:00:00.000Z"),
          ppaSignal: "BULLISH",
          ppaInsight: "Insight text",
          isMatch: true,
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
      totalPoints: 150,
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("revealed");
    expect(data.isAuthenticated).toBe(true);
    expect(data.results?.cards[0]?.ppaSignal).toBe("BULLISH");
    expect(data.results?.cards[0]?.ppaInsight).toBe("Insight text");
    expect(data.results?.totalPoints).toBe(150);
    expect(mocks.shouldShowNextStepPreferencePrompt).toHaveBeenCalledWith("user-1");
    expect(data.acquisition.showNextStepPreferencePrompt).toBe(false);
  });

  it("includes rest cards as participation-only rows in personal results", async () => {
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
        participationPoints: 20,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 20,
      },
      cards: [
        {
          cardId: "rest-1",
          dayIndex: 2,
          sortOrder: 0,
          cardsOnDay: 1,
          cardType: "REST",
          companyName: "Market rest",
          headline: "Market rest day",
          ticker: null,
          summary: null,
          newsBody: null,
          cardImageUrl: null,
          cardImageAlt: null,
          played: true,
          viewerDecision: "ACKNOWLEDGED",
          decidedAt: new Date("2026-07-02T00:00:00.000Z"),
          ppaSignal: null,
          ppaInsight: null,
          isMatch: null,
          participationPoints: 10,
          matchBonus: null,
          streakBonus: null,
          totalPoints: 10,
        },
      ],
    });
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      rank: 3,
      currentStreak: 0,
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.results?.cards[0]).toMatchObject({
      cardType: "REST",
      isRestCard: true,
      played: true,
      isMatch: null,
      ppaSignal: null,
      ppaInsight: null,
      totalPoints: 10,
    });
    expect(data.results?.matchesCount).toBe(0);
    expect(data.results?.totalPlayed).toBe(1);
    expect(data.results?.totalSkipped).toBe(0);
    expect(data.results?.totalPublished).toBe(1);
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
      totals: {
        participationPoints: 0,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 0,
      },
      cards: [],
    });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("pending");
    expect(data.results).toBeNull();
    expect(data.pendingCycle?.name).toBe("July 2026 Market Pulse");
    expect(data.acquisition.showNextStepPreferencePrompt).toBe(false);
  });

  it("includes next cycle TBC when no future cycle is scheduled after reveal", async () => {
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
        participationPoints: 0,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 0,
      },
      cards: [],
    });
    mocks.getUserMarketPulseProgress.mockResolvedValue({
      rank: null,
      currentStreak: 0,
      totalPoints: 0,
    });
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });

    const data = await getMarketPulseRevealPageData();

    expect(data.status).toBe("revealed");
    expect(data.nextCycle).toEqual({ status: "tbc" });
  });

  it("surfaces the next-step preference prompt for eligible revealed users", async () => {
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
          cardType: "SIGNAL",
          companyName: "Example Co",
          headline: "Headline",
          ticker: null,
          summary: null,
          newsBody: null,
          cardImageUrl: null,
          cardImageAlt: null,
          played: true,
          viewerDecision: "BULLISH",
          decidedAt: new Date("2026-07-01T00:00:00.000Z"),
          ppaSignal: "BULLISH",
          ppaInsight: "Insight text",
          isMatch: true,
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
      totalPoints: 150,
    });
    mocks.shouldShowNextStepPreferencePrompt.mockResolvedValue(true);

    const data = await getMarketPulseRevealPageData();

    expect(data.acquisition.showNextStepPreferencePrompt).toBe(true);
    expect(data.status).toBe("revealed");
    expect(data.results?.cards[0]?.ppaInsight).toBe("Insight text");
  });

  it("keeps existing reveal page data when next-step prompt is eligible", async () => {
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
          cardType: "SIGNAL",
          companyName: "Example Co",
          headline: "Headline",
          ticker: null,
          summary: null,
          newsBody: null,
          cardImageUrl: null,
          cardImageAlt: null,
          played: true,
          viewerDecision: "BULLISH",
          decidedAt: new Date("2026-07-01T00:00:00.000Z"),
          ppaSignal: "BULLISH",
          ppaInsight: "Insight text",
          isMatch: true,
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
      totalPoints: 150,
    });
    mocks.shouldShowNextStepPreferencePrompt.mockResolvedValue(true);

    const data = await getMarketPulseRevealPageData();

    expect(typeof data.playNextAvailable).toBe("boolean");
    expect(data.results?.totalPoints).toBe(150);
    expect(data.results?.rank).toBe(1);
  });
});
