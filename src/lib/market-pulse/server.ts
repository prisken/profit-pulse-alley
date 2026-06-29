import "server-only";

import type {
  MarketPulseCard,
  MarketPulseCycle,
  MarketPulseCycleStatus,
  MarketPulseGameSetting,
  MarketPulseLeaderboardType,
  MarketPulseSignal,
} from "@prisma/client";

import {
  PARTICIPATION_POINTS,
  isValidMarketPulseDecision,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import {
  buildCycleUserScoreRows,
  resolveDecisionsSubmitted,
  resolveParticipationScore,
  resolveTotalCards,
  type StoredCycleParticipation,
} from "@/lib/market-pulse/cycle-user-score";
import {
  buildScoreEventsForUser,
  type ScoreCalculationDecision,
} from "@/lib/market-pulse/score-calculation";
import { findPlayableCardForToday } from "@/lib/market-pulse/playable-card";
import { isCyclePlayable } from "@/lib/market-pulse/cycle-playability";
import {
  getMarketPulseCardPublicPayload,
  isMarketPulseCardRevealed,
  isMarketPulseCycleRevealed,
  type MarketPulseCardPublicPayload,
} from "@/lib/market-pulse/reveal-access";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";
import {
  MARKET_PULSE_PUBLIC_LAUNCH_SUBMIT_ERROR,
  canSubmitMarketPulseDecision,
} from "@/lib/market-pulse/launch-config";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const cycleWithCardsInclude = {
  cards: {
    orderBy: { dayIndex: "asc" as const },
  },
} as const;

type CycleWithCards = MarketPulseCycle & {
  cards: MarketPulseCard[];
};

type GameSettingWithCycle = MarketPulseGameSetting & {
  activeCycle: MarketPulseCycle | null;
};

export {
  getMarketPulseCardPublicPayload,
  isMarketPulseCardRevealed,
  isMarketPulseCycleRevealed,
  type MarketPulseCardPublicPayload,
};

export type MarketPulseUserDecisionState = {
  id: string;
  decision: MarketPulseSignal;
  decidedAt: Date;
};

export type TodayMarketPulseCardForUser = {
  cycle: {
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    revealAt: Date;
    status: MarketPulseCycleStatus;
  };
  card: MarketPulseCardPublicPayload;
  userDecision: MarketPulseUserDecisionState | null;
};

export type SubmitMarketPulseDecisionInput = {
  userId: string;
  cardId: string;
  decision: string;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

export type SubmitMarketPulseDecisionResult =
  | {
      ok: true;
      alreadySubmitted: boolean;
      decision: MarketPulseUserDecisionState;
    }
  | { ok: false; error: string };

export type CycleScoreCalculationSummary = {
  cycleId: string;
  decisionsScored: number;
  usersScored: number;
  eventsCreated: number;
  participationPoints: number;
  matchBonusPoints: number;
  streakBonusPoints: number;
  totalPoints: number;
  topScore: number | null;
};

export type MarketPulseLeaderboardRow = MarketPulseLeaderboardEntryRow;

export type GetMarketPulseLeaderboardInput = {
  mode: MarketPulseLeaderboardType;
  cycleId?: string | null;
  limit?: number;
};

export type UserMarketPulseProgress = {
  cycleId: string | null;
  decisionsCount: number;
  cardsPlayed: number;
  cardsRemaining: number;
  totalCards: number;
  participationPoints: number;
  totalPoints: number | null;
  rank: number | null;
  currentStreak: number | null;
  isRevealed: boolean;
};

export type MarketPulseRevealCardBreakdown = {
  cardId: string;
  dayIndex: number;
  companyName: string;
  headline: string;
  userDecision: MarketPulseSignal;
  ppaSignal: MarketPulseSignal;
  ppaInsight: string | null;
  participationPoints: number;
  matchBonus: number;
  streakBonus: number;
  totalPoints: number;
};

export type MarketPulseRevealForUser = {
  cycleId: string;
  cycleName: string;
  isRevealed: boolean;
  cards: MarketPulseRevealCardBreakdown[];
  totals: {
    participationPoints: number;
    matchBonus: number;
    streakBonus: number;
    totalPoints: number;
  };
};

function currentTime(): Date {
  return new Date();
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfNextUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function effectiveCardRevealAt(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "revealAt">,
): Date {
  return card.revealAt ?? cycle.revealAt;
}

function isCyclePlayableForServer(
  cycle: Pick<MarketPulseCycle, "status" | "startsAt" | "revealAt">,
  at: Date = currentTime(),
): boolean {
  return isCyclePlayable(cycle, at);
}

function getDayIndexForCycle(
  cycleStartsAt: Date,
  at: Date = currentTime(),
): number {
  const elapsed = at.getTime() - cycleStartsAt.getTime();
  if (elapsed < 0) {
    return 0;
  }
  return Math.floor(elapsed / MS_PER_DAY);
}

function toPrismaSignal(decision: MarketPulseDecision): MarketPulseSignal {
  return decision;
}

function mapPlayerName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Member";
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/** Prisma-backed singleton game setting (distinct from KV theme settings). */
export async function getMarketPulseSettings(): Promise<GameSettingWithCycle> {
  const existing = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
    include: { activeCycle: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.marketPulseGameSetting.create({
    data: {
      runtimeStatus: "OPEN",
      defaultLeaderboardMode: "CURRENT_CYCLE",
    },
    include: { activeCycle: true },
  });
}

export async function getActiveMarketPulseCycle(): Promise<CycleWithCards | null> {
  const settings = await getMarketPulseSettings();
  const now = currentTime();

  if (settings.activeCycleId) {
    const pinned = await prisma.marketPulseCycle.findUnique({
      where: { id: settings.activeCycleId },
      include: cycleWithCardsInclude,
    });

    if (pinned && isCyclePlayableForServer(pinned, now)) {
      return pinned;
    }
  }

  return prisma.marketPulseCycle.findFirst({
    where: {
      status: "OPEN",
      startsAt: { lte: now },
      revealAt: { gte: now },
    },
    orderBy: { startsAt: "desc" },
    include: cycleWithCardsInclude,
  });
}

/** Today's published card and cycle without user-specific decision data. */
export async function getTodayMarketPulseCardSnapshot(): Promise<Omit<
  TodayMarketPulseCardForUser,
  "userDecision"
> | null> {
  const cycle = await getActiveMarketPulseCycle();
  if (!cycle) {
    return null;
  }

  const card = findPlayableCardForToday(cycle, currentTime());
  if (!card) {
    return null;
  }

  return {
    cycle: {
      id: cycle.id,
      name: cycle.name,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      revealAt: cycle.revealAt,
      status: cycle.status,
    },
    card: getMarketPulseCardPublicPayload(card, { cycle }),
  };
}

export async function getTodayMarketPulseCardForUser(
  userId: string,
): Promise<TodayMarketPulseCardForUser | null> {
  const cycle = await getActiveMarketPulseCycle();
  if (!cycle) {
    return null;
  }

  const card = findPlayableCardForToday(cycle, currentTime());
  if (!card) {
    return null;
  }

  const userDecision = await prisma.marketPulseDecision.findUnique({
    where: {
      userId_cardId: {
        userId,
        cardId: card.id,
      },
    },
    select: {
      id: true,
      decision: true,
      decidedAt: true,
    },
  });

  return {
    cycle: {
      id: cycle.id,
      name: cycle.name,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      revealAt: cycle.revealAt,
      status: cycle.status,
    },
    card: getMarketPulseCardPublicPayload(card, { cycle }),
    userDecision: userDecision
      ? {
          id: userDecision.id,
          decision: userDecision.decision,
          decidedAt: userDecision.decidedAt,
        }
      : null,
  };
}

export async function submitMarketPulseDecision(
  input: SubmitMarketPulseDecisionInput,
): Promise<SubmitMarketPulseDecisionResult> {
  const { userId, cardId, ipHash, userAgentHash } = input;

  if (!isValidMarketPulseDecision(input.decision)) {
    return { ok: false, error: "Decision must be BULLISH or CAUTIOUS." };
  }

  const decision = input.decision;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return { ok: false, error: "Invalid user." };
  }

  const existing = await prisma.marketPulseDecision.findUnique({
    where: {
      userId_cardId: { userId, cardId },
    },
    select: {
      id: true,
      decision: true,
      decidedAt: true,
    },
  });

  if (existing) {
    return {
      ok: true,
      alreadySubmitted: true,
      decision: {
        id: existing.id,
        decision: existing.decision,
        decidedAt: existing.decidedAt,
      },
    };
  }

  if (!canSubmitMarketPulseDecision(user.role, currentTime())) {
    return { ok: false, error: MARKET_PULSE_PUBLIC_LAUNCH_SUBMIT_ERROR };
  }

  const settings = await getMarketPulseSettings();
  if (settings.runtimeStatus !== "OPEN") {
    return { ok: false, error: "Market Pulse is not open for decisions." };
  }

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
    include: { cycle: true },
  });

  if (!card) {
    return { ok: false, error: "Card not found." };
  }

  if (card.cycle.status !== "OPEN") {
    return { ok: false, error: "This challenge cycle is not open." };
  }

  if (card.status !== "PUBLISHED") {
    return { ok: false, error: "This card is not published." };
  }

  const now = currentTime();

  if (card.cycle.startsAt > now) {
    return { ok: false, error: "This challenge cycle has not started yet." };
  }

  const activeCycle = await getActiveMarketPulseCycle();
  if (!activeCycle || activeCycle.id !== card.cycleId) {
    return { ok: false, error: "This card is not part of the active challenge." };
  }

  const playableCard = findPlayableCardForToday(activeCycle, now);
  if (!playableCard || playableCard.id !== card.id) {
    return {
      ok: false,
      error: "This card is not available for decisions right now.",
    };
  }

  const revealDeadline = effectiveCardRevealAt(card, card.cycle);
  if (now >= revealDeadline) {
    return { ok: false, error: "The decision window for this card has closed." };
  }

  if (card.publishedAt && card.publishedAt > now) {
    return { ok: false, error: "This card is not yet available." };
  }

  try {
    const created = await prisma.marketPulseDecision.create({
      data: {
        userId,
        cardId: card.id,
        cycleId: card.cycleId,
        decision: toPrismaSignal(decision),
        ipHash: ipHash ?? null,
        userAgentHash: userAgentHash ?? null,
      },
      select: {
        id: true,
        decision: true,
        decidedAt: true,
      },
    });

    return {
      ok: true,
      alreadySubmitted: false,
      decision: {
        id: created.id,
        decision: created.decision,
        decidedAt: created.decidedAt,
      },
    };
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const raced = await prisma.marketPulseDecision.findUnique({
        where: {
          userId_cardId: { userId, cardId },
        },
        select: {
          id: true,
          decision: true,
          decidedAt: true,
        },
      });

      if (raced) {
        return {
          ok: true,
          alreadySubmitted: true,
          decision: {
            id: raced.id,
            decision: raced.decision,
            decidedAt: raced.decidedAt,
          },
        };
      }
    }

    throw error;
  }
}

