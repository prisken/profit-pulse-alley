import "server-only";

import type { MarketPulseCardType } from "@prisma/client";

import {
  buildCardsOnDayCountMap,
  compareMarketPulseCardsByPlayOrder,
} from "@/lib/market-pulse/card-play-order";
import { localizeMarketPulseCardText } from "@/lib/market-pulse/card-localization";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import { PARTICIPATION_POINTS } from "@/lib/market-pulse/constants";
import type { SiteLocale } from "@/lib/i18n/locales";
import { DEFAULT_SITE_LOCALE } from "@/lib/i18n/locales";
import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import { prisma } from "@/lib/prisma";

/** Client-safe per-card row — no PPA insight text, current user only. */
export type LeaderboardViewerCardBreakdown = {
  cardId: string;
  dayIndex: number;
  sortOrder: number;
  cardsOnDay: number;
  cardType: MarketPulseCardType;
  isRestCard: boolean;
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
  locale: SiteLocale = DEFAULT_SITE_LOCALE,
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
            sortOrder: true,
            createdAt: true,
            cardType: true,
            ticker: true,
            companyName: true,
            companyNameZh: true,
            headline: true,
            headlineZhHant: true,
            newsBody: true,
            newsBodyZhHant: true,
            summary: true,
            summaryZhHant: true,
            cardImageAlt: true,
            cardImageAltZhHant: true,
            userPrompt: true,
            userPromptZhHant: true,
            ppaSignal: true,
            ppaInsight: true,
            ppaInsightZhHant: true,
          },
        },
      },
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

  const sortedDecisions = [...decisions].sort((a, b) =>
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
  const cardsOnDayByIndex = buildCardsOnDayCountMap(
    sortedDecisions.map((entry) => entry.card),
  );

  const rows: LeaderboardViewerCardBreakdown[] = [];

  for (const entry of sortedDecisions) {
    const isRestCard = isMarketPulseRestCard(entry.card);
    if (!isRestCard && !entry.card.ppaSignal) {
      continue;
    }

    const scores = scoreByCard.get(entry.cardId);
    const localizedHeadline = localizeMarketPulseCardText(entry.card, locale).headline;
    const sortOrder = entry.card.sortOrder ?? 0;
    const ppaSignal = isRestCard ? null : entry.card.ppaSignal;

    rows.push({
      cardId: entry.cardId,
      dayIndex: entry.card.dayIndex,
      sortOrder,
      cardsOnDay: cardsOnDayByIndex.get(entry.card.dayIndex) ?? 1,
      cardType: entry.card.cardType ?? "SIGNAL",
      isRestCard,
      ticker: entry.card.ticker,
      headline: localizedHeadline,
      userDecision: entry.decision,
      ppaSignal,
      isMatch: !isRestCard && entry.decision === ppaSignal,
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
