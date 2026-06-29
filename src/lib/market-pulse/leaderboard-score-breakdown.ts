import "server-only";

import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import { prisma } from "@/lib/prisma";

/** Client-safe per-card row — no PPA insight text, current user only. */
export type LeaderboardViewerCardBreakdown = {
  cardId: string;
  dayIndex: number;
  ticker: string;
  headline: string;
  userDecision: string;
  ppaSignal: string | null;
  isMatch: boolean;
  participationPoints: number;
  matchBonus: number;
  streakBonus: number;
  totalPoints: number;
};

export async function getLeaderboardViewerScoreBreakdown(
  userId: string,
  cycleId: string,
): Promise<LeaderboardViewerCardBreakdown[]> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, status: true, revealAt: true },
  });

  if (!cycle || !isMarketPulseCycleRevealed(cycle)) {
    return [];
  }

  const [decisions, scoreEvents] = await Promise.all([
    prisma.marketPulseDecision.findMany({
      where: { userId, cycleId },
      include: {
        card: {
          select: {
            id: true,
            dayIndex: true,
            ticker: true,
            headline: true,
            ppaSignal: true,
          },
        },
      },
      orderBy: { card: { dayIndex: "asc" } },
    }),
    prisma.marketPulseScoreEvent.findMany({
      where: { userId, cycleId },
      select: {
        cardId: true,
        participationPoints: true,
        matchBonus: true,
        streakBonus: true,
        totalPoints: true,
      },
    }),
  ]);

  const scoreByCard = new Map(
    scoreEvents.map((event) => [event.cardId ?? "", event]),
  );

  const rows: LeaderboardViewerCardBreakdown[] = [];

  for (const entry of decisions) {
    if (!entry.card.ppaSignal) {
      continue;
    }

    const scores = scoreByCard.get(entry.cardId);
    const ppaSignal = entry.card.ppaSignal;

    rows.push({
      cardId: entry.cardId,
      dayIndex: entry.card.dayIndex,
      ticker: entry.card.ticker,
      headline: entry.card.headline,
      userDecision: entry.decision,
      ppaSignal,
      isMatch: entry.decision === ppaSignal,
      participationPoints: scores?.participationPoints ?? PARTICIPATION_POINTS,
      matchBonus: scores?.matchBonus ?? 0,
      streakBonus: scores?.streakBonus ?? 0,
      totalPoints:
        scores?.totalPoints ??
        PARTICIPATION_POINTS + (scores?.matchBonus ?? 0) + (scores?.streakBonus ?? 0),
    });
  }

  return rows;
}