export async function calculateAndPersistCycleScores(
  cycleId: string,
): Promise<CycleScoreCalculationSummary> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, status: true, revealAt: true },
  });

  if (!cycle) {
    throw new Error(`Cycle not found: ${cycleId}`);
  }

  if (!isMarketPulseCycleRevealed(cycle)) {
    throw new Error(
      "Scores can only be calculated after the cycle has been revealed.",
    );
  }

  const totalCards = await prisma.marketPulseCard.count({
    where: { cycleId },
  });

  const decisions = await prisma.marketPulseDecision.findMany({
    where: { cycleId },
    select: {
      id: true,
      userId: true,
      cardId: true,
      decision: true,
      card: {
        select: {
          id: true,
          dayIndex: true,
          ppaSignal: true,
        },
      },
    },
  });

  const byUser = new Map<string, ScoreCalculationDecision[]>();
  for (const decision of decisions) {
    const list = byUser.get(decision.userId) ?? [];
    list.push(decision);
    byUser.set(decision.userId, list);
  }

  const allEvents = Array.from(byUser.values()).flatMap((userDecisions) =>
    buildScoreEventsForUser(cycleId, userDecisions),
  );
  const cycleUserScores = buildCycleUserScoreRows(
    cycleId,
    byUser,
    allEvents,
    totalCards,
  );

  // Idempotent scoring: wipe prior events for this cycle, then insert the freshly
  // computed set in one transaction. Re-running reveal/recalculate therefore replaces
  // stale rows instead of appending duplicates.
  await prisma.$transaction(async (tx) => {
    await tx.marketPulseScoreEvent.deleteMany({
      where: { cycleId },
    });
    await tx.marketPulseScore.deleteMany({
      where: { cycleId },
    });

    if (allEvents.length > 0) {
      await tx.marketPulseScoreEvent.createMany({
        data: allEvents,
      });
    }

    if (cycleUserScores.length > 0) {
      await tx.marketPulseScore.createMany({
        data: cycleUserScores,
      });
    }
  });

  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId,
    limit: 1,
  });

  const summary = allEvents.reduce(
    (acc, event) => {
      acc.participationPoints += event.participationPoints;
      acc.matchBonusPoints += event.matchBonus;
      acc.streakBonusPoints += event.streakBonus;
      acc.totalPoints += event.totalPoints;
      return acc;
    },
    {
      participationPoints: 0,
      matchBonusPoints: 0,
      streakBonusPoints: 0,
      totalPoints: 0,
    },
  );

  return {
    cycleId,
    decisionsScored: decisions.length,
    usersScored: byUser.size,
    eventsCreated: allEvents.length,
    topScore: leaderboard[0]?.score ?? null,
    ...summary,
  };
}

