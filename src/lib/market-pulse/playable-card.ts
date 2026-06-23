import type { MarketPulseCard } from "@prisma/client";

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

function isPublishedAndLive(card: MarketPulseCard, now: Date): boolean {
  return (
    card.status === "PUBLISHED" &&
    card.publishedAt != null &&
    card.publishedAt <= now
  );
}

/**
 * Resolves which card is playable for the current moment.
 * Admin day index is 1-based (1 = first day); legacy/seed rows may use 0-based.
 */
export function findPlayableCardForToday(
  cycle: { startsAt: Date; cards: MarketPulseCard[] },
  now: Date,
): MarketPulseCard | null {
  const publishedCards = cycle.cards.filter((card) =>
    isPublishedAndLive(card, now),
  );

  if (publishedCards.length === 0) {
    return null;
  }

  const zeroBasedDay = getCycleDayIndexZeroBased(cycle.startsAt, now);
  const displayDay = zeroBasedDay + 1;

  const byDay = publishedCards.find(
    (card) => card.dayIndex === displayDay || card.dayIndex === zeroBasedDay,
  );
  if (byDay) {
    return byDay;
  }

  return publishedCards.reduce<MarketPulseCard | null>((latest, card) => {
    if (!latest) {
      return card;
    }
    if (card.dayIndex > latest.dayIndex) {
      return card;
    }
    if (
      card.dayIndex === latest.dayIndex &&
      card.publishedAt &&
      latest.publishedAt &&
      card.publishedAt > latest.publishedAt
    ) {
      return card;
    }
    return latest;
  }, null);
}
