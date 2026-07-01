/**
 * Launch smoke tests — automated coverage for 1 Jul 2026 00:00 HKT go-live.
 *
 * Manual pass/fail checklist: docs/market-pulse-deploy-checklist.md § Launch smoke test
 * Related: play-data.launch.test.ts, reveal-data.launch.test.ts, launch-first-cycle-boundaries.test.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketPulseCard } from "@prisma/client";

import { evaluatePlayerVisibilityReadiness } from "@/lib/market-pulse/admin-player-visibility-readiness";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { buildLeaderboardCycleOptions, getLeaderboardViewState } from "@/lib/market-pulse/leaderboard-cycle-select";
import {
  canAccessMarketPulsePlay,
  canSubmitMarketPulseDecision,
  shouldShowMarketPulsePreLaunchUi,
} from "@/lib/market-pulse/launch-config";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";
import { handleSubmitMarketPulseDecision } from "@/lib/market-pulse/player-handlers";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

/** 1 Jul 2026 00:00 HKT */
const JUL_1_0000_HKT = new Date("2026-06-30T16:00:00.000Z");
/** 1 Jul 2026 00:01 HKT */
const JUL_1_0001_HKT = new Date("2026-06-30T16:01:00.000Z");
/** 1 Jul 2026 09:00 HKT — standard card release */
const JUL_1_0900_HKT = new Date("2026-07-01T01:00:00.000Z");

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
  submitMarketPulseDecision: vi.fn(),
}));

const unrevealedCycle = {
  id: "cycle-july",
  name: "July 2026 Market Pulse",
  startsAt: "2026-06-30T16:00:00.000Z",
  endsAt: "2026-07-10T16:00:00.000Z",
  revealAt: "2026-07-10T16:00:00.000Z",
  status: "OPEN",
};

function buildLaunchCard(): MarketPulseCard {
  return buildMarketPulseTestCard({
    id: "card-1",
    cycleId: "cycle-july",
    dayIndex: 1,
    companyName: "Example Co",
    ticker: "EX",
    logoInitials: "EX",
    headline: "Headline",
    sourceName: "Source",
    sourceDate: JUL_1_0000_HKT,
    summary: "Summary",
    userPrompt: "Prompt",
    ppaInsight: "Hidden insight",
    publishedAt: JUL_1_0000_HKT,
    ppaSignalLockedAt: JUL_1_0000_HKT,
    createdAt: JUL_1_0000_HKT,
    updatedAt: JUL_1_0000_HKT,
  });
}

