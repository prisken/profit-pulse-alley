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

/** Canonical player availability instant (derived 9 AM HKT schedule + optional publishedAt deferral). */
export function getCardAvailableAt(
  card: Pick<MarketPulseCard, "publishedAt" | "dayIndex">,
  cycleStartsAt: Date | string,
): Date {
  return getEffectiveCardReleaseAt(card, cycleStartsAt);
}

/**
 * When the next scheduled card day begins (earliest future-day release), or null if none.
 * Used to close the active window for the current card batch.
 */
export function getCardActiveWindowEnd(
  card: Pick<MarketPulseCard, "dayIndex" | "status" | "publishedAt">,
  cycleStartsAt: Date | string,
  allCards: Pick<MarketPulseCard, "dayIndex" | "status" | "publishedAt">[],
): Date | null {
  const cardScheduleDay = scheduleDayIndexForCard(card.dayIndex);
  let nextReleaseMs: number | null = null;

  for (const other of allCards) {
    if (other.status !== "PUBLISHED") {
      continue;
    }
    const otherScheduleDay = scheduleDayIndexForCard(other.dayIndex);
    if (otherScheduleDay <= cardScheduleDay) {
      continue;
    }
    const releaseMs = getEffectiveCardReleaseAt(other, cycleStartsAt).getTime();
    if (nextReleaseMs === null || releaseMs < nextReleaseMs) {
      nextReleaseMs = releaseMs;
    }
  }

  return nextReleaseMs === null ? null : new Date(nextReleaseMs);
}

/**
 * Whether `card` is inside its active play window: released, before the next card
 * day's release, and before reveal cutoff.
 */
export function isCardWithinActivePlayWindow(
  card: MarketPulseCard,
  cycle: Pick<MarketPulseCycle, "startsAt" | "revealAt">,
  allCards: MarketPulseCard[],
  now: Date,
): boolean {
  if (!isCardReleasedForPlay(card, cycle, now)) {
    return false;
  }

  const windowEnd = getCardActiveWindowEnd(card, cycle.startsAt, allCards);
  if (windowEnd !== null && now.getTime() >= windowEnd.getTime()) {
    return false;
  }

  return isCardWithinRevealWindow(card, cycle, now);
}

/**
 * Highest schedule day (1-based) with at least one card currently released for play.
 * Cards remain active overnight until the next day's 9:00 AM HKT release.
 */
export function findActiveScheduleDayIndex(
  cards: MarketPulseCard[],
  cycle: Pick<MarketPulseCycle, "startsAt" | "revealAt">,
  now: Date,
): number | null {
  const cycleRevealAt =
    cycle.revealAt ?? new Date(cycle.startsAt.getTime() + 365 * MS_PER_DAY);
  const cycleContext = { startsAt: cycle.startsAt, revealAt: cycleRevealAt };

  let activeDay: number | null = null;

  for (const card of cards) {
    if (!isCardReleasedForPlay(card, cycle, now)) {
      continue;
    }
    if (!isCardWithinRevealWindow(card, cycleContext, now)) {
      continue;
    }
    const scheduleDay = scheduleDayIndexForCard(card.dayIndex);
    if (activeDay === null || scheduleDay > activeDay) {
      activeDay = scheduleDay;
    }
  }

  return activeDay;
}

export function comparePlayableCards(a: MarketPulseCard, b: MarketPulseCard): number {
  return compareMarketPulseCardsByPlayOrder(a, b);
}

/**
 * All cards in the active schedule-day batch, sorted by dayIndex → sortOrder → createdAt.
 *
 * Active batch = highest schedule day with a released card at `now`. A card stays playable
 * from its `availableAt` until the next planned card day's release (typically 09:00 HKT),
 * including overnight gaps before the next morning release.
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
  const activeScheduleDay = findActiveScheduleDayIndex(cycle.cards, cycleContext, now);

  if (activeScheduleDay === null) {
    return [];
  }

  return cycle.cards
    .filter((card) =>
      isCardPlayableForCycleDay(card, cycleContext, activeScheduleDay, now),
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

/** Earliest future release instant among published cards in a cycle, or null. */
export function findEarliestFuturePublishedCardReleaseAt(
  cards: Pick<MarketPulseCard, "status" | "dayIndex" | "publishedAt">[],
  cycle: Pick<MarketPulseCycle, "startsAt" | "revealAt">,
  now: Date,
): Date | null {
  let earliest: Date | null = null;

  for (const card of cards) {
    if (card.status !== "PUBLISHED") {
      continue;
    }

    const releaseAt = getEffectiveCardReleaseAt(card, cycle.startsAt);
    if (releaseAt.getTime() <= now.getTime()) {
      continue;
    }

    if (releaseAt.getTime() > cycle.revealAt.getTime()) {
      continue;
    }

    if (!earliest || releaseAt.getTime() < earliest.getTime()) {
      earliest = releaseAt;
    }
  }

  return earliest;
}