async function getParticipationLeaderboardForCycle(
  cycleId: string,
  limit: number,
  isRevealed = false,
): Promise<MarketPulseLeaderboardRow[]> {
  const grouped = await prisma.marketPulseDecision.groupBy({
    by: ["userId"],
    where: { cycleId },
    _count: { _all: true },
  });

  const sorted = [...grouped]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, limit);

  if (sorted.length === 0) {
    return [];
  }

  const userIds = sorted.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return sorted.map((row, index) => {
    const user = userMap.get(row.userId);
    const participationPoints = row._count._all * PARTICIPATION_POINTS;
    return {
      rank: index + 1,
      userId: row.userId,
      playerName: mapPlayerName(user?.name),
      image: user?.image ?? null,
      score: participationPoints,
      participationPoints,
      bonusPoints: 0,
      isRevealed,
      cardsPlayed: row._count._all,
    };
  });
}

async function getScoreEventLeaderboardForCycle(
  cycleId: string,
  limit: number,
  isRevealed: boolean,
): Promise<MarketPulseLeaderboardRow[]> {
  const grouped = await prisma.marketPulseScoreEvent.groupBy({
    by: ["userId"],
    where: { cycleId },
    _sum: {
      participationPoints: true,
      matchBonus: true,
      streakBonus: true,
      totalPoints: true,
    },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) {
    return [];
  }

  const userIds = grouped.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const cardsPlayedMap = await getScoreEventCardsPlayedCounts(userIds, { cycleId });

  return grouped.map((row, index) => {
    const user = userMap.get(row.userId);
    const participationPoints = row._sum.participationPoints ?? 0;
    const matchBonus = row._sum.matchBonus ?? 0;
    const streakBonus = row._sum.streakBonus ?? 0;
    const score = row._sum.totalPoints ?? 0;

    return {
      rank: index + 1,
      userId: row.userId,
      playerName: mapPlayerName(user?.name),
      image: user?.image ?? null,
      score,
      participationPoints,
      bonusPoints: matchBonus + streakBonus,
      isRevealed,
      cardsPlayed: cardsPlayedMap.get(row.userId),
    };
  });
}

async function getScoreEventCardsPlayedCounts(
  userIds: string[],
  where: {
    cycleId?: string;
    createdAt?: { gte: Date; lt: Date };
  },
): Promise<Map<string, number>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const grouped = await prisma.marketPulseScoreEvent.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      cardId: { not: null },
      ...where,
    },
    _count: { _all: true },
  });

  return new Map(grouped.map((row) => [row.userId, row._count._all]));
}

