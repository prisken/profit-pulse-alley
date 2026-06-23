import { prisma } from "@/lib/prisma";
import { getCurrentMarketPulseCycle } from "@/lib/market-pulse/challenge-cycle";
import type {
  MarketPulseHistoryEntry,
  MarketPulseLeaderboardEntry,
  MarketPulseLeaderboardView,
} from "@/lib/market-pulse/types";

const DEFAULT_LEADERBOARD_LIMIT = 10;

type LeaderboardScoreRow = {
  id: string;
  score: number;
  cycleId: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
};

function mapToLeaderboardEntries(
  rows: LeaderboardScoreRow[],
): MarketPulseLeaderboardEntry[] {
  return rows.map((entry, index) => ({
    id: entry.id,
    rank: index + 1,
    playerName: entry.user.name?.trim() || "Member",
    score: entry.score,
    image: entry.user.image,
    cycleId: entry.cycleId ?? undefined,
    createdAt: entry.createdAt,
    completedAt: entry.createdAt,
  }));
}

async function queryLeaderboardRows(
  limit: number,
  cycleId?: string,
): Promise<LeaderboardScoreRow[]> {
  return prisma.gameScore.findMany({
    take: limit,
    ...(cycleId ? { where: { cycleId } } : {}),
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    include: {
      user: {
        select: { name: true, image: true },
      },
    },
  });
}

export async function getCurrentMarketPulseLeaderboard(
  limit = DEFAULT_LEADERBOARD_LIMIT,
): Promise<MarketPulseLeaderboardEntry[]> {
  const { cycleId } = getCurrentMarketPulseCycle();
  const rows = await queryLeaderboardRows(limit, cycleId);
  return mapToLeaderboardEntries(rows);
}

export async function getAllTimeMarketPulseLeaderboard(
  limit = DEFAULT_LEADERBOARD_LIMIT,
): Promise<MarketPulseLeaderboardEntry[]> {
  const rows = await queryLeaderboardRows(limit);
  return mapToLeaderboardEntries(rows);
}

export async function getUserMarketPulseHistory(
  userId: string,
): Promise<MarketPulseHistoryEntry[]> {
  return prisma.gameScore.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      score: true,
      createdAt: true,
      cycleId: true,
      gameVersion: true,
    },
  });
}

/** Readable cycle window for history rows, e.g. `2026-01-01 – 2026-01-10`. */
export function formatMarketPulseHistoryCycleLabel(cycleId: string): string {
  const [start, end] = cycleId.split("_");
  if (!start || !end) {
    return cycleId;
  }
  return `${start} – ${end}`;
}

export async function getGameHubLeaderboardView(
  limit = DEFAULT_LEADERBOARD_LIMIT,
): Promise<MarketPulseLeaderboardView> {
  const { cycleId } = getCurrentMarketPulseCycle();
  const cycleEntries = await getCurrentMarketPulseLeaderboard(limit);

  if (cycleEntries.length > 0) {
    return {
      entries: cycleEntries,
      mode: "current-cycle",
      cycleId,
      usedAllTimeFallback: false,
    };
  }

  const allTimeEntries = await getAllTimeMarketPulseLeaderboard(limit);

  return {
    entries: allTimeEntries,
    mode: "all-time",
    cycleId,
    usedAllTimeFallback: allTimeEntries.length > 0,
  };
}
