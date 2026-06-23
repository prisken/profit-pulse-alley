import "server-only";

import type { MarketPulseLeaderboardType } from "@prisma/client";

import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/server";

const LEADERBOARD_LIMIT = 50;

export type MarketPulseLeaderboardTab = "current" | "monthly" | "all-time";

export type MarketPulseLeaderboardTabData = {
  entries: MarketPulseLeaderboardEntryRow[];
  isRevealed: boolean;
  cycleName?: string | null;
  cycleId?: string | null;
};

export type MarketPulseLeaderboardPageData = {
  current: MarketPulseLeaderboardTabData;
  monthly: MarketPulseLeaderboardTabData;
  allTime: MarketPulseLeaderboardTabData;
};

async function loadTab(
  mode: MarketPulseLeaderboardType,
  cycleId?: string | null,
): Promise<MarketPulseLeaderboardEntryRow[]> {
  try {
    return await getMarketPulseLeaderboard({
      mode,
      cycleId: cycleId ?? null,
      limit: LEADERBOARD_LIMIT,
    });
  } catch (error) {
    console.error(`[market-pulse/leaderboard-data] Failed ${mode}:`, error);
    return [];
  }
}

export async function getMarketPulseLeaderboardPageData(): Promise<MarketPulseLeaderboardPageData> {
  let activeCycle = null;
  try {
    activeCycle = await getActiveMarketPulseCycle();
  } catch (error) {
    console.error("[market-pulse/leaderboard-data] Active cycle failed:", error);
  }

  const cycleId = activeCycle?.id ?? null;
  const isRevealed = activeCycle
    ? isMarketPulseCycleRevealed(activeCycle)
    : false;

  const [currentEntries, monthlyEntries, allTimeEntries] = await Promise.all([
    loadTab("CURRENT_CYCLE", cycleId),
    loadTab("MONTHLY"),
    loadTab("ALL_TIME"),
  ]);

  const currentRevealed =
    currentEntries.length > 0 ? currentEntries[0]!.isRevealed : isRevealed;

  return {
    current: {
      entries: currentEntries,
      isRevealed: currentRevealed,
      cycleName: activeCycle?.name ?? null,
      cycleId,
    },
    monthly: {
      entries: monthlyEntries,
      isRevealed: true,
    },
    allTime: {
      entries: allTimeEntries,
      isRevealed: true,
    },
  };
}
