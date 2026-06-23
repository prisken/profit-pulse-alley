import "server-only";

import type { MarketPulseCycleStatus } from "@prisma/client";

import { auth } from "@/auth";
import type { MarketPulseDecision } from "@/lib/market-pulse/constants";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
  getTodayMarketPulseCardForUser,
  getTodayMarketPulseCardSnapshot,
  isMarketPulseCycleRevealed,
  type MarketPulseCardPublicPayload,
  type MarketPulseLeaderboardRow,
} from "@/lib/market-pulse/server";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MarketPulsePlayPageStatus =
  | "no_active_cycle"
  | "no_card_today"
  | "sign_in_required"
  | "locked"
  | "playable";

export type MarketPulsePlayPageData = {
  status: MarketPulsePlayPageStatus;
  isAuthenticated: boolean;
  challengeName: string;
  dayCurrent: number;
  dayTotal: number;
  revealAtIso: string;
  revealRemainingMs: number;
  revealAtLabel: string;
  cycleId: string | null;
  leaderboardEntries: MarketPulseLeaderboardRow[];
  leaderboardRevealed: boolean;
  card: MarketPulseSwipeCardData | null;
  lockedDecision: MarketPulseDecision | null;
};

function getDayProgress(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): { dayCurrent: number; dayTotal: number } {
  const spanMs = Math.max(endsAt.getTime() - startsAt.getTime(), MS_PER_DAY);
  const dayTotal = Math.max(1, Math.round(spanMs / MS_PER_DAY));
  const elapsedMs = now.getTime() - startsAt.getTime();
  const dayCurrent = Math.min(
    dayTotal,
    Math.max(1, Math.floor(elapsedMs / MS_PER_DAY) + 1),
  );

  return { dayCurrent, dayTotal };
}

function formatRevealLabel(revealAt: Date): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(revealAt);
}

function serializeCard(
  card: MarketPulseCardPublicPayload,
): MarketPulseSwipeCardData {
  return toMarketPulseSwipeCardData({
    ...card,
    sourceDate: card.sourceDate?.toISOString() ?? null,
  });
}

function buildCycleShell(
  cycle: {
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    revealAt: Date;
    status: MarketPulseCycleStatus;
  },
  now: Date,
): Pick<
  MarketPulsePlayPageData,
  | "challengeName"
  | "dayCurrent"
  | "dayTotal"
  | "revealAtIso"
  | "revealRemainingMs"
  | "revealAtLabel"
  | "cycleId"
  | "leaderboardRevealed"
> {
  const { dayCurrent, dayTotal } = getDayProgress(
    cycle.startsAt,
    cycle.endsAt,
    now,
  );

  return {
    challengeName: cycle.name,
    dayCurrent,
    dayTotal,
    revealAtIso: cycle.revealAt.toISOString(),
    revealRemainingMs: Math.max(0, cycle.revealAt.getTime() - now.getTime()),
    revealAtLabel: formatRevealLabel(cycle.revealAt),
    cycleId: cycle.id,
    leaderboardRevealed: isMarketPulseCycleRevealed(cycle, now),
  };
}

async function loadLeaderboard(
  cycleId: string | null,
): Promise<MarketPulseLeaderboardRow[]> {
  try {
    return await getMarketPulseLeaderboard({
      mode: "CURRENT_CYCLE",
      cycleId,
      limit: 5,
    });
  } catch (error) {
    console.error("[market-pulse/play-data] Leaderboard failed:", error);
    return [];
  }
}

export async function getMarketPulsePlayPageData(): Promise<MarketPulsePlayPageData> {
  const now = new Date();
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);

  let activeCycle = null;
  try {
    activeCycle = await getActiveMarketPulseCycle();
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load active cycle:", error);
  }

  if (!activeCycle) {
    return {
      status: "no_active_cycle",
      isAuthenticated,
      challengeName: "Market Pulse",
      dayCurrent: 0,
      dayTotal: 0,
      revealAtIso: now.toISOString(),
      revealRemainingMs: 0,
      revealAtLabel: "",
      cycleId: null,
      leaderboardEntries: [],
      leaderboardRevealed: false,
      card: null,
      lockedDecision: null,
    };
  }

  const cycleShell = buildCycleShell(activeCycle, now);
  const leaderboardEntries = await loadLeaderboard(activeCycle.id);

  let snapshot = null;
  try {
    snapshot = await getTodayMarketPulseCardSnapshot();
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load card snapshot:", error);
  }

  if (!snapshot) {
    return {
      status: "no_card_today",
      isAuthenticated,
      ...cycleShell,
      leaderboardEntries,
      card: null,
      lockedDecision: null,
    };
  }

  const card = serializeCard(snapshot.card);

  if (!isAuthenticated || !userId) {
    return {
      status: "sign_in_required",
      isAuthenticated: false,
      ...cycleShell,
      leaderboardEntries,
      card,
      lockedDecision: null,
    };
  }

  let todayForUser = null;
  try {
    todayForUser = await getTodayMarketPulseCardForUser(userId);
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load user card:", error);
  }

  if (todayForUser?.userDecision) {
    return {
      status: "locked",
      isAuthenticated: true,
      ...cycleShell,
      leaderboardEntries,
      card: serializeCard(todayForUser.card),
      lockedDecision: todayForUser.userDecision.decision as MarketPulseDecision,
    };
  }

  return {
    status: "playable",
    isAuthenticated: true,
    ...cycleShell,
    leaderboardEntries,
    card,
    lockedDecision: null,
  };
}
