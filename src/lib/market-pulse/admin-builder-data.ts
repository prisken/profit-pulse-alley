import "server-only";

import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

import {
  buildAdminCycleWinnerMap,
  computeAdminCycleCardBreakdown,
  computeAdminCycleParticipationStats,
} from "@/lib/market-pulse/admin-cycle-stats";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
} from "@/lib/market-pulse/cycle-playability";
import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import { getMarketPulseSettings } from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type MarketPulseCycleBuilderData = {
  adminEmail: string;
  runtimeStatus: MarketPulseGameRuntimeStatus;
  cycle: MarketPulseAdminCycleRow;
  cards: MarketPulseAdminCardRow[];
};

export async function getMarketPulseCycleBuilderData(
  cycleId: string,
): Promise<MarketPulseCycleBuilderData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const settings = await getMarketPulseSettings();
  const activeCycleId = settings.activeCycleId;
  const now = new Date();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    include: {
      _count: { select: { cards: true, decisions: true } },
      cards: {
        select: {
          id: true,
          cardType: true,
          ppaSignal: true,
          ppaSignalLockedAt: true,
        },
      },
      decisions: { select: { userId: true } },
    },
  });

  if (!cycle) {
    return null;
  }

  const [scoreEventCount, userCycleTotals, cardRows] = await Promise.all([
    prisma.marketPulseScoreEvent.count({ where: { cycleId } }),
    prisma.marketPulseScoreEvent.groupBy({
      by: ["cycleId", "userId"],
      where: { cycleId },
      _sum: { totalPoints: true },
    }),
    prisma.marketPulseCard.findMany({
      where: { cycleId },
      orderBy: [
        { dayIndex: "asc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: { _count: { select: { decisions: true } } },
    }),
  ]);

  const winnerByCycle = buildAdminCycleWinnerMap(
    userCycleTotals.map((row) => ({
      cycleId: row.cycleId,
      userId: row.userId,
      totalPoints: row._sum.totalPoints ?? 0,
    })),
  );
  const winner = isMarketPulseCycleRevealed(cycle, now)
    ? winnerByCycle.get(cycle.id)
    : undefined;
  const winnerUsers =
    winner != null
      ? await prisma.user.findMany({
          where: { id: winner.userId },
          select: { id: true, name: true, email: true },
        })
      : [];
  const winnerNameByUserId = new Map(
    winnerUsers.map((user) => [user.id, user.name?.trim() || user.email]),
  );

  const usersPlayed = new Set(cycle.decisions.map((d) => d.userId)).size;
  const cardBreakdown = computeAdminCycleCardBreakdown(cycle.cards);
  const playabilityIssue = getCyclePlayabilityIssue(cycle, now);
  const participationStats = computeAdminCycleParticipationStats({
    cardCount: cardBreakdown.totalCards,
    participantCount: usersPlayed,
    decisionCount: cycle._count.decisions,
  });

  const cycleRow: MarketPulseAdminCycleRow = {
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
    revealAt: cycle.revealAt.toISOString(),
    prizeLabel: cycle.prizeLabel,
    isActive: cycle.id === activeCycleId,
    isPlayableNow: playabilityIssue === null,
    playabilityIssue: playabilityIssue
      ? describeCyclePlayabilityIssue(playabilityIssue)
      : null,
    cardCount: cardBreakdown.totalCards,
    signalCardCount: cardBreakdown.signalCards,
    restCardCount: cardBreakdown.restCards,
    decisionCount: cycle._count.decisions,
    scoreCount: 0,
    prizeClaimCount: 0,
    usersPlayed,
    missingSignalCount: cardBreakdown.missingPpaSignalCards,
    unlockedCount: cardBreakdown.unlockedSignalCards,
    averageDecisionsPerParticipant: participationStats.averageDecisionsPerParticipant,
    completionRatePercent: participationStats.completionRatePercent,
    scoreEventCount,
    scoresGenerated: scoreEventCount > 0,
    topWinnerName: winner ? (winnerNameByUserId.get(winner.userId) ?? null) : null,
    topWinnerScore: winner?.score ?? null,
    guidedProgress: null,
  };

  const cards: MarketPulseAdminCardRow[] = cardRows.map(mapMarketPulseAdminCardRow);

  return {
    adminEmail: admin.email,
    runtimeStatus: settings.runtimeStatus,
    cycle: cycleRow,
    cards,
  };
}
