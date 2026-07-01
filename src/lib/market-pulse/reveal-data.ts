import "server-only";

import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db-config";
import { isCyclePlayable } from "@/lib/market-pulse/cycle-playability";
import type { SiteLocale } from "@/lib/i18n/locales";
import { DEFAULT_SITE_LOCALE } from "@/lib/i18n/locales";
import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import {
  getActiveMarketPulseCycle,
  getMarketPulseRevealForUser,
  getMarketPulseSettings,
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
    if (card.isRestCard) {
      continue;
    }
    if (card.isMatch) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

async function resolvePlayNextAvailable(): Promise<boolean> {
  try {
    const [settings, active] = await Promise.all([
      getMarketPulseSettings(),
      getActiveMarketPulseCycle(),
    ]);

    if (settings.runtimeStatus !== "OPEN" || !active) {
      return false;
    }

    const now = new Date();
    return (
      isCyclePlayable(active, now) && !isMarketPulseCycleRevealed(active, now)
    );
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to resolve play-next availability:",
      error,
    );
    return false;
  }
}

function toRevealedCycleSummary(
  cycle: { id: string; name: string } | null,
): MarketPulseRevealPageData["revealedCycle"] {
  return cycle ? { id: cycle.id, name: cycle.name } : null;
}

const pendingBase = (
  isAuthenticated: boolean,
  playNextAvailable: boolean,
  pendingCycle: MarketPulseRevealPageData["pendingCycle"],
): MarketPulseRevealPageData => ({
  status: "pending",
  isAuthenticated,
  pendingCycle,
  revealedCycle: null,
  playNextAvailable,
  results: null,
});

export async function getMarketPulseRevealPageData(
  locale: SiteLocale = DEFAULT_SITE_LOCALE,
): Promise<MarketPulseRevealPageData> {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);
  const playNextAvailable = await resolvePlayNextAvailable();

  if (!isDatabaseConfigured()) {
    return pendingBase(isAuthenticated, playNextAvailable, null);
  }

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
    return pendingBase(isAuthenticated, playNextAvailable, null);
  }

  if (!revealedCycle) {
    return pendingBase(
      isAuthenticated,
      playNextAvailable,
      pendingActiveCycle
        ? {
            name: pendingActiveCycle.name,
            revealAtIso: pendingActiveCycle.revealAt.toISOString(),
          }
        : null,
    );
  }

  const revealedCycleSummary = toRevealedCycleSummary(revealedCycle);

  if (!isAuthenticated || !userId) {
    return {
      status: "revealed",
      isAuthenticated: false,
      pendingCycle: null,
      revealedCycle: revealedCycleSummary,
      playNextAvailable,
      results: null,
    };
  }

  let reveal = null;
  try {
    reveal = await getMarketPulseRevealForUser(userId, revealedCycle.id, locale);
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to load user reveal:",
      error,
    );
    return pendingBase(isAuthenticated, playNextAvailable, {
      name: revealedCycle.name,
      revealAtIso: revealedCycle.revealAt.toISOString(),
    });
  }

  if (!reveal?.isRevealed) {
    return pendingBase(
      isAuthenticated,
      playNextAvailable,
      pendingActiveCycle
        ? {
            name: pendingActiveCycle.name,
            revealAtIso: pendingActiveCycle.revealAt.toISOString(),
          }
        : {
            name: revealedCycle.name,
            revealAtIso: revealedCycle.revealAt.toISOString(),
          },
    );
  }

  let progress;
  try {
    progress = await getUserMarketPulseProgress(userId, revealedCycle.id);
  } catch (error) {
    console.error(
      "[market-pulse/reveal-data] Failed to load user progress:",
      error,
    );
    return pendingBase(isAuthenticated, playNextAvailable, {
      name: revealedCycle.name,
      revealAtIso: revealedCycle.revealAt.toISOString(),
    });
  }

  const cards: MarketPulseRevealCardRow[] = reveal.cards.map((card) => {
    const isRestCard = card.cardType === "REST";
    return {
      cardId: card.cardId,
      dayIndex: card.dayIndex,
      sortOrder: card.sortOrder,
      cardsOnDay: card.cardsOnDay,
      cardType: card.cardType,
      companyName: card.companyName,
      headline: card.headline,
      userDecision: card.userDecision,
      ppaSignal: card.ppaSignal,
      ppaInsight: card.ppaInsight,
      isRestCard,
      isMatch: !isRestCard && card.userDecision === card.ppaSignal,
      participationPoints: card.participationPoints,
      matchBonus: card.matchBonus,
      streakBonus: card.streakBonus,
      totalPoints: card.totalPoints,
    };
  });

  const matchesCount = cards.filter((card) => card.isMatch).length;
  const bestStreak = Math.max(
    progress.currentStreak ?? 0,
    computeBestStreakFromCards(cards),
  );

  return {
    status: "revealed",
    isAuthenticated: true,
    pendingCycle: null,
    revealedCycle: revealedCycleSummary,
    playNextAvailable,
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
