import "server-only";

import { prisma } from "@/lib/prisma";
import type { SiteLocale } from "@/lib/i18n/locales";
import { DEFAULT_SITE_LOCALE } from "@/lib/i18n/locales";
import type { LeaderboardCycleOption } from "@/lib/market-pulse/leaderboard-cycle-select";
import {
  getLeaderboardViewerScoreBreakdown,
  type LeaderboardViewerCardBreakdown,
} from "@/lib/market-pulse/leaderboard-score-breakdown";
import { getUserMarketPulseProgress } from "@/lib/market-pulse/server";

export type { LeaderboardViewerCardBreakdown } from "@/lib/market-pulse/leaderboard-score-breakdown";

/** Client-safe personal score panel — never includes other users' data or PPA fields. */
export type LeaderboardViewerScorePanel =
  | { state: "logged_out" }
  | { state: "no_cycle" }
  | {
      state: "locked_participating";
      cycleName: string;
    }
  | {
      state: "locked_no_participation";
      cycleName: string;
    }
  | {
      state: "revealed_no_score";
      cycleName: string;
      decisionsSubmitted: number;
      totalCards: number;
    }
  | {
      state: "revealed_summary";
      cycleName: string;
      totalScore: number;
      participationScore: number | null;
      rank: number | null;
      decisionsSubmitted: number;
      totalCards: number;
      breakdown: LeaderboardViewerCardBreakdown[];
    };

export async function getLeaderboardViewerScore(
  userId: string | null | undefined,
  selectedCycle: LeaderboardCycleOption | null,
  locale: SiteLocale = DEFAULT_SITE_LOCALE,
): Promise<LeaderboardViewerScorePanel> {
  if (!userId) {
    return { state: "logged_out" };
  }

  if (!selectedCycle) {
    return { state: "no_cycle" };
  }

  const cycleName = selectedCycle.name;

  if (!selectedCycle.isRevealed) {
    const participated = await prisma.marketPulseDecision.count({
      where: {
        userId,
        cycleId: selectedCycle.id,
      },
    });

    return participated > 0
      ? { state: "locked_participating", cycleName }
      : { state: "locked_no_participation", cycleName };
  }

  const [progress, storedScore] = await Promise.all([
    getUserMarketPulseProgress(userId, selectedCycle.id),
    prisma.marketPulseScore.findUnique({
      where: {
        userId_cycleId: {
          userId,
          cycleId: selectedCycle.id,
        },
      },
      select: {
        participationScore: true,
      },
    }),
  ]);

  const totalScore = progress.totalPoints ?? 0;
  const decisionsSubmitted = progress.decisionsCount;
  const totalCards = progress.totalCards;

  if (totalScore === 0 && decisionsSubmitted === 0) {
    return {
      state: "revealed_no_score",
      cycleName,
      decisionsSubmitted: 0,
      totalCards,
    };
  }

  if (totalScore === 0) {
    return {
      state: "revealed_no_score",
      cycleName,
      decisionsSubmitted,
      totalCards,
    };
  }

  const participationScore =
    storedScore != null
      ? storedScore.participationScore
      : decisionsSubmitted > 0
        ? progress.participationPoints
        : null;

  const breakdown = await getLeaderboardViewerScoreBreakdown(
    userId,
    selectedCycle.id,
    locale,
  );

  return {
    state: "revealed_summary",
    cycleName,
    totalScore,
    participationScore,
    rank: progress.rank,
    decisionsSubmitted,
    totalCards,
    breakdown,
  };
}
