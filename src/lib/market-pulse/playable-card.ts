import type { MarketPulseCard, MarketPulseCycle } from "@prisma/client";

import { compareMarketPulseCardsByPlayOrder } from "@/lib/market-pulse/card-play-order";
import {
  getCycleDayForDate,
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
  getCycleDayForDate as getCurrentCycleDayIndex,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @deprecated Prefer {@link getCycleDayForDate} / {@link getCurrentCycleDayIndex}.
 * Zero-based day offset from cycle start using elapsed milliseconds (not HKT).
 */
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

/** Display day number shown in UI (1 = first HKT calendar day of the cycle). */
export function getCycleDisplayDay(
  cycleStartsAt: Date,
  at: Date,
): number {
  return getCycleDayForDate(cycleStartsAt, at);
}

/** Whether a card's day index maps to the current HKT cycle day. */
export function cardMatchesCycleDisplayDay(
  cardDayIndex: number,
  displayDay: number,
): boolean {
  return scheduleDayIndexForCard(cardDayIndex) === displayDay;
}

/** All cards mapped to the current HKT cycle day. */
export function findCardsForCycleDisplayDay(
  cards: MarketPulseCard[],
  cycleStartsAt: Date,
  at: Date,
): MarketPulseCard[] {
  const displayDay = getCycleDayForDate(cycleStartsAt, at);

  return cards.filter((card) =>
    cardMatchesCycleDisplayDay(card.dayIndex, displayDay),
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
  now: Date,
): boolean {
  if (!cardMatchesCycleDisplayDay(card.dayIndex, displayDay)) {
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
 * All cards playable for the current HKT cycle day, sorted by dayIndex → sortOrder → createdAt.
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
  const todayDayIndex = getCycleDayForDate(cycle.startsAt, now);

  return cycle.cards
    .filter((card) =>
      isCardPlayableForCycleDay(card, cycleContext, todayDayIndex, now),
    )
    .sort(comparePlayableCards);
}

/** Resolves the first playable card for the current HKT cycle day only. */
export function findPlayableCardForToday(
  cycle: { startsAt: Date; revealAt?: Date; cards: MarketPulseCard[] },
  now: Date,
): MarketPulseCard | null {
  const todaysCards = findPlayableCardsForToday(cycle, now);
  return todaysCards[0] ?? null;
}
