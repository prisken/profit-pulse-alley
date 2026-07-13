import "server-only";

import { auth } from "@/auth";
import {
  EMPTY_REVEAL_PAGE_ACQUISITION,
  resolveRevealPageAcquisition,
} from "@/lib/acquisition/prompts";
import { isDatabaseConfigured } from "@/lib/db-config";
import { isCyclePlayable } from "@/lib/market-pulse/cycle-playability";
import type { SiteLocale } from "@/lib/i18n/locales";
import { DEFAULT_SITE_LOCALE } from "@/lib/i18n/locales";
import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import {
  loadMarketPulseNextCycleStatus,
  type MarketPulseNextCycleStatus,
} from "@/lib/market-pulse/next-cycle";
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
    if (card.isRestCard || !card.played) {
      continue;
    }
    if (card.isMatch === true) {
      current += 1;
      best = Math.max(best, current);
    } else if (card.isMatch === false) {
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
  nextCycle: MarketPulseNextCycleStatus = { status: "tbc" },
): MarketPulseRevealPageData => ({
  status: "pending",
  isAuthenticated,
  pendingCycle,
  revealedCycle: null,
  playNextAvailable,
  nextCycle,
  results: null,
  acquisition: EMPTY_REVEAL_PAGE_ACQUISITION,
});

export async function getMarketPulseRevealPageData(
  locale: SiteLocale = DEFAULT_SITE_LOCALE,
): Promise<MarketPulseRevealPageData> {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);
  const playNextAvailable = await resolvePlayNextAvailable();
  const nextCycle = isDatabaseConfigured()
    ? await loadMarketPulseNextCycleStatus()
    : { status: "tbc" as const };

  if (!isDatabaseConfigured()) {
    return pendingBase(isAuthenticated, playNextAvailable, null, nextCycle);
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
    return pendingBase(isAuthenticated, playNextAvailable, null, nextCycle);
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
      nextCycle,
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
      nextCycle,
      results: null,
      acquisition: EMPTY_REVEAL_PAGE_ACQUISITION,
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
    }, nextCycle);
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
      nextCycle,
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
    }, nextCycle);
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
      ticker: card.ticker,
      summary: card.summary,
      newsBody: card.newsBody,
      cardImageUrl: card.cardImageUrl,
      cardImageAlt: card.cardImageAlt,
      played: card.played,
      viewerDecision: card.viewerDecision,
      decidedAtIso: card.decidedAt?.toISOString() ?? null,
      ppaSignal: card.ppaSignal,
      ppaInsight: card.ppaInsight,
      isRestCard,
      isMatch: card.isMatch,
      participationPoints: card.participationPoints,
      matchBonus: card.matchBonus,
      streakBonus: card.streakBonus,
      totalPoints: card.totalPoints,
    };
  });

  const matchesCount = cards.filter((card) => card.isMatch === true).length;
  const totalPlayed = cards.filter((card) => card.played).length;
  const totalSkipped = cards.filter((card) => !card.played).length;
  const bestStreak = Math.max(
    progress.currentStreak ?? 0,
    computeBestStreakFromCards(cards),
  );

  const totalPoints =
    progress.totalPoints ?? reveal.totals.totalPoints ?? null;

  const acquisition = await resolveRevealPageAcquisition(userId);

  return {
    status: "revealed",
    isAuthenticated: true,
    pendingCycle: null,
    revealedCycle: revealedCycleSummary,
    playNextAvailable,
    nextCycle,
    acquisition,
    results: {
      cycleId: reveal.cycleId,
      cycleName: reveal.cycleName,
      totalPoints: totalPoints ?? 0,
      rank: progress.rank,
      matchesCount,
      totalPlayed,
      totalSkipped,
      totalPublished: cards.length,
      bestStreak,
      totals: reveal.totals,
      cards,
    },
  };
}
