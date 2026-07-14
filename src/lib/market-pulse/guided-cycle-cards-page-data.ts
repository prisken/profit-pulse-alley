import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import {
  cardOrdinalWithinDay,
  sortMarketPulseBuilderCards,
} from "@/lib/market-pulse/admin-card-scheduling";
import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import { computeAdminCycleCardBreakdown } from "@/lib/market-pulse/admin-cycle-stats";
import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import {
  getGuidedCardStatus,
  type GuidedCardStatus,
} from "@/lib/market-pulse/guided-card-status";
import { guidedCardTypeLabel } from "@/lib/market-pulse/guided-card-validation";
import { formatHktDateOnlyFromUtcInstant } from "@/lib/market-pulse/hkt-time";
import { prisma } from "@/lib/prisma";

export type GuidedCycleCardChecklistRow = {
  id: string;
  dayIndex: number;
  hktDate: string | null;
  cardNumber: number | null;
  cardTypeLabel: "Signal" | "Market Rest";
  status: GuidedCardStatus;
  headline: string;
  isPublished: boolean;
};

export type GuidedCycleCardsPageData = {
  adminEmail: string;
  cycle: MarketPulseAdminCycleRow;
  startDateHkt: string;
  endDateHkt: string;
  revealDateHkt: string;
  signalCardCount: number;
  restCardCount: number;
  cards: MarketPulseAdminCardRow[];
  checklist: GuidedCycleCardChecklistRow[];
};

function cycleDateHkt(iso: string): string {
  return formatHktDateOnlyFromUtcInstant(new Date(iso));
}

function cardHktDate(
  card: Pick<MarketPulseAdminCardRow, "sourceDate" | "dayIndex">,
  cycleStartsAt: Date,
): string | null {
  if (card.sourceDate) {
    return cycleDateHkt(card.sourceDate);
  }

  try {
    return formatHktDateOnlyFromUtcInstant(
      getCycleDayReleaseAt(cycleStartsAt, card.dayIndex),
    );
  } catch {
    return null;
  }
}

export function buildGuidedCycleCardChecklist(
  cards: MarketPulseAdminCardRow[],
  cycleStartsAt: Date,
): GuidedCycleCardChecklistRow[] {
  const sorted = sortMarketPulseBuilderCards(cards);

  return sorted.map((card) => {
    const cardsOnDay = sorted.filter((row) => row.dayIndex === card.dayIndex);
    const cardNumber = isMarketPulseRestCard(card)
      ? null
      : cardOrdinalWithinDay(card, cardsOnDay);

    return {
      id: card.id,
      dayIndex: card.dayIndex,
      hktDate: cardHktDate(card, cycleStartsAt),
      cardNumber,
      cardTypeLabel: guidedCardTypeLabel(card.cardType),
      status: getGuidedCardStatus(card),
      headline: card.headline,
      isPublished: card.status === "PUBLISHED",
    };
  });
}

export async function getGuidedCycleCardsPageData(
  cycleId: string,
): Promise<GuidedCycleCardsPageData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    include: {
      _count: { select: { cards: true, decisions: true } },
      cards: {
        orderBy: [
          { dayIndex: "asc" },
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
        include: { _count: { select: { decisions: true } } },
      },
      decisions: { select: { userId: true } },
    },
  });

  if (!cycle) {
    return null;
  }

  const cardBreakdown = computeAdminCycleCardBreakdown(cycle.cards);
  const usersPlayed = new Set(cycle.decisions.map((row) => row.userId)).size;
  const cards = cycle.cards.map(mapMarketPulseAdminCardRow);

  const cycleRow: MarketPulseAdminCycleRow = {
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
    revealAt: cycle.revealAt.toISOString(),
    prizeLabel: cycle.prizeLabel,
    isActive: false,
    isPlayableNow: false,
    playabilityIssue: null,
    cardCount: cardBreakdown.totalCards,
    signalCardCount: cardBreakdown.signalCards,
    restCardCount: cardBreakdown.restCards,
    decisionCount: cycle._count.decisions,
    scoreCount: 0,
    prizeClaimCount: 0,
    usersPlayed,
    missingSignalCount: cardBreakdown.missingPpaSignalCards,
    unlockedCount: cardBreakdown.unlockedSignalCards,
    averageDecisionsPerParticipant: 0,
    completionRatePercent: 0,
    scoreEventCount: 0,
    scoresGenerated: false,
    topWinnerName: null,
    topWinnerScore: null,
    guidedProgress: null,
  };

  return {
    adminEmail: admin.email,
    cycle: cycleRow,
    startDateHkt: cycleDateHkt(cycle.startsAt.toISOString()),
    endDateHkt: cycleDateHkt(cycle.endsAt.toISOString()),
    revealDateHkt: cycleDateHkt(cycle.revealAt.toISOString()),
    signalCardCount: cardBreakdown.signalCards,
    restCardCount: cardBreakdown.restCards,
    cards,
    checklist: buildGuidedCycleCardChecklist(cards, cycle.startsAt),
  };
}
