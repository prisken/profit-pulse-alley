import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import type {
  ScoreCalculationDecision,
  ScoreCalculationEvent,
} from "@/lib/market-pulse/score-calculation";

export type CycleUserScoreRow = {
  userId: string;
  cycleId: string;
  participationScore: number;
  decisionsSubmitted: number;
  totalCards: number;
};

export type StoredCycleParticipation = {
  participationScore: number;
  decisionsSubmitted: number;
  totalCards: number;
} | null;

/** Build per-user cycle aggregates from scored events (used at reveal). */
export function buildCycleUserScoreRows(
  cycleId: string,
  userDecisions: Map<string, ScoreCalculationDecision[]>,
  events: ScoreCalculationEvent[],
  totalCards: number,
): CycleUserScoreRow[] {
  const eventsByUser = new Map<string, ScoreCalculationEvent[]>();
  for (const event of events) {
    const list = eventsByUser.get(event.userId) ?? [];
    list.push(event);
    eventsByUser.set(event.userId, list);
  }

  const userIds = new Set([
    ...userDecisions.keys(),
    ...eventsByUser.keys(),
  ]);

  return Array.from(userIds).map((userId) => {
    const userEvents = eventsByUser.get(userId) ?? [];
    const decisions = userDecisions.get(userId) ?? [];
    const participationScore = userEvents.reduce(
      (sum, event) => sum + event.participationPoints,
      0,
    );

    return {
      userId,
      cycleId,
      participationScore,
      decisionsSubmitted: decisions.length,
      totalCards,
    };
  });
}

export function resolveParticipationScore(
  stored: StoredCycleParticipation,
  decisionsSubmitted: number,
): number {
  if (stored) {
    return stored.participationScore;
  }
  return decisionsSubmitted * PARTICIPATION_POINTS;
}

export function resolveDecisionsSubmitted(
  stored: StoredCycleParticipation,
  liveDecisionCount: number,
): number {
  if (stored) {
    return stored.decisionsSubmitted;
  }
  return liveDecisionCount;
}

export function resolveTotalCards(
  stored: StoredCycleParticipation,
  fallbackTotalCards: number,
): number {
  if (stored && stored.totalCards > 0) {
    return stored.totalCards;
  }
  return fallbackTotalCards;
}
