import "server-only";

import { auth } from "@/auth";
import {
  getMarketPulseRevealForUser,
  getRevealedMarketPulseCycleForPage,
  getUserMarketPulseProgress,
} from "@/lib/market-pulse/server";
import type {
  MarketPulseRevealCardRow,
  MarketPulseRevealPageData,
} from "@/lib/market-pulse/types";

function computeBestStreakFromCards(cards: MarketPulseRevealCardRow[]): number {
  let best = 0;
  let current = 0;
  for (const card of cards) {
    if (card.isMatch) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export async function getMarketPulseRevealPageData(): Promise<MarketPulseRevealPageData> {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);

  let revealedCycle: Awaited<
    ReturnType<typeof getRevealedMarketPulseCycleForPage>
  >["revealedCycle"] = null;
  let pendingActiveCycle: Awaited<
    ReturnType<typeof getRevealedMarketPulseCycleForPage>
  >["pendingActiveCycle"] = null;

  try {
    ({ revealedCycle, pendingActiveCycle } =
      await getRevealedMarketPulseCycleForPage());
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to load reveal cycle:",
      error,
    );
    return {
      status: "pending",
      isAuthenticated,
      pendingCycle: null,
      results: null,
    };
  }

  if (!revealedCycle) {
    return {
      status: "pending",
      isAuthenticated,
      pendingCycle: pendingActiveCycle
        ? {
            name: pendingActiveCycle.name,
            revealAtIso: pendingActiveCycle.revealAt.toISOString(),
          }
        : null,
      results: null,
    };
  }

  if (!isAuthenticated || !userId) {
    return {
      status: "revealed",
      isAuthenticated: false,
      pendingCycle: null,
      results: null,
    };
  }

  let reveal = null;
  try {
    reveal = await getMarketPulseRevealForUser(userId, revealedCycle.id);
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to load user reveal:",
      error,
    );
    return {
      status: "pending",
      isAuthenticated,
      pendingCycle: {
        name: revealedCycle.name,
        revealAtIso: revealedCycle.revealAt.toISOString(),
      },
      results: null,
    };
  }

  if (!reveal?.isRevealed) {
    return {
      status: "pending",
      isAuthenticated,
      pendingCycle: pendingActiveCycle
        ? {
            name: pendingActiveCycle.name,
            revealAtIso: pendingActiveCycle.revealAt.toISOString(),
          }
        : {
            name: revealedCycle.name,
            revealAtIso: revealedCycle.revealAt.toISOString(),
          },
      results: null,
    };
  }

  let progress;
  try {
    progress = await getUserMarketPulseProgress(userId, revealedCycle.id);
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to load user progress:",
      error,
    );
    return {
      status: "pending",
      isAuthenticated,
      pendingCycle: {
        name: revealedCycle.name,
        revealAtIso: revealedCycle.revealAt.toISOString(),
      },
      results: null,
    };
  }

  const cards: MarketPulseRevealCardRow[] = reveal.cards.map((card) => ({
    cardId: card.cardId,
    dayIndex: card.dayIndex,
    companyName: card.companyName,
    headline: card.headline,
    userDecision: card.userDecision,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    isMatch: card.userDecision === card.ppaSignal,
    participationPoints: card.participationPoints,
    matchBonus: card.matchBonus,
    streakBonus: card.streakBonus,
    totalPoints: card.totalPoints,
  }));

  const matchesCount = cards.filter((card) => card.isMatch).length;
  const bestStreak = Math.max(
    progress.currentStreak ?? 0,
    computeBestStreakFromCards(cards),
  );

  return {
    status: "revealed",
    isAuthenticated: true,
    pendingCycle: null,
    results: {
      cycleId: reveal.cycleId,
      cycleName: reveal.cycleName,
      totalPoints: reveal.totals.totalPoints,
      rank: progress.rank,
      matchesCount,
      totalPlayed: cards.length,
      bestStreak,
      totals: reveal.totals,
      cards,
    },
  };
}
