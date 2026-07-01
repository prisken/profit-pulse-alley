import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { evaluatePlayerVisibilityReadiness } from "@/lib/market-pulse/admin-player-visibility-readiness";
import { canAccessMarketPulsePlay } from "@/lib/market-pulse/launch-config";

const AFTER_PUBLIC_LAUNCH = new Date("2026-07-01T12:00:00.000Z");
const BEFORE_PUBLIC_LAUNCH = new Date("2026-06-30T12:00:00.000Z");

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: vi.fn(),
}));

function buildCycle(
  overrides: Partial<MarketPulseAdminCycleRow> = {},
): MarketPulseAdminCycleRow {
  return {
    id: "cycle-1",
    name: "Cycle 01",
    status: "OPEN",
    startsAt: "2026-07-01T00:00:00.000Z",
    endsAt: "2026-07-10T16:00:00.000Z",
    revealAt: "2026-07-10T16:00:00.000Z",
    prizeLabel: "One Ocean Park ticket",
    isActive: true,
    isPlayableNow: true,
    playabilityIssue: null,
    cardCount: 1,
    decisionCount: 0,
    usersPlayed: 0,
    missingSignalCount: 0,
    unlockedCount: 0,
    averageDecisionsPerParticipant: 0,
    completionRatePercent: null,
    scoreEventCount: 0,
    scoresGenerated: false,
    topWinnerName: null,
    topWinnerScore: null,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

function buildCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    companyName: "Test Co",
    companyNameZh: null,
    ticker: "TEST",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: null,
    sourceName: null,
    sourceUrl: null,
    sourceDate: "2026-07-01T00:00:00.000Z",
    cardImageUrl: null,
    cardImageAlt: null,
    summary: null,
    userPrompt: "Prompt",
    status: "PUBLISHED",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-07-01T00:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("evaluatePlayerVisibilityReadiness", () => {
  it("reports ready when all player gates pass after public launch", () => {
    const result = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      activeCycleCards: [buildCard()],
      now: AFTER_PUBLIC_LAUNCH,
    });

    expect(result.overallStatus).toBe("ready");
    expect(result.headline).toBe("Ready for players");
    expect(result.playersCanSubmitToday).toBe(true);
    expect(result.detail).toBe("Players can submit today");
    expect(result.checks.find((check) => check.id === "runtime-open")?.status).toBe(
      "pass",
    );
    expect(result.checks.find((check) => check.id === "public-launch-gate")?.status).toBe(
      "pass",
    );
    expect(result.checks.find((check) => check.id === "leaderboard-locked")?.status).toBe(
      "info",
    );
    expect(result.checks.find((check) => check.id === "ppa-privacy")?.status).toBe(
      "pass",
    );
  });

  it("is blocked when runtime is closed", () => {
    const result = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "CLOSED",
      activeCycle: buildCycle(),
      activeCycleCards: [buildCard()],
      now: AFTER_PUBLIC_LAUNCH,
    });

    expect(result.overallStatus).toBe("needs_attention");
    expect(result.headline).toBe("Needs attention");
    expect(result.playersCanSubmitToday).toBe(false);
    expect(result.checks.find((check) => check.id === "runtime-open")?.message).toBe(
      "Runtime is closed.",
    );
  });

  it("is blocked when no active cycle is set", () => {
    const result = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "OPEN",
      activeCycle: null,
      activeCycleCards: [],
      now: AFTER_PUBLIC_LAUNCH,
    });

    expect(result.overallStatus).toBe("needs_attention");
    expect(result.checks.find((check) => check.id === "active-cycle")?.message).toBe(
      "No active cycle is set.",
    );
  });

  it("is blocked when there is no published card for today", () => {
    const result = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      activeCycleCards: [buildCard({ status: "DRAFT", publishedAt: null })],
      now: AFTER_PUBLIC_LAUNCH,
    });

    expect(result.overallStatus).toBe("needs_attention");
    expect(
      result.checks.find((check) => check.id === "today-card-published")?.message,
    ).toContain("DRAFT");
    expect(result.playersCanSubmitToday).toBe(false);
  });

  it("does not include admin bypass or seed copy", () => {
    const result = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      activeCycleCards: [buildCard()],
      now: BEFORE_PUBLIC_LAUNCH,
    });

    const messages = result.checks.map((check) => check.message).join(" ");
    expect(messages).not.toContain("ADMIN");
    expect(messages).not.toContain("bypass");
    expect(messages).not.toContain("seed");
    expect(messages).not.toContain("demo");
    expect(result.checks.find((check) => check.id === "public-launch-gate")?.status).toBe(
      "info",
    );
  });

  it("allows USER play after 1 Jul 2026 HKT", () => {
    expect(canAccessMarketPulsePlay("USER", AFTER_PUBLIC_LAUNCH)).toBe(true);
    expect(canAccessMarketPulsePlay("USER", BEFORE_PUBLIC_LAUNCH)).toBe(false);
  });
});

describe("Market Pulse admin dashboard access", () => {
  beforeEach(() => {
    vi.resetModules();
    authMocks.requireAdminSession.mockReset();
  });

  it("returns null for non-admin callers", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);
    const { getMarketPulseAdminDashboardData } = await import(
      "@/lib/market-pulse/admin-data"
    );

    await expect(getMarketPulseAdminDashboardData()).resolves.toBeNull();
  });
});
