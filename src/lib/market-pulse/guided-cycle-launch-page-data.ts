import "server-only";

import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

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
import {
  evaluateGuidedLaunchEligibility,
  evaluateGuidedLaunchReadiness,
  isGuidedLaunchAlreadyComplete,
  type GuidedLaunchEligibilityResult,
  type GuidedLaunchReadinessResult,
} from "@/lib/market-pulse/guided-launch-readiness";
import {
  getGuidedLaunchPreview,
  type GuidedLaunchPreview,
} from "@/lib/market-pulse/guided-launch-preview";
import { formatHktDateOnlyFromUtcInstant } from "@/lib/market-pulse/hkt-time";
import { getMarketPulseSettings } from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type GuidedLaunchCardRow = {
  id: string;
  dayIndex: number;
  hktDate: string | null;
  cardNumber: number | null;
  cardTypeLabel: "Signal" | "Market Rest";
  headline: string;
  status: GuidedCardStatus;
};

export type GuidedCycleLaunchPageData = {
  adminEmail: string;
  cycle: MarketPulseAdminCycleRow;
  startDateHkt: string;
  endDateHkt: string;
  revealDateHkt: string;
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycleId: string | null;
  isActiveCycle: boolean;
  eligibility: GuidedLaunchEligibilityResult;
  readiness: GuidedLaunchReadinessResult;
  preview: GuidedLaunchPreview;
  alreadyLaunched: boolean;
  cards: GuidedLaunchCardRow[];
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

export function buildGuidedLaunchCardRows(
  cards: MarketPulseAdminCardRow[],
  cycleStartsAt: Date,
): GuidedLaunchCardRow[] {
  const sorted = sortMarketPulseBuilderCards(cards);

  return sorted.map((card) => {
    const cardsOnDay = sorted.filter((row) => row.dayIndex === card.dayIndex);

    return {
      id: card.id,
      dayIndex: card.dayIndex,
      hktDate: cardHktDate(card, cycleStartsAt),
      cardNumber: isMarketPulseRestCard(card)
        ? null
        : cardOrdinalWithinDay(card, cardsOnDay),
      cardTypeLabel: guidedCardTypeLabel(card.cardType),
      headline: card.headline,
      status: getGuidedCardStatus(card),
    };
  });
}

export async function getGuidedCycleLaunchPageData(
  cycleId: string,
): Promise<GuidedCycleLaunchPageData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const [cycle, settings] = await Promise.all([
    prisma.marketPulseCycle.findUnique({
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
    }),
    getMarketPulseSettings(),
  ]);

  if (!cycle) {
    return null;
  }

  const cardBreakdown = computeAdminCycleCardBreakdown(cycle.cards);
  const usersPlayed = new Set(cycle.decisions.map((row) => row.userId)).size;
  const cards = cycle.cards.map(mapMarketPulseAdminCardRow);
  const eligibility = evaluateGuidedLaunchEligibility({ status: cycle.status });
  const readiness = evaluateGuidedLaunchReadiness(cards);
  const preview = getGuidedLaunchPreview({
    cycle: { id: cycle.id, status: cycle.status },
    cards,
  });
  const alreadyLaunched = isGuidedLaunchAlreadyComplete({
    cycleStatus: cycle.status,
    activeCycleId: settings.activeCycleId,
    runtimeStatus: settings.runtimeStatus,
    cycleId: cycle.id,
    cards,
  });

  const cycleRow: MarketPulseAdminCycleRow = {
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
    revealAt: cycle.revealAt.toISOString(),
    prizeLabel: cycle.prizeLabel,
    isActive: settings.activeCycleId === cycle.id,
    isPlayableNow: false,
    playabilityIssue: null,
    cardCount: cardBreakdown.totalCards,
    signalCardCount: cardBreakdown.signalCards,
    restCardCount: cardBreakdown.restCards,
    decisionCount: cycle._count.decisions,
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
    runtimeStatus: settings.runtimeStatus,
    activeCycleId: settings.activeCycleId,
    isActiveCycle: settings.activeCycleId === cycle.id,
    eligibility,
    readiness,
    preview,
    alreadyLaunched,
    cards: buildGuidedLaunchCardRows(cards, cycle.startsAt),
  };
}
