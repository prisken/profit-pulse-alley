import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isMarketPulseRestCard, isMarketPulseSignalCard } from "@/lib/market-pulse/card-type";

export type AdminCycleParticipationInput = {
  cardCount: number;
  participantCount: number;
  decisionCount: number;
};

export type AdminCycleParticipationStats = {
  averageDecisionsPerParticipant: number;
  completionRatePercent: number | null;
};

export type AdminCycleCardBreakdown = {
  totalCards: number;
  signalCards: number;
  restCards: number;
  missingPpaSignalCards: number;
  unlockedSignalCards: number;
};

export type AdminCycleWinner = {
  userId: string;
  score: number;
};

export function computeAdminCycleCardBreakdown(
  cards: Array<
    Pick<MarketPulseAdminCardRow, "cardType" | "ppaSignal"> & {
      ppaSignalLockedAt?: string | Date | null;
    }
  >,
): AdminCycleCardBreakdown {
  let signalCards = 0;
  let restCards = 0;
  let missingPpaSignalCards = 0;
  let unlockedSignalCards = 0;

  for (const card of cards) {
    if (isMarketPulseRestCard(card)) {
      restCards += 1;
      continue;
    }

    if (isMarketPulseSignalCard(card)) {
      signalCards += 1;
      if (!card.ppaSignal) {
        missingPpaSignalCards += 1;
      }
      if (!card.ppaSignalLockedAt) {
        unlockedSignalCards += 1;
      }
    }
  }

  return {
    totalCards: cards.length,
    signalCards,
    restCards,
    missingPpaSignalCards,
    unlockedSignalCards,
  };
}

export function computeAdminCycleParticipationStats(
  input: AdminCycleParticipationInput,
): AdminCycleParticipationStats {
  const { cardCount, participantCount, decisionCount } = input;

  if (participantCount <= 0) {
    return {
      averageDecisionsPerParticipant: 0,
      completionRatePercent: null,
    };
  }

  const averageDecisionsPerParticipant = decisionCount / participantCount;
  const completionRatePercent =
    cardCount > 0
      ? Math.round((averageDecisionsPerParticipant / cardCount) * 1000) / 10
      : null;

  return {
    averageDecisionsPerParticipant,
    completionRatePercent,
  };
}

export function buildAdminCycleWinnerMap(
  rows: Array<{
    cycleId: string;
    userId: string;
    totalPoints: number;
  }>,
): Map<string, AdminCycleWinner> {
  const winners = new Map<string, AdminCycleWinner>();

  for (const row of rows) {
    const existing = winners.get(row.cycleId);
    if (!existing || row.totalPoints > existing.score) {
      winners.set(row.cycleId, {
        userId: row.userId,
        score: row.totalPoints,
      });
    }
  }

  return winners;
}

export function formatAdminAverageDecisions(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export function formatAdminCompletionRate(value: number | null): string {
  if (value == null) {
    return "—";
  }
  return `${value}%`;
}
