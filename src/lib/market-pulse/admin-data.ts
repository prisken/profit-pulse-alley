import "server-only";

import type {
  MarketPulseCardStatus,
  MarketPulseCycleStatus,
  MarketPulseGameRuntimeStatus,
  MarketPulseSignal,
} from "@prisma/client";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
} from "@/lib/market-pulse/cycle-playability";
import { getMarketPulseSettings } from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type MarketPulseAdminCardRow = {
  id: string;
  cycleId: string;
  dayIndex: number;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  newsBody: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: string | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  summary: string | null;
  userPrompt: string | null;
  status: MarketPulseCardStatus;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaSignalLockedAt: string | null;
  publishedAt: string | null;
  revealAt: string | null;
  decisionCount: number;
};

export type MarketPulseAdminCycleRow = {
  id: string;
  name: string;
  status: MarketPulseCycleStatus;
  startsAt: string;
  endsAt: string;
  revealAt: string;
  prizeLabel: string | null;
  isActive: boolean;
  isPlayableNow: boolean;
  playabilityIssue: string | null;
  cardCount: number;
  decisionCount: number;
  usersPlayed: number;
  missingSignalCount: number;
  unlockedCount: number;
};

export type MarketPulseAdminActivityRow = {
  id: string;
  type: "decision" | "audit";
  label: string;
  createdAt: string;
};

export type MarketPulseAdminDashboardData = {
  adminEmail: string;
  runtimeStatus: MarketPulseGameRuntimeStatus;
  settingsId: string;
  activeCycleId: string | null;
  cycles: MarketPulseAdminCycleRow[];
  cards: MarketPulseAdminCardRow[];
  recentActivity: MarketPulseAdminActivityRow[];
};

export async function getMarketPulseAdminDashboardData(): Promise<MarketPulseAdminDashboardData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const settings = await getMarketPulseSettings();
  const activeCycleId = settings.activeCycleId;

  const cycles = await prisma.marketPulseCycle.findMany({
    orderBy: { startsAt: "desc" },
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

  const now = new Date();

  const cycleRows: MarketPulseAdminCycleRow[] = cycles.map((cycle) => {
    const usersPlayed = new Set(cycle.decisions.map((d) => d.userId)).size;
    const missingSignalCount = cycle.cards.filter((c) => !c.ppaSignal).length;
    const unlockedCount = cycle.cards.filter((c) => !c.ppaSignalLockedAt).length;
    const playabilityIssue = getCyclePlayabilityIssue(cycle, now);

    return {
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
    };
  });

  const cardRows = await prisma.marketPulseCard.findMany({
    orderBy: [{ cycleId: "desc" }, { dayIndex: "asc" }],
    include: { _count: { select: { decisions: true } } },
  });

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

  const [recentDecisions, recentAudits] = await Promise.all([
    prisma.marketPulseDecision.findMany({
      take: 8,
      orderBy: { decidedAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        card: { select: { companyName: true } },
      },
    }),
    prisma.marketPulseAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        fieldName: true,
        createdAt: true,
      },
    }),
  ]);

  const recentActivity: MarketPulseAdminActivityRow[] = [
    ...recentDecisions.map((row) => ({
      id: row.id,
      type: "decision" as const,
      label: `${row.user.name?.trim() || "Member"} chose ${row.decision} on ${row.card.companyName}`,
      createdAt: row.decidedAt.toISOString(),
    })),
    ...recentAudits.map((row) => ({
      id: row.id,
      type: "audit" as const,
      label: `${row.action} ${row.entityType}${row.fieldName ? ` · ${row.fieldName}` : ""}`,
      createdAt: row.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return {
    adminEmail: admin.email,
    runtimeStatus: settings.runtimeStatus,
    settingsId: settings.id,
    activeCycleId,
    cycles: cycleRows,
    cards,
    recentActivity,
  };
}
