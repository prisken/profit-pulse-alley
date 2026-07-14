import "server-only";

import type {
  MarketPulseCycleStatus,
  MarketPulseGameRuntimeStatus,
} from "@prisma/client";

import { isDatabaseConfigured } from "@/lib/db-config";
import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
} from "@/lib/market-pulse/cycle-playability";
import { evaluateFirstPublicCycleSetup } from "@/lib/market-pulse/first-cycle-admin-guidance";
import { evaluateActiveCycleOperationalWarnings } from "@/lib/market-pulse/admin-operational-warnings";
import { computeAdminCycleCardBreakdown } from "@/lib/market-pulse/admin-cycle-stats";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import type { MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_LOCALIZATION_DEFAULTS } from "@/lib/market-pulse/admin-card-row";
import { getMarketPulseSettings } from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type AdminOverviewActiveCycle = {
  id: string;
  name: string;
  status: MarketPulseCycleStatus;
  isPlayableNow: boolean;
  playabilityIssue: string | null;
  unlockedCount: number;
  missingSignalCount: number;
  signalCardCount: number;
  restCardCount: number;
  cardCount: number;
};

export type AdminOverviewMarketPulse = {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: AdminOverviewActiveCycle | null;
  playerVisible: boolean;
  playerVisibilityReason: string | null;
};

export type AdminOverviewData = {
  users: {
    total: number;
    adminCount: number;
  };
  marketPulse: AdminOverviewMarketPulse | null;
  systemNotes: string[];
};

function cycleRowForGuidance(
  cycle: {
    id: string;
    name: string;
    status: MarketPulseCycleStatus;
    startsAt: Date;
    endsAt: Date;
    revealAt: Date;
    prizeLabel: string | null;
  },
  activeCycle: AdminOverviewActiveCycle,
): MarketPulseAdminCycleRow {
  return {
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
    revealAt: cycle.revealAt.toISOString(),
    prizeLabel: cycle.prizeLabel,
    isActive: true,
    isPlayableNow: activeCycle.isPlayableNow,
    playabilityIssue: activeCycle.playabilityIssue,
    cardCount: activeCycle.cardCount,
    signalCardCount: activeCycle.signalCardCount,
    restCardCount: activeCycle.restCardCount,
    decisionCount: 0,
    scoreCount: 0,
    prizeClaimCount: 0,
    usersPlayed: 0,
    missingSignalCount: activeCycle.missingSignalCount,
    unlockedCount: activeCycle.unlockedCount,
    averageDecisionsPerParticipant: 0,
    completionRatePercent: null,
    scoreEventCount: 0,
    scoresGenerated: false,
    topWinnerName: null,
    topWinnerScore: null,
    guidedProgress: null,
  };
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const [total, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const systemNotes: string[] = [];

  if (!isDatabaseConfigured()) {
    systemNotes.push("Database connection is not configured.");
    return { users: { total, adminCount }, marketPulse: null, systemNotes };
  }

  try {
    const settings = await getMarketPulseSettings();
    const activeCycleId = settings.activeCycleId;

    let activeCycle: AdminOverviewActiveCycle | null = null;

    if (activeCycleId) {
      const cycle = await prisma.marketPulseCycle.findUnique({
        where: { id: activeCycleId },
        include: {
          _count: { select: { cards: true } },
          cards: {
            select: {
              cardType: true,
              ppaSignal: true,
              ppaSignalLockedAt: true,
              status: true,
            },
          },
        },
      });

      if (cycle) {
        const now = new Date();
        const playabilityIssue = getCyclePlayabilityIssue(cycle, now);
        const cardBreakdown = computeAdminCycleCardBreakdown(cycle.cards);

        activeCycle = {
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          isPlayableNow: playabilityIssue === null,
          playabilityIssue: playabilityIssue
            ? describeCyclePlayabilityIssue(playabilityIssue)
            : null,
          unlockedCount: cardBreakdown.unlockedSignalCards,
          missingSignalCount: cardBreakdown.missingPpaSignalCards,
          signalCardCount: cardBreakdown.signalCards,
          restCardCount: cardBreakdown.restCards,
          cardCount: cardBreakdown.totalCards,
        };

        const guidanceCards = cycle.cards.map((card, index) => ({
          id: `overview-${index}`,
          cycleId: cycle.id,
          dayIndex: index + 1,
          cardType: card.cardType,
          companyName: "",
          companyNameZh: null,
          ticker: "",
          exchange: null,
          logoUrl: null,
          logoInitials: null,
          priceLabel: null,
          priceDirection: null,
          headline: "",
          newsBody: null,
          sourceName: null,
          sourceUrl: null,
          sourceDate: null,
          cardImageUrl: null,
          cardImageAlt: null,
          summary: null,
          userPrompt: null,
          status: card.status,
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: card.ppaSignalLockedAt?.toISOString() ?? null,
          publishedAt: null,
          revealAt: null,
          decisionCount: 0,
          createdAt: cycle.startsAt.toISOString(),
          ...MARKET_PULSE_ADMIN_CARD_ROW_LOCALIZATION_DEFAULTS,
        }));

        const guidanceInput = {
          runtimeStatus: settings.runtimeStatus,
          activeCycle: cycleRowForGuidance(cycle, activeCycle),
          cards: guidanceCards,
        };

        const evaluation = isBeforePublicLaunch(now)
          ? evaluateFirstPublicCycleSetup(guidanceInput)
          : evaluateActiveCycleOperationalWarnings(guidanceInput);
        systemNotes.push(...evaluation.warnings);
      }
    } else {
      systemNotes.push("No active Market Pulse cycle is set.");
    }

    const runtimeOpen = settings.runtimeStatus === "OPEN";
    let playerVisibilityReason: string | null = null;

    if (!runtimeOpen) {
      playerVisibilityReason = `Runtime is ${settings.runtimeStatus}.`;
    } else if (!activeCycle) {
      playerVisibilityReason = "No active cycle.";
    } else if (!activeCycle.isPlayableNow) {
      playerVisibilityReason = activeCycle.playabilityIssue;
    }

    const marketPulse: AdminOverviewMarketPulse = {
      runtimeStatus: settings.runtimeStatus,
      activeCycle,
      playerVisible: runtimeOpen && (activeCycle?.isPlayableNow ?? false),
      playerVisibilityReason,
    };

    return { users: { total, adminCount }, marketPulse, systemNotes };
  } catch (error) {
    console.error("[admin] Failed to load overview:", error);
    systemNotes.push("Could not load Market Pulse overview.");
    return { users: { total, adminCount }, marketPulse: null, systemNotes };
  }
}