async function getMonthlyLeaderboard(
  limit: number,
): Promise<MarketPulseLeaderboardRow[]> {
  const now = currentTime();
  const monthStart = startOfUtcMonth(now);
  const monthEnd = startOfNextUtcMonth(now);

  const grouped = await prisma.marketPulseScoreEvent.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    _sum: {
      participationPoints: true,
      matchBonus: true,
      streakBonus: true,
      totalPoints: true,
    },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) {
    return [];
  }

  const userIds = grouped.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const cardsPlayedMap = await getScoreEventCardsPlayedCounts(userIds, {
    createdAt: { gte: monthStart, lt: monthEnd },
  });

  return grouped.map((row, index) => {
    const user = userMap.get(row.userId);
    const participationPoints = row._sum.participationPoints ?? 0;
    const matchBonus = row._sum.matchBonus ?? 0;
    const streakBonus = row._sum.streakBonus ?? 0;

    return {
      rank: index + 1,
      userId: row.userId,
      playerName: mapPlayerName(user?.name),
      image: user?.image ?? null,
      score: row._sum.totalPoints ?? 0,
      participationPoints,
      bonusPoints: matchBonus + streakBonus,
      isRevealed: true,
      cardsPlayed: cardsPlayedMap.get(row.userId),
    };
  });
}

