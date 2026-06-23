import type { MarketPulseSignal } from "@prisma/client";

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

/** Pure scoring for one player's decisions in a cycle (sorted by dayIndex). */
export function buildScoreEventsForUser(
  cycleId: string,
  decisions: ScoreCalculationDecision[],
): ScoreCalculationEvent[] {
  const sorted = [...decisions].sort(
    (a, b) => a.card.dayIndex - b.card.dayIndex,
  );

  let consecutiveMatches = 0;
  const events: ScoreCalculationEvent[] = [];

  for (const entry of sorted) {
    const participationPoints = PARTICIPATION_POINTS;
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
