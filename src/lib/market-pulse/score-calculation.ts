import type { MarketPulseCardType, MarketPulseSignal } from "@prisma/client";

import { compareMarketPulseCardsByPlayOrder } from "@/lib/market-pulse/card-play-order";
import {
  isMarketPulseRestCard,
  isRestCardAcknowledgement,
  type MarketPulseCardTypeSource,
} from "@/lib/market-pulse/card-type";
import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
  STREAK_INTERVAL,
} from "@/lib/market-pulse/constants";

export type ScoreCalculationDecision = {
  userId: string;
  cardId: string;
  decision: MarketPulseSignal;
  card: {
    id: string;
    dayIndex: number;
    sortOrder?: number | null;
    createdAt?: Date | string | null;
    cardType?: MarketPulseCardType | null;
    ppaSignal: MarketPulseSignal | null;
  };
};

export type ScoreCalculationEvent = {
  userId: string;
  cycleId: string;
  cardId: string;
  participationPoints: number;
  matchBonus: number;
  streakBonus: number;
  totalPoints: number;
  reason: string;
};

export function scoreEventReason(cardId: string, dayIndex: number): string {
  return `cycle_score:card:${cardId}:day:${dayIndex}`;
}

/** Rest cards and acknowledgements earn participation only — they do not affect streaks. */
export function isStreakNeutralScoreEntry(
  entry: {
    decision: MarketPulseSignal;
    card: MarketPulseCardTypeSource & {
      cardType?: MarketPulseCardType | null;
    };
  },
): boolean {
  return (
    isMarketPulseRestCard(entry.card) ||
    isRestCardAcknowledgement(entry.decision)
  );
}

export type SignalStreakDecision = {
  decision: MarketPulseSignal;
  card: {
    id?: string;
    dayIndex: number;
    sortOrder?: number | null;
    createdAt?: Date | string | null;
    cardType?: MarketPulseCardType | null;
    ppaSignal: MarketPulseSignal | null;
  };
};

function sortDecisionsByPlayOrder<T extends SignalStreakDecision>(
  decisions: T[],
): T[] {
  return [...decisions].sort((a, b) =>
    compareMarketPulseCardsByPlayOrder(
      {
        dayIndex: a.card.dayIndex,
        sortOrder: a.card.sortOrder,
        createdAt: a.card.createdAt,
        id: a.card.id,
      },
      {
        dayIndex: b.card.dayIndex,
        sortOrder: b.card.sortOrder,
        createdAt: b.card.createdAt,
        id: b.card.id,
      },
    ),
  );
}

/** Consecutive correct SIGNAL-card matches after play order, skipping REST cards. */
export function computeSignalMatchStreak(
  decisions: SignalStreakDecision[],
): number {
  const sorted = sortDecisionsByPlayOrder(decisions);
  let consecutiveMatches = 0;

  for (const entry of sorted) {
    if (isStreakNeutralScoreEntry(entry)) {
      continue;
    }
    if (entry.card.ppaSignal && entry.decision === entry.card.ppaSignal) {
      consecutiveMatches += 1;
    } else {
      consecutiveMatches = 0;
    }
  }

  return consecutiveMatches;
}

/**
 * Builds per-card score events for one player in play order.
 *
 * Streak iteration:
 * - Walk cards in cycle play order.
 * - REST cards with ACKNOWLEDGED decisions: participation only; do not increment
 *   or reset the streak; continue to the next card.
 * - SIGNAL cards: increment streak on PPA match, reset to 0 on mismatch;
 *   award +100 each time the signal streak reaches a multiple of STREAK_INTERVAL.
 */
export function buildScoreEventsForUser(
  cycleId: string,
  decisions: ScoreCalculationDecision[],
): ScoreCalculationEvent[] {
  const sorted = sortDecisionsByPlayOrder(decisions);

  let consecutiveMatches = 0;
  const events: ScoreCalculationEvent[] = [];

  for (const entry of sorted) {
    if (isStreakNeutralScoreEntry(entry)) {
      events.push({
        userId: entry.userId,
        cycleId,
        cardId: entry.cardId,
        participationPoints: PARTICIPATION_POINTS,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: PARTICIPATION_POINTS,
        reason: scoreEventReason(entry.cardId, entry.card.dayIndex),
      });
      continue;
    }

    let matchBonus = 0;
    let streakBonus = 0;

    if (entry.card.ppaSignal && entry.decision === entry.card.ppaSignal) {
      consecutiveMatches += 1;
      matchBonus = MATCH_BONUS_POINTS;
      if (consecutiveMatches % STREAK_INTERVAL === 0) {
        streakBonus = STREAK_BONUS_POINTS;
      }
    } else {
      consecutiveMatches = 0;
    }

    const participationPoints = PARTICIPATION_POINTS;
    const totalPoints = participationPoints + matchBonus + streakBonus;

    events.push({
      userId: entry.userId,
      cycleId,
      cardId: entry.cardId,
      participationPoints,
      matchBonus,
      streakBonus,
      totalPoints,
      reason: scoreEventReason(entry.cardId, entry.card.dayIndex),
    });
  }

  return events;
}