async function getAllTimeLeaderboard(
  limit: number,
): Promise<MarketPulseLeaderboardRow[]> {
  const grouped = await prisma.marketPulseScoreEvent.groupBy({
    by: ["userId"],
    _sum: {
      participationPoints: true,
      matchBonus: true,
      streakBonus: true,
      totalPoints: true,
    },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) {
    return [];
  }

  const userIds = grouped.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const cardsPlayedMap = await getScoreEventCardsPlayedCounts(userIds, {});

  return grouped.map((row, index) => {
    const user = userMap.get(row.userId);
    const participationPoints = row._sum.participationPoints ?? 0;
    const matchBonus = row._sum.matchBonus ?? 0;
    const streakBonus = row._sum.streakBonus ?? 0;

    return {
      rank: index + 1,
      userId: row.userId,
      playerName: mapPlayerName(user?.name),
      image: user?.image ?? null,
      score: row._sum.totalPoints ?? 0,
      participationPoints,
      bonusPoints: matchBonus + streakBonus,
      isRevealed: true,
      cardsPlayed: cardsPlayedMap.get(row.userId),
    };
  });
}

export async function getMarketPulseLeaderboard(
  input: GetMarketPulseLeaderboardInput,
): Promise<MarketPulseLeaderboardRow[]> {
  const limit = input.limit ?? 10;

  if (input.mode === "MONTHLY") {
    return getMonthlyLeaderboard(limit);
  }

  if (input.mode === "ALL_TIME") {
    return getAllTimeLeaderboard(limit);
  }

  let cycleId = input.cycleId ?? null;
  if (!cycleId) {
    const active = await getActiveMarketPulseCycle();
    cycleId = active?.id ?? null;
  }

  if (!cycleId) {
    return [];
  }

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, status: true, revealAt: true },
  });

  if (!cycle) {
    return [];
  }

  const revealed = isMarketPulseCycleRevealed(cycle);

  if (!revealed) {
    return getParticipationLeaderboardForCycle(cycleId, limit, false);
  }

  const scoreRows = await getScoreEventLeaderboardForCycle(
    cycleId,
    limit,
    true,
  );

  if (scoreRows.length > 0) {
    return scoreRows;
  }

  return getParticipationLeaderboardForCycle(cycleId, limit, true);
}

