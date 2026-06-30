import "server-only";

import type { MarketPulseCycleStatus } from "@prisma/client";

import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db-config";
import type { MarketPulseDecision } from "@/lib/market-pulse/constants";
import type { CyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
} from "@/lib/market-pulse/cycle-playability";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
  getMarketPulseSettings,
  getTodayMarketPulseCardForUser,
  getTodayMarketPulseCardSnapshot,
  isMarketPulseCycleRevealed,
  type MarketPulseCardPublicPayload,
  type MarketPulseLeaderboardRow,
} from "@/lib/market-pulse/server";
import {
  MARKET_PULSE_CYCLE_PRIZE_SHORT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
  canAccessMarketPulsePlay,
} from "@/lib/market-pulse/launch-config";
import { gateRuntimeClosedPageData } from "@/lib/market-pulse/play-page-state";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MarketPulsePlayPageStatus =
  | "pre_launch"
  | "no_active_cycle"
  | "cycle_unavailable"
  | "runtime_closed"
  | "no_card_today"
  | "sign_in_required"
  | "locked"
  | "playable";

export type MarketPulsePlayPageData = {
  status: MarketPulsePlayPageStatus;
  isAuthenticated: boolean;
  runtimeOpen: boolean;
  unavailableReason?: string | null;
  unavailableIssue?: CyclePlayabilityIssue | null;
  challengeName: string;
  prizeLabel: string;
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

function formatRevealLabel(revealAt: Date, locale: SiteLocale = "en"): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
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
    prizeLabel: string | null;
    startsAt: Date;
    endsAt: Date;
    revealAt: Date;
    status: MarketPulseCycleStatus;
  },
  now: Date,
  locale: SiteLocale = "en",
): Pick<
  MarketPulsePlayPageData,
  | "challengeName"
  | "prizeLabel"
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
    prizeLabel: cycle.prizeLabel?.trim() || MARKET_PULSE_CYCLE_PRIZE_SHORT,
    dayCurrent,
    dayTotal,
    revealAtIso: cycle.revealAt.toISOString(),
    revealRemainingMs: Math.max(0, cycle.revealAt.getTime() - now.getTime()),
    revealAtLabel: formatRevealLabel(cycle.revealAt, locale),
    cycleId: cycle.id,
    leaderboardRevealed: isMarketPulseCycleRevealed(cycle, now),
  };
}

function buildPreLaunchPageData(
  isAuthenticated: boolean,
  now: Date,
): MarketPulsePlayPageData {
  return {
    status: "pre_launch",
    isAuthenticated,
    runtimeOpen: false,
    unavailableReason: null,
    challengeName: "Market Pulse",
    prizeLabel: "",
    dayCurrent: 0,
    dayTotal: 0,
    revealAtIso: MARKET_PULSE_PUBLIC_LAUNCH_AT.toISOString(),
    revealRemainingMs: Math.max(
      0,
      MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime() - now.getTime(),
    ),
    revealAtLabel: "",
    cycleId: null,
    leaderboardEntries: [],
    leaderboardRevealed: false,
    card: null,
    lockedDecision: null,
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

export async function getMarketPulsePlayPageData(
  locale: SiteLocale = "en",
): Promise<MarketPulsePlayPageData> {
  const now = new Date();
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);
  const role = session?.user?.role;

  if (!canAccessMarketPulsePlay(role, now)) {
    return buildPreLaunchPageData(isAuthenticated, now);
  }

  let runtimeOpen = true;
  if (isDatabaseConfigured()) {
    try {
      const settings = await getMarketPulseSettings();
      runtimeOpen = settings.runtimeStatus === "OPEN";
    } catch (error) {
      console.error("[market-pulse/play-data] Failed to load runtime settings:", error);
      runtimeOpen = false;
    }
  }

  const finalize = (
    data: Omit<MarketPulsePlayPageData, "runtimeOpen">,
  ): MarketPulsePlayPageData =>
    gateRuntimeClosedPageData({ ...data, runtimeOpen }, runtimeOpen);

  if (!isDatabaseConfigured()) {
    return finalize({
      status: "no_active_cycle",
      isAuthenticated,
      unavailableReason: null,
      challengeName: "Market Pulse",
      prizeLabel: "",
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
    });
  }

  let activeCycle = null;
  try {
    activeCycle = await getActiveMarketPulseCycle();
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load active cycle:", error);
  }

  if (!activeCycle) {
    let unavailableReason: string | null = null;
    let unavailableIssue: CyclePlayabilityIssue | null = null;
    try {
      const settings = await getMarketPulseSettings();
      const pinned = settings.activeCycle;
      if (pinned) {
        const issue = getCyclePlayabilityIssue(pinned, now);
        if (issue) {
          unavailableIssue = issue;
          unavailableReason = describeCyclePlayabilityIssue(issue);
        }
      }
    } catch {
      // ignore — fall through to generic empty state
    }

    return finalize({
      status: unavailableReason ? "cycle_unavailable" : "no_active_cycle",
      isAuthenticated,
      unavailableReason,
      unavailableIssue,
      challengeName: "Market Pulse",
      prizeLabel: "",
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
    });
  }

  const cycleShell = buildCycleShell(activeCycle, now, locale);
  const leaderboardEntries = await loadLeaderboard(activeCycle.id);

  let snapshot = null;
  try {
    snapshot = await getTodayMarketPulseCardSnapshot();
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load card snapshot:", error);
  }

  if (!snapshot) {
    return finalize({
      status: "no_card_today",
      isAuthenticated,
      ...cycleShell,
      leaderboardEntries,
      card: null,
      lockedDecision: null,
    });
  }

  const card = serializeCard(snapshot.card);

  if (!isAuthenticated || !userId) {
    return finalize({
      status: "sign_in_required",
      isAuthenticated: false,
      ...cycleShell,
      leaderboardEntries,
      card,
      lockedDecision: null,
    });
  }

  let todayForUser = null;
  try {
    todayForUser = await getTodayMarketPulseCardForUser(userId);
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load user card:", error);
  }

  if (todayForUser?.userDecision) {
    return finalize({
      status: "locked",
      isAuthenticated: true,
      ...cycleShell,
      leaderboardEntries,
      card: serializeCard(todayForUser.card),
      lockedDecision: todayForUser.userDecision.decision as MarketPulseDecision,
    });
  }

  return finalize({
    status: "playable",
    isAuthenticated: true,
    ...cycleShell,
    leaderboardEntries,
    card,
    lockedDecision: null,
  });
}
