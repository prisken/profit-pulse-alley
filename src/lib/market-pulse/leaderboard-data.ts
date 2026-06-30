import "server-only";

import { isDatabaseConfigured } from "@/lib/db-config";
import { filterCyclesForPublicPlay } from "@/lib/market-pulse/demo-cycle-guards";
import { prisma } from "@/lib/prisma";
import {
  buildLeaderboardCycleOptions,
  getLeaderboardViewState,
  resolveLeaderboardSelectedCycleId,
  type LeaderboardCycleOption,
  type LeaderboardViewState,
} from "@/lib/market-pulse/leaderboard-cycle-select";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
} from "@/lib/market-pulse/server";
import {
  getLeaderboardViewerScore,
  type LeaderboardViewerScorePanel,
} from "@/lib/market-pulse/leaderboard-viewer-score";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";

const LEADERBOARD_LIMIT = 50;

export type {
  LeaderboardCycleOption,
  LeaderboardViewState,
} from "@/lib/market-pulse/leaderboard-cycle-select";

export type { LeaderboardViewerScorePanel } from "@/lib/market-pulse/leaderboard-viewer-score";

export type MarketPulseLeaderboardPageData = {
  cycles: LeaderboardCycleOption[];
  selectedCycle: LeaderboardCycleOption | null;
  entries: MarketPulseLeaderboardEntryRow[];
  viewState: LeaderboardViewState;
  viewerScore: LeaderboardViewerScorePanel;
};

const EMPTY_PAGE_DATA: MarketPulseLeaderboardPageData = {
  cycles: [],
  selectedCycle: null,
  entries: [],
  viewState: "no_cycles",
  viewerScore: { state: "logged_out" },
};

async function listHistoricalCyclesForLeaderboard(now: Date) {
  return prisma.marketPulseCycle.findMany({
    where: {
      status: { not: "ARCHIVED" },
      OR: [{ status: "REVEALED" }, { revealAt: { lte: now } }],
    },
    orderBy: { revealAt: "desc" },
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
      revealAt: true,
      status: true,
    },
  });
}

export async function getMarketPulseLeaderboardPageData(
  requestedCycleId?: string | null,
  viewerUserId?: string | null,
): Promise<MarketPulseLeaderboardPageData> {
  if (!isDatabaseConfigured()) {
    return EMPTY_PAGE_DATA;
  }

  const now = new Date();

  let activeCycle = null;
  try {
    activeCycle = await getActiveMarketPulseCycle();
  } catch (error) {
    console.error("[market-pulse/leaderboard-data] Active cycle failed:", error);
  }

  let historicalCycles: Awaited<ReturnType<typeof listHistoricalCyclesForLeaderboard>> =
    [];
  try {
    historicalCycles = await listHistoricalCyclesForLeaderboard(now);
  } catch (error) {
    console.error(
      "[market-pulse/leaderboard-data] Historical cycles failed:",
      error,
    );
  }

  historicalCycles = filterCyclesForPublicPlay(historicalCycles);

  const cycles = buildLeaderboardCycleOptions(
    activeCycle,
    historicalCycles,
    now,
  );

  const { cycleId: selectedCycleId, unavailable } = resolveLeaderboardSelectedCycleId(
    requestedCycleId,
    cycles,
    activeCycle?.id ?? null,
  );

  const selectedCycle =
    selectedCycleId != null
      ? (cycles.find((cycle) => cycle.id === selectedCycleId) ?? null)
      : null;

  let entries: MarketPulseLeaderboardEntryRow[] = [];

  if (selectedCycle?.isRevealed && selectedCycleId) {
    try {
      entries = await getMarketPulseLeaderboard({
        mode: "CURRENT_CYCLE",
        cycleId: selectedCycleId,
        limit: LEADERBOARD_LIMIT,
      });
    } catch (error) {
      console.error("[market-pulse/leaderboard-data] Leaderboard failed:", error);
      entries = [];
    }
  }

  const viewState = getLeaderboardViewState(
    selectedCycle,
    entries.length,
    unavailable,
  );

  let viewerScore: LeaderboardViewerScorePanel = { state: "logged_out" };
  try {
    viewerScore = await getLeaderboardViewerScore(viewerUserId, selectedCycle);
  } catch (error) {
    console.error(
      "[market-pulse/leaderboard-data] Viewer score failed:",
      error,
    );
    viewerScore = viewerUserId
      ? { state: "no_cycle" }
      : { state: "logged_out" };
  }

  return {
    cycles,
    selectedCycle,
    entries: viewState === "ready" ? entries : [],
    viewState,
    viewerScore,
  };
}