async function resolveProgressCycle(
  cycleId?: string | null,
): Promise<CycleWithCards | null> {
  if (cycleId) {
    return prisma.marketPulseCycle.findUnique({
      where: { id: cycleId },
      include: cycleWithCardsInclude,
    });
  }
  return getActiveMarketPulseCycle();
}

function countPublishedCards(cycle: CycleWithCards, at: Date): number {
  return cycle.cards.filter(
    (card) =>
      card.status === "PUBLISHED" &&
      card.publishedAt != null &&
      card.publishedAt <= at,
  ).length;
}

function computeCurrentStreak(
  decisions: Array<{
    decision: MarketPulseSignal;
    card: { dayIndex: number; ppaSignal: MarketPulseSignal | null };
  }>,
): number {
  const sorted = [...decisions].sort(
    (a, b) => a.card.dayIndex - b.card.dayIndex,
  );

  let streak = 0;
  for (const entry of sorted) {
    if (entry.card.ppaSignal && entry.decision === entry.card.ppaSignal) {
      streak += 1;
    } else {
      streak = 0;
    }
  }
  return streak;
}

export async function getRevealedMarketPulseCycleForPage(): Promise<{
  revealedCycle: Pick<
    MarketPulseCycle,
    "id" | "name" | "status" | "revealAt" | "startsAt" | "endsAt"
  > | null;
  pendingActiveCycle: Pick<
    MarketPulseCycle,
    "id" | "name" | "status" | "revealAt" | "startsAt" | "endsAt"
  > | null;
}> {
  const now = currentTime();
  const active = await getActiveMarketPulseCycle();

  if (active && !isMarketPulseCycleRevealed(active, now)) {
    return { revealedCycle: null, pendingActiveCycle: active };
  }

  if (active && isMarketPulseCycleRevealed(active, now)) {
    return { revealedCycle: active, pendingActiveCycle: null };
  }

  const revealedCycle = await prisma.marketPulseCycle.findFirst({
    where: {
      OR: [{ status: "REVEALED" }, { revealAt: { lte: now } }],
      NOT: { status: "ARCHIVED" },
    },
    orderBy: { revealAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      revealAt: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (revealedCycle && isMarketPulseCycleRevealed(revealedCycle, now)) {
    return { revealedCycle, pendingActiveCycle: null };
  }

  return { revealedCycle: null, pendingActiveCycle: null };
}

export async function getUserMarketPulseProgress(
  userId: string,
  cycleId?: string | null,
): Promise<UserMarketPulseProgress> {
  const cycle = await resolveProgressCycle(cycleId);
  const now = currentTime();

  if (!cycle) {
    return {
      cycleId: null,
      decisionsCount: 0,
      cardsPlayed: 0,
      cardsRemaining: 0,
      totalCards: 0,
      participationPoints: 0,
      totalPoints: null,
      rank: null,
      currentStreak: null,
      isRevealed: false,
    };
  }

  const revealed = isMarketPulseCycleRevealed(cycle, now);
  const publishedCardCount = countPublishedCards(cycle, now);

  const [decisions, storedScoreRow] = await Promise.all([
    prisma.marketPulseDecision.findMany({
      where: { userId, cycleId: cycle.id },
      select: {
        decision: true,
        card: {
          select: {
            dayIndex: true,
            ppaSignal: true,
          },
        },
      },
    }),
    prisma.marketPulseScore.findUnique({
      where: {
        userId_cycleId: {
          userId,
          cycleId: cycle.id,
        },
      },
      select: {
        participationScore: true,
        decisionsSubmitted: true,
        totalCards: true,
      },
    }),
  ]);

  const storedParticipation: StoredCycleParticipation = storedScoreRow
    ? {
        participationScore: storedScoreRow.participationScore,
        decisionsSubmitted: storedScoreRow.decisionsSubmitted,
        totalCards: storedScoreRow.totalCards,
      }
    : null;

  const liveDecisionsCount = decisions.length;
  const decisionsCount = resolveDecisionsSubmitted(
    storedParticipation,
    liveDecisionsCount,
  );
  const participationPoints = resolveParticipationScore(
    storedParticipation,
    liveDecisionsCount,
  );
  const fallbackTotalCards = revealed ? cycle.cards.length : publishedCardCount;
  const totalCards = resolveTotalCards(storedParticipation, fallbackTotalCards);
  const cardsPlayed = decisionsCount;
  const cardsRemaining = Math.max(totalCards - cardsPlayed, 0);

  let totalPoints: number | null = null;
  let currentStreak: number | null = null;

  if (revealed) {
    const aggregate = await prisma.marketPulseScoreEvent.aggregate({
      where: { userId, cycleId: cycle.id },
      _sum: { totalPoints: true },
    });
    totalPoints = aggregate._sum.totalPoints ?? 0;
    currentStreak = computeCurrentStreak(decisions);
  }

  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId: cycle.id,
    limit: 500,
  });
  const rankEntry = leaderboard.find((row) => row.userId === userId);

  return {
    cycleId: cycle.id,
    decisionsCount,
    cardsPlayed,
    cardsRemaining,
    totalCards,
    participationPoints,
    totalPoints: revealed ? (totalPoints ?? 0) : null,
    rank: rankEntry?.rank ?? null,
    currentStreak: revealed ? currentStreak : null,
    isRevealed: revealed,
  };
}

export async function getMarketPulseRevealForUser(
  userId: string,
  cycleId: string,
): Promise<MarketPulseRevealForUser | null> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      name: true,
      status: true,
      revealAt: true,
    },
  });

  if (!cycle) {
    return null;
  }

  const revealed = isMarketPulseCycleRevealed(cycle);
  if (!revealed) {
    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      isRevealed: false,
      cards: [],
      totals: {
        participationPoints: 0,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 0,
      },
    };
  }

  const decisions = await prisma.marketPulseDecision.findMany({
    where: { userId, cycleId },
    include: {
      card: {
        select: {
          id: true,
          dayIndex: true,
          companyName: true,
          headline: true,
          ppaSignal: true,
          ppaInsight: true,
        },
      },
    },
    orderBy: { card: { dayIndex: "asc" } },
  });

  const scoreEvents = await prisma.marketPulseScoreEvent.findMany({
    where: { userId, cycleId },
    select: {
      cardId: true,
      participationPoints: true,
      matchBonus: true,
      streakBonus: true,
      totalPoints: true,
    },
  });
  const scoreByCard = new Map(
    scoreEvents.map((event) => [event.cardId ?? "", event]),
  );

  const cards: MarketPulseRevealCardBreakdown[] = [];

  for (const entry of decisions) {
    if (!entry.card.ppaSignal) {
      continue;
    }

    const scores = scoreByCard.get(entry.cardId);
    cards.push({
      cardId: entry.cardId,
      dayIndex: entry.card.dayIndex,
      companyName: entry.card.companyName,
      headline: entry.card.headline,
      userDecision: entry.decision,
      ppaSignal: entry.card.ppaSignal,
      ppaInsight: entry.card.ppaInsight,
      participationPoints: scores?.participationPoints ?? PARTICIPATION_POINTS,
      matchBonus: scores?.matchBonus ?? 0,
      streakBonus: scores?.streakBonus ?? 0,
      totalPoints:
        scores?.totalPoints ??
        PARTICIPATION_POINTS + (scores?.matchBonus ?? 0) + (scores?.streakBonus ?? 0),
    });
  }

  const totals = cards.reduce(
    (acc, card) => {
      acc.participationPoints += card.participationPoints;
      acc.matchBonus += card.matchBonus;
      acc.streakBonus += card.streakBonus;
      acc.totalPoints += card.totalPoints;
      return acc;
    },
    {
      participationPoints: 0,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: 0,
    },
  );

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    isRevealed: true,
    cards,
    totals,
  };
}
