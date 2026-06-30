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
  getTodayMarketPulseCardSnapshot: vi.fn(),
  getTodayMarketPulseCardForUser: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
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
  getTodayMarketPulseCardSnapshot: mocks.getTodayMarketPulseCardSnapshot,
  getTodayMarketPulseCardForUser: mocks.getTodayMarketPulseCardForUser,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed: vi.fn(() => false),
}));

import { getMarketPulsePlayPageData } from "@/lib/market-pulse/play-data";

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
  return {
    id: "card-day-1",
    cycleId: activeCycle.id,
    dayIndex: 1,
    companyName: "Example Co",
    companyNameZh: null,
    ticker: "EX",
    exchange: null,
    logoUrl: null,
    logoInitials: "EX",
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: null,
    sourceName: "Source",
    sourceUrl: null,
    sourceDate: cycleStart,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: "Prompt",
    ppaSignal: "BULLISH" as const,
    ppaInsight: "Hidden insight",
    status: "PUBLISHED" as const,
    publishedAt: cycleStart,
    revealAt: null,
    ppaSignalLockedAt: cycleStart,
    createdAt: cycleStart,
    updatedAt: cycleStart,
  };
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
    card: getMarketPulseCardPublicPayload(card, {
      cycle: activeCycle,
      at: AFTER_LAUNCH,
    }),
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
    mocks.getTodayMarketPulseCardSnapshot.mockResolvedValue(buildSnapshot());
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);
    mocks.auth.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is playable when runtime is OPEN, cycle is active, and today's card is published", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });
    mocks.getTodayMarketPulseCardForUser.mockResolvedValue({
      ...buildSnapshot(),
      userDecision: null,
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.runtimeOpen).toBe(true);
    expect(data.challengeName).toBe("July 2026 Market Pulse");
    expect(data.card).not.toBeNull();
    expect(data.card).not.toHaveProperty("ppaSignal");
    expect(data.card).not.toHaveProperty("ppaInsight");
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

  it("is not playable when no active cycle exists", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.getMarketPulseSettings.mockResolvedValue({
      runtimeStatus: "OPEN",
      activeCycle: null,
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("no_active_cycle");
    expect(data.cycleId).toBeNull();
    expect(data.card).toBeNull();
  });

  it("is not playable when there is no published card for today", async () => {
    mocks.getTodayMarketPulseCardSnapshot.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("no_card_today");
    expect(data.card).toBeNull();
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
});