describe("Launch smoke — public opening (1 Jul 2026 HKT)", () => {
  it("opens USER and guest access on and after launch", () => {
    expect(shouldShowMarketPulsePreLaunchUi(JUL_1_0000_HKT)).toBe(false);
    expect(canAccessMarketPulsePlay("USER", JUL_1_0000_HKT)).toBe(true);
    expect(canAccessMarketPulsePlay(undefined, JUL_1_0001_HKT)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", JUL_1_0001_HKT)).toBe(true);
  });

  it("keeps ADMIN access before launch for staging verification", () => {
    const beforeLaunch = new Date("2026-06-30T15:59:59.999Z");
    expect(canAccessMarketPulsePlay("ADMIN", beforeLaunch)).toBe(true);
    expect(canSubmitMarketPulseDecision("ADMIN", beforeLaunch)).toBe(true);
  });

  it("requires sign-in before guests can submit decisions", async () => {
    const result = await handleSubmitMarketPulseDecision(
      undefined,
      { cardId: "card-1", decision: "BULLISH" },
      { ipHash: null, userAgentHash: null },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNAUTHENTICATED");
      expect(result.error).toMatch(/sign in/i);
    }
  });
});

describe("Launch smoke — PPA privacy before reveal", () => {
  it("omits PPA from play and hub-safe card payloads before reveal", () => {
    const cycle = {
      status: "OPEN" as const,
      revealAt: new Date("2026-07-10T16:00:00.000Z"),
    };
    const payload = getMarketPulseCardPublicPayload(buildLaunchCard(), {
      cycle,
      at: JUL_1_0001_HKT,
    });

    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();

    const swipe = toMarketPulseSwipeCardData({
      ...payload,
      sourceDate: payload.sourceDate?.toISOString() ?? null,
    });
    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
  });

  it("keeps leaderboard rows free of PPA fields before reveal", () => {
    const row: MarketPulseLeaderboardEntryRow = {
      rank: 1,
      userId: "user-1",
      playerName: "Player",
      image: null,
      score: 0,
      participationPoints: 10,
      bonusPoints: 0,
      isRevealed: false,
    };

    expect(row).not.toHaveProperty("ppaSignal");
    expect(row).not.toHaveProperty("ppaInsight");
    expect(row.isRevealed).toBe(false);
  });
});

describe("Launch smoke — leaderboard states", () => {
  it("locks leaderboard before cycle reveal", () => {
    const selected = buildLeaderboardCycleOptions(
      unrevealedCycle,
      [],
      JUL_1_0001_HKT,
    )[0]!;

    expect(selected.isRevealed).toBe(false);
    expect(getLeaderboardViewState(selected, 5, false)).toBe("locked");
  });

  it("shows revealed standings after reveal with scores", () => {
    const revealed = buildLeaderboardCycleOptions(
      {
        ...unrevealedCycle,
        status: "REVEALED",
        revealAt: "2026-07-10T16:00:00.000Z",
      },
      [],
      new Date("2026-07-10T16:00:00.001Z"),
    )[0]!;

    expect(revealed.isRevealed).toBe(true);
    expect(getLeaderboardViewState(revealed, 3, false)).toBe("ready");
  });
});

describe("Launch smoke — admin access and readiness", () => {
  beforeEach(() => {
    vi.resetModules();
    authMocks.requireAdminSession.mockReset();
  });

  it("blocks /admin/market-pulse data for non-admin sessions", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);
    const { getMarketPulseAdminDashboardData } = await import(
      "@/lib/market-pulse/admin-data"
    );

    await expect(getMarketPulseAdminDashboardData()).resolves.toBeNull();
  });

  it("blocks builder data for non-admin sessions", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);
    const { getMarketPulseCycleBuilderData } = await import(
      "@/lib/market-pulse/admin-builder-data"
    );

    await expect(getMarketPulseCycleBuilderData("cycle-1")).resolves.toBeNull();
  });

  it("reports launch readiness ready vs blocked from operational gates", () => {
    const ready = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "OPEN",
      activeCycle: {
        id: "cycle-july",
        name: "July 2026 Market Pulse",
        status: "OPEN",
        startsAt: unrevealedCycle.startsAt,
        endsAt: unrevealedCycle.endsAt,
        revealAt: unrevealedCycle.revealAt,
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
        signalCardCount: 1,
        restCardCount: 0,
      },
      activeCycleCards: [
        {
          id: "card-1",
          cycleId: "cycle-july",
          dayIndex: 1,
          companyName: "Example Co",
          companyNameZh: null,
          ticker: "EX",
          exchange: null,
          logoUrl: null,
          logoInitials: null,
          priceLabel: null,
          priceDirection: null,
          headline: "Headline",
          newsBody: null,
          sourceName: null,
          sourceUrl: null,
          sourceDate: unrevealedCycle.startsAt,
          cardImageUrl: null,
          cardImageAlt: null,
          summary: null,
          userPrompt: null,
          status: "PUBLISHED",
          ppaSignal: "BULLISH",
          ppaInsight: "Insight",
          ppaSignalLockedAt: unrevealedCycle.startsAt,
          publishedAt: unrevealedCycle.startsAt,
          revealAt: null,
          decisionCount: 0,
          ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
        },
      ],
      now: JUL_1_0900_HKT,
    });

    expect(ready.overallStatus).toBe("ready");
    expect(ready.playersCanSubmitToday).toBe(true);

    const blocked = evaluatePlayerVisibilityReadiness({
      runtimeStatus: "CLOSED",
      activeCycle: null,
      activeCycleCards: [],
      now: JUL_1_0001_HKT,
    });

    expect(blocked.overallStatus).toBe("needs_attention");
    expect(blocked.playersCanSubmitToday).toBe(false);
  });
});

describe("Launch smoke — /fortify-survey regression", () => {
  it("keeps the survey route as a static page without redirects", () => {
    const pagePath = path.join(
      process.cwd(),
      "src/app/fortify-survey/page.tsx",
    );
    const layoutPath = path.join(
      process.cwd(),
      "src/app/fortify-survey/layout.tsx",
    );

    const page = readFileSync(pagePath, "utf8");
    const layout = readFileSync(layoutPath, "utf8");

    expect(page).toContain("FortifyYourFutureSurvey");
    expect(page).not.toMatch(/\bredirect\s*\(/);
    expect(layout).not.toMatch(/\bredirect\s*\(/);
  });
});
