import type { MarketPulseCard, MarketPulseCycle } from "@prisma/client";

import { compareMarketPulseCardsByPlayOrder } from "@/lib/market-pulse/card-play-order";
import {
  getEffectiveCardReleaseAt,
  isCardReleasedForPlay,
  isCardWithinRevealWindow,
  scheduleDayIndexForCard,
  hasDerivedCycleDayReleasePassed,
  hasLegacyPublishedAtGatePassed,
} from "@/lib/market-pulse/card-release-schedule";

export {
  scheduleDayIndexForCard,
  getEffectiveCardReleaseAt as getCardReleaseTime,
  isCardReleasedForPlay,
  hasDerivedCycleDayReleasePassed,
  hasLegacyPublishedAtGatePassed,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Zero-based day offset from cycle start (day 0 = first calendar day). */
export function getCycleDayIndexZeroBased(
  cycleStartsAt: Date,
  at: Date,
): number {
  const elapsed = at.getTime() - cycleStartsAt.getTime();
  if (elapsed < 0) {
    return 0;
  }
  return Math.floor(elapsed / MS_PER_DAY);
}

/** Display day number shown in UI (1 = first calendar day of the cycle). */
export function getCycleDisplayDay(
  cycleStartsAt: Date,
  at: Date,
): number {
  return getCycleDayIndexZeroBased(cycleStartsAt, at) + 1;
}

export function cardMatchesCycleDisplayDay(
  cardDayIndex: number,
  displayDay: number,
  zeroBasedDay: number,
): boolean {
  return cardDayIndex === displayDay || cardDayIndex === zeroBasedDay;
}

/** All cards mapped to the current cycle display day (1-based or legacy 0-based index). */
export function findCardsForCycleDisplayDay(
  cards: MarketPulseCard[],
  cycleStartsAt: Date,
  at: Date,
): MarketPulseCard[] {
  const zeroBasedDay = getCycleDayIndexZeroBased(cycleStartsAt, at);
  const displayDay = zeroBasedDay + 1;

  return cards.filter((card) =>
    cardMatchesCycleDisplayDay(card.dayIndex, displayDay, zeroBasedDay),
  );
}

export function isPublishedAndLive(
  card: MarketPulseCard,
  cycle: Pick<MarketPulseCycle, "startsAt">,
  now: Date,
): boolean {
  return isCardReleasedForPlay(card, cycle, now);
}

export function isCardPlayableForCycleDay(
  card: MarketPulseCard,
  cycle: Pick<MarketPulseCycle, "startsAt" | "revealAt">,
  displayDay: number,
  zeroBasedDay: number,
  now: Date,
): boolean {
  if (!cardMatchesCycleDisplayDay(card.dayIndex, displayDay, zeroBasedDay)) {
    return false;
  }
  if (!isCardReleasedForPlay(card, cycle, now)) {
    return false;
  }
  return isCardWithinRevealWindow(card, cycle, now);
}

export function comparePlayableCards(a: MarketPulseCard, b: MarketPulseCard): number {
  return compareMarketPulseCardsByPlayOrder(a, b);
}

/**
 * All cards playable for the current cycle day, sorted by dayIndex → sortOrder → createdAt.
 * Admin day index is 1-based (1 = first day); legacy/seed rows may use 0-based.
 */
export function findPlayableCardsForToday(
  cycle: {
    startsAt: Date;
    revealAt?: Date;
    cards: MarketPulseCard[];
  },
  now: Date,
): MarketPulseCard[] {
  const cycleRevealAt =
    cycle.revealAt ?? new Date(cycle.startsAt.getTime() + 365 * MS_PER_DAY);
  const cycleContext = { startsAt: cycle.startsAt, revealAt: cycleRevealAt };
  const zeroBasedDay = getCycleDayIndexZeroBased(cycle.startsAt, now);
  const displayDay = zeroBasedDay + 1;

  return cycle.cards
    .filter((card) =>
      isCardPlayableForCycleDay(card, cycleContext, displayDay, zeroBasedDay, now),
    )
    .sort(comparePlayableCards);
}

/**
 * Resolves a single playable card for the current moment (first of today's set).
 * Falls back to the latest published live card when no row matches today's day index
 * (legacy admin/visibility behavior).
 */
export function findPlayableCardForToday(
  cycle: { startsAt: Date; revealAt?: Date; cards: MarketPulseCard[] },
  now: Date,
): MarketPulseCard | null {
  const todaysCards = findPlayableCardsForToday(cycle, now);
  if (todaysCards.length > 0) {
    return todaysCards[0] ?? null;
  }

  const cycleContext = { startsAt: cycle.startsAt };
  const publishedCards = cycle.cards.filter((card) =>
    isCardReleasedForPlay(card, cycleContext, now),
  );

  if (publishedCards.length === 0) {
    return null;
  }

  return publishedCards.reduce<MarketPulseCard | null>((latest, card) => {
    if (!latest) {
      return card;
    }
    if (card.dayIndex > latest.dayIndex) {
      return card;
    }
    if (card.dayIndex === latest.dayIndex) {
      const sortDelta = (card.sortOrder ?? 0) - (latest.sortOrder ?? 0);
      if (sortDelta > 0) {
        return card;
      }
      if (
        sortDelta === 0 &&
        card.publishedAt &&
        latest.publishedAt &&
        card.publishedAt > latest.publishedAt
      ) {
        return card;
      }
    }
    return latest;
  }, null);
}
