/**
 * Launch smoke — public play page gates (post 1 Jul 2026 HKT).
 * Manual checklist: docs/market-pulse-deploy-checklist.md § Launch smoke test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";

const AFTER_LAUNCH = new Date("2026-07-01T12:00:00.000Z");

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isDatabaseConfigured: vi.fn(),
  getMarketPulseSettings: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getTodayMarketPulsePlaySessionSnapshot: vi.fn(),
  getTodayMarketPulsePlaySession: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  loadMarketPulseNextCycleStatus: vi.fn(),
  shouldShowLearningInterestPrompt: vi.fn(),
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
  getTodayMarketPulsePlaySessionSnapshot: mocks.getTodayMarketPulsePlaySessionSnapshot,
  getTodayMarketPulsePlaySession: mocks.getTodayMarketPulsePlaySession,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed: vi.fn(() => false),
}));

vi.mock("@/lib/acquisition/profile", () => ({
  shouldShowLearningInterestPrompt: mocks.shouldShowLearningInterestPrompt,
}));

import { getMarketPulsePlayPageData } from "@/lib/market-pulse/play-data";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const cycleStart = new Date("2026-06-30T16:00:00.000Z");
const cycleEnd = new Date("2026-07-10T16:00:00.000Z");
const cycleReveal = new Date("2026-07-10T16:00:00.000Z");

const activeCycle = {
  id: "cycle-july",
  name: "July 2026 Market Pulse",
  prizeLabel: "One Ocean Park ticket",
  startsAt: cycleStart,
  endsAt: cycleEnd,
  revealAt: cycleReveal,
  status: "OPEN" as const,
  cards: [],
};

function buildDbCard() {
  return buildMarketPulseTestCard({
    id: "card-day-1",
    cycleId: activeCycle.id,
    dayIndex: 1,
    companyName: "Example Co",
    ticker: "EX",
    logoInitials: "EX",
    headline: "Headline",
    sourceName: "Source",
    sourceDate: cycleStart,
    summary: "Summary",
    userPrompt: "Prompt",
    ppaInsight: "Hidden insight",
    publishedAt: cycleStart,
    ppaSignalLockedAt: cycleStart,
    createdAt: cycleStart,
    updatedAt: cycleStart,
  });
}

function buildSnapshot() {
  const card = buildDbCard();
  return {
    cycle: {
      id: activeCycle.id,
      name: activeCycle.name,
      startsAt: activeCycle.startsAt,
      endsAt: activeCycle.endsAt,
      revealAt: activeCycle.revealAt,
      status: activeCycle.status,
    },
    cards: [
      {
        card: getMarketPulseCardPublicPayload(card, {
          cycle: activeCycle,
          at: AFTER_LAUNCH,
        }),
        userDecision: null,
      },
    ],
  };
}

describe("Launch smoke — public play gates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AFTER_LAUNCH);
    vi.clearAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeCycle);
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(buildSnapshot());
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });
    mocks.auth.mockResolvedValue(null);
    mocks.shouldShowLearningInterestPrompt.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is playable when runtime is OPEN, cycle is active, and today's card is published", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(buildSnapshot());

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.runtimeOpen).toBe(true);
    expect(data.challengeName).toBe("July 2026 Market Pulse");
    expect(data.card).not.toBeNull();
    expect(data.card).not.toHaveProperty("ppaSignal");
    expect(data.card).not.toHaveProperty("ppaInsight");
  });

  it("is playable for logged-in users without a contact number", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-no-phone", role: "USER", needsOnboarding: false },
    });
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(buildSnapshot());

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.isAuthenticated).toBe(true);
  });

  it("prompts guests to sign in instead of submitting", async () => {
    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("sign_in_required");
    expect(data.isAuthenticated).toBe(false);
    expect(data.card).not.toBeNull();
    expect(data.card).not.toHaveProperty("ppaInsight");
  });

  it("is not playable when runtime is CLOSED", async () => {
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "CLOSED" });
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("runtime_closed");
    expect(data.runtimeOpen).toBe(false);
    expect(data.card).toBeNull();
  });

  it("keeps runtime_closed when a future cycle exists but does not imply playability", async () => {
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "CLOSED" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-aug",
      name: "August 2026 Market Pulse",
      startsAtIso: "2026-08-01T01:00:00.000Z",
      endsAtIso: null,
      revealAtIso: null,
      firstCardReleaseAtIso: "2026-08-01T01:00:00.000Z",
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("runtime_closed");
    expect(data.nextCycle.status).toBe("available");
    expect(JSON.stringify(data.nextCycle)).not.toContain("ppaSignal");
  });

  it("shows cycle_unavailable with next cycle when pinned cycle has not started", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    const futureStart = new Date("2026-08-01T01:00:00.000Z");
    mocks.getMarketPulseSettings.mockResolvedValue({
      runtimeStatus: "OPEN",
      activeCycle: {
        id: "cycle-aug",
        name: "August 2026 Market Pulse",
        status: "OPEN",
        startsAt: futureStart,
        endsAt: new Date("2026-08-11T01:00:00.000Z"),
        revealAt: new Date("2026-08-11T01:00:00.000Z"),
      },
    });
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-aug",
      name: "August 2026 Market Pulse",
      startsAtIso: futureStart.toISOString(),
      endsAtIso: null,
      revealAtIso: null,
      firstCardReleaseAtIso: futureStart.toISOString(),
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("cycle_unavailable");
    expect(data.unavailableIssue).toBe("not_started");
    expect(data.nextCycle.status).toBe("available");
    expect(data.nextCycle).toMatchObject({
      cycleId: "cycle-aug",
      startsAtIso: futureStart.toISOString(),
    });
  });

  it("shows between-cycles state with TBC when no active cycle or future cycle exists", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.getMarketPulseSettings.mockResolvedValue({
      runtimeStatus: "OPEN",
      activeCycle: null,
    });
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("between_cycles");
    expect(data.cycleId).toBeNull();
    expect(data.card).toBeNull();
    expect(data.nextCycle).toEqual({ status: "tbc" });
  });

  it("shows between-cycles state with the next scheduled challenge when available", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.getMarketPulseSettings.mockResolvedValue({
      runtimeStatus: "OPEN",
      activeCycle: null,
    });
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-aug",
      name: "August 2026 Market Pulse",
      startsAtIso: "2026-07-11T16:00:00.000Z",
      endsAtIso: "2026-07-21T16:00:00.000Z",
      revealAtIso: "2026-07-21T16:00:00.000Z",
      firstCardReleaseAtIso: "2026-07-11T01:00:00.000Z",
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("between_cycles");
    expect(data.nextCycle.status).toBe("available");
  });

  it("is not playable when there is no published card for today", async () => {
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("no_card_today");
    expect(data.card).toBeNull();
  });

  it("includes nextCardReleaseAtIso when the next published card unlocks in the future", async () => {
    const futureRelease = new Date("2026-07-06T01:00:00.000Z");
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(null);
    mocks.getActiveMarketPulseCycle.mockResolvedValue({
      ...activeCycle,
      cards: [
        {
          ...buildDbCard(),
          dayIndex: 2,
          publishedAt: futureRelease,
        },
      ],
    });
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("no_card_today");
    expect(data.nextCardReleaseAtIso).toBe(futureRelease.toISOString());
  });

  it("blocks USER with pre_launch before 1 Jul 2026 00:00 HKT", async () => {
    vi.setSystemTime(new Date("2026-06-30T15:59:59.999Z"));
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("pre_launch");
    expect(mocks.getActiveMarketPulseCycle).not.toHaveBeenCalled();
  });

  it("does not show the learning interest prompt for guests", async () => {
    const data = await getMarketPulsePlayPageData();

    expect(data.acquisition.showLearningInterestPrompt).toBe(false);
    expect(mocks.shouldShowLearningInterestPrompt).not.toHaveBeenCalled();
  });

  it("surfaces the learning interest prompt for eligible authenticated users", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(buildSnapshot());
    mocks.shouldShowLearningInterestPrompt.mockResolvedValue(true);

    const data = await getMarketPulsePlayPageData();

    expect(mocks.shouldShowLearningInterestPrompt).toHaveBeenCalledWith("user-1");
    expect(data.acquisition.showLearningInterestPrompt).toBe(true);
    expect(data.status).toBe("playable");
  });

  it("keeps gameplay status unchanged when the learning interest prompt is eligible", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue({
      ...buildSnapshot(),
      cards: [
        {
          ...buildSnapshot().cards[0]!,
          userDecision: { decision: "BULLISH" },
        },
      ],
    });
    mocks.shouldShowLearningInterestPrompt.mockResolvedValue(true);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("locked");
    expect(data.lockedDecision).toBe("BULLISH");
    expect(data.acquisition.showLearningInterestPrompt).toBe(true);
  });
});
