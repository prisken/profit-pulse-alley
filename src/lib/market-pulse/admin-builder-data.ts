import "server-only";

import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

import {
  computeAdminCycleParticipationStats,
  buildAdminCycleWinnerMap,
} from "@/lib/market-pulse/admin-cycle-stats";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
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
      orderBy: { dayIndex: "asc" },
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
  const missingSignalCount = cycle.cards.filter((c) => !c.ppaSignal).length;
  const unlockedCount = cycle.cards.filter((c) => !c.ppaSignalLockedAt).length;
  const playabilityIssue = getCyclePlayabilityIssue(cycle, now);
  const participationStats = computeAdminCycleParticipationStats({
    cardCount: cycle._count.cards,
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
    cardCount: cycle._count.cards,
    decisionCount: cycle._count.decisions,
    usersPlayed,
    missingSignalCount,
    unlockedCount,
    averageDecisionsPerParticipant: participationStats.averageDecisionsPerParticipant,
    completionRatePercent: participationStats.completionRatePercent,
    scoreEventCount,
    scoresGenerated: scoreEventCount > 0,
    topWinnerName: winner ? (winnerNameByUserId.get(winner.userId) ?? null) : null,
    topWinnerScore: winner?.score ?? null,
  };

  const cards: MarketPulseAdminCardRow[] = cardRows.map((card) => ({
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    companyName: card.companyName,
    companyNameZh: card.companyNameZh,
    ticker: card.ticker,
    exchange: card.exchange,
    logoUrl: card.logoUrl,
    logoInitials: card.logoInitials,
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    newsBody: card.newsBody,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    sourceDate: card.sourceDate?.toISOString() ?? null,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
    summary: card.summary,
    userPrompt: card.userPrompt,
    status: card.status,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt?.toISOString() ?? null,
    publishedAt: card.publishedAt?.toISOString() ?? null,
    revealAt: card.revealAt?.toISOString() ?? null,
    decisionCount: card._count.decisions,
  }));

  return {
    adminEmail: admin.email,
    runtimeStatus: settings.runtimeStatus,
    cycle: cycleRow,
    cards,
  };
}
