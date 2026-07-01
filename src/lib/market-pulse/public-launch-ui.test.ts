import { describe, expect, it } from "vitest";

import { buildLeaderboardCycleOptions, getLeaderboardViewState } from "@/lib/market-pulse/leaderboard-cycle-select";
import { deriveHubLobbyStatus } from "@/lib/market-pulse/hub-lobby-state";
import {
  canAccessMarketPulsePlay,
  canSubmitMarketPulseDecision,
  shouldShowMarketPulsePreLaunchUi,
} from "@/lib/market-pulse/launch-config";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const AFTER_PUBLIC_LAUNCH = new Date("2026-07-01T12:00:00.000Z");
const BEFORE_PUBLIC_LAUNCH = new Date("2026-06-30T12:00:00.000Z");

const hubBase = {
  leaderboardRevealed: false,
  runtimeOpen: true,
  hasDatabaseCycle: true,
  revealRemainingMs: 60_000,
} as const;

describe("public launch UI (post 1 Jul 2026 HKT)", () => {
  it("hides pre-launch marketing after public launch", () => {
    expect(shouldShowMarketPulsePreLaunchUi(AFTER_PUBLIC_LAUNCH)).toBe(false);
    expect(shouldShowMarketPulsePreLaunchUi(BEFORE_PUBLIC_LAUNCH)).toBe(true);
  });

  it("allows guests and USER members to access play after launch", () => {
    expect(canAccessMarketPulsePlay(undefined, AFTER_PUBLIC_LAUNCH)).toBe(true);
    expect(canAccessMarketPulsePlay("USER", AFTER_PUBLIC_LAUNCH)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", AFTER_PUBLIC_LAUNCH)).toBe(true);
  });

  it("derives an active hub lobby instead of pre-launch after launch", () => {
    expect(deriveHubLobbyStatus(hubBase, false)).toBe("open");
    expect(deriveHubLobbyStatus(hubBase, true)).toBe("pre_launch");
  });

  it("keeps leaderboard locked before cycle reveal after public launch", () => {
    const activeUnrevealed = buildLeaderboardCycleOptions(
      {
        id: "active",
        name: "Cycle 01",
        startsAt: "2026-07-01T00:00:00.000Z",
        endsAt: "2026-07-10T16:00:00.000Z",
        revealAt: "2026-07-10T16:00:00.000Z",
        status: "OPEN",
      },
      [],
      AFTER_PUBLIC_LAUNCH,
    )[0]!;

    expect(getLeaderboardViewState(activeUnrevealed, 5, false)).toBe("locked");
  });

  it("strips PPA from public play payloads before reveal after launch", () => {
    const cycle = {
      status: "OPEN" as const,
      revealAt: new Date("2026-07-10T16:00:00.000Z"),
    };
    const card = buildMarketPulseTestCard({
      id: "card-1",
      cycleId: "cycle-1",
      dayIndex: 1,
      companyName: "Example Co",
      ticker: "EX",
      logoInitials: "EX",
      headline: "Headline",
      summary: "Summary",
      sourceDate: new Date("2026-07-01T00:00:00.000Z"),
      ppaInsight: "Hidden insight",
      publishedAt: new Date("2026-07-01T00:00:00.000Z"),
      ppaSignalLockedAt: new Date("2026-07-01T00:00:00.000Z"),
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle,
      at: AFTER_PUBLIC_LAUNCH,
    });

    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();

    const swipe = toMarketPulseSwipeCardData({
      ...payload,
      sourceDate: payload.sourceDate?.toISOString() ?? null,
      ppaSignal: payload.ppaSignal,
      ppaInsight: payload.ppaInsight,
    });

    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
  });
});
