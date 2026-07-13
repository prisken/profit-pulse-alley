import "server-only";

import type { MarketPulseCycleStatus } from "@prisma/client";

import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db-config";
import type { MarketPulsePlayerChoice } from "@/lib/market-pulse/card-type";
import type { CyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
} from "@/lib/market-pulse/cycle-playability";
import type { PlayPageAcquisitionState } from "@/lib/acquisition/prompts";
import {
  EMPTY_PLAY_PAGE_ACQUISITION,
  resolvePlayPageAcquisition,
} from "@/lib/acquisition/prompts";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  loadMarketPulseNextCycleStatus,
  type MarketPulseNextCycleStatus,
} from "@/lib/market-pulse/next-cycle";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
  getMarketPulseSettings,
  getTodayMarketPulsePlaySession,
  getTodayMarketPulsePlaySessionSnapshot,
  isMarketPulseCycleRevealed,
  type MarketPulseCardPublicPayload,
  type MarketPulseLeaderboardRow,
  type MarketPulseUserDecisionState,
} from "@/lib/market-pulse/server";
import {
  MARKET_PULSE_CYCLE_PRIZE_SHORT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
  canAccessMarketPulsePlay,
} from "@/lib/market-pulse/launch-config";
import { gateRuntimeClosedPageData } from "@/lib/market-pulse/play-page-state";
import { findEarliestFuturePublishedCardReleaseAt } from "@/lib/market-pulse/playable-card";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MarketPulsePlayPageStatus =
  | "pre_launch"
  | "between_cycles"
  | "cycle_unavailable"
  | "runtime_closed"
  | "no_card_today"
  | "sign_in_required"
  | "locked"
  | "playable";

export type MarketPulsePlayCardSlot = {
  card: MarketPulseSwipeCardData;
  userDecision: MarketPulsePlayerChoice | null;
};

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
  /** All playable cards for today's cycle day. */
  cardsToday: MarketPulsePlayCardSlot[];
  /** Index into cardsToday for the card the player should interact with. */
  activeCardIndex: number;
  /** Active card for the current step (guest preview or play/locked). */
  card: MarketPulseSwipeCardData | null;
  /** Decision for the active card when locked or reviewing a completed card. */
  lockedDecision: MarketPulsePlayerChoice | null;
  /** 1-based progress within today's card set; null when only one card. */
  cardProgress: { current: number; total: number } | null;
  nextCycle: MarketPulseNextCycleStatus;
  /** Earliest future published-card release in the active cycle (no_card_today only). */
  nextCardReleaseAtIso: string | null;
  acquisition: PlayPageAcquisitionState;
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

function emptyPlaySlots(): Pick<
  MarketPulsePlayPageData,
  "cardsToday" | "activeCardIndex" | "card" | "lockedDecision" | "cardProgress"
> {
  return {
    cardsToday: [],
    activeCardIndex: 0,
    card: null,
    lockedDecision: null,
    cardProgress: null,
  };
}

function buildCardProgress(
  cardsToday: MarketPulsePlayCardSlot[],
  activeCardIndex: number,
): { current: number; total: number } | null {
  if (cardsToday.length <= 1) {
    return null;
  }
  return {
    current: activeCardIndex + 1,
    total: cardsToday.length,
  };
}

function serializeSessionSlots(
  slots: Array<{
    card: MarketPulseCardPublicPayload;
    userDecision: MarketPulseUserDecisionState | null;
  }>,
): MarketPulsePlayCardSlot[] {
  return slots.map((slot) => ({
    card: serializeCard(slot.card),
    userDecision: slot.userDecision?.decision ?? null,
  }));
}

function resolveAuthenticatedPlayState(
  cardsToday: MarketPulsePlayCardSlot[],
): Pick<
  MarketPulsePlayPageData,
  "status" | "activeCardIndex" | "card" | "lockedDecision" | "cardProgress"
> {
  const firstUnplayedIndex = cardsToday.findIndex((slot) => !slot.userDecision);

  if (firstUnplayedIndex >= 0) {
    const active = cardsToday[firstUnplayedIndex]!;
    return {
      status: "playable",
      activeCardIndex: firstUnplayedIndex,
      card: active.card,
      lockedDecision: null,
      cardProgress: buildCardProgress(cardsToday, firstUnplayedIndex),
    };
  }

  const activeIndex = Math.max(cardsToday.length - 1, 0);
  const active = cardsToday[activeIndex] ?? null;
  return {
    status: "locked",
    activeCardIndex: activeIndex,
    card: active?.card ?? null,
    lockedDecision: active?.userDecision ?? null,
    cardProgress: buildCardProgress(cardsToday, activeIndex),
  };
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
    nextCycle: { status: "tbc" },
    nextCardReleaseAtIso: null,
    acquisition: EMPTY_PLAY_PAGE_ACQUISITION,
    ...emptyPlaySlots(),
  };
}

async function loadPlayNextCycle(now: Date): Promise<MarketPulseNextCycleStatus> {
  return loadMarketPulseNextCycleStatus({ now });
}

function buildBetweenCyclesPageData(
  isAuthenticated: boolean,
  now: Date,
  nextCycle: MarketPulseNextCycleStatus,
  extras: Partial<
    Pick<
      MarketPulsePlayPageData,
      "unavailableReason" | "unavailableIssue" | "leaderboardEntries"
    >
  > = {},
): Omit<MarketPulsePlayPageData, "runtimeOpen"> {
  return {
    status: "between_cycles",
    isAuthenticated,
    unavailableReason: extras.unavailableReason ?? null,
    unavailableIssue: extras.unavailableIssue ?? null,
    challengeName: "Market Pulse",
    prizeLabel: "",
    dayCurrent: 0,
    dayTotal: 0,
    revealAtIso: now.toISOString(),
    revealRemainingMs: 0,
    revealAtLabel: "",
    cycleId: null,
    leaderboardEntries: extras.leaderboardEntries ?? [],
    leaderboardRevealed: false,
    nextCycle,
    nextCardReleaseAtIso: null,
    acquisition: EMPTY_PLAY_PAGE_ACQUISITION,
    ...emptyPlaySlots(),
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
    return {
      ...buildPreLaunchPageData(isAuthenticated, now),
      acquisition: EMPTY_PLAY_PAGE_ACQUISITION,
    };
  }

  const acquisition = await resolvePlayPageAcquisition(userId);

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
    data: Omit<MarketPulsePlayPageData, "runtimeOpen" | "acquisition">,
  ): MarketPulsePlayPageData =>
    gateRuntimeClosedPageData({ ...data, runtimeOpen, acquisition }, runtimeOpen);

  const nextCycle = isDatabaseConfigured()
    ? await loadPlayNextCycle(now)
    : { status: "tbc" as const };

  if (!isDatabaseConfigured()) {
    return finalize(
      buildBetweenCyclesPageData(isAuthenticated, now, nextCycle),
    );
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

    return finalize(
      unavailableReason
        ? {
            status: "cycle_unavailable",
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
            nextCycle,
            nextCardReleaseAtIso: null,
            ...emptyPlaySlots(),
          }
        : buildBetweenCyclesPageData(isAuthenticated, now, nextCycle),
    );
  }

  const cycleShell = buildCycleShell(activeCycle, now, locale);
  const leaderboardEntries = await loadLeaderboard(activeCycle.id);

  let snapshot = null;
  try {
    snapshot = await getTodayMarketPulsePlaySessionSnapshot(locale);
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load card snapshot:", error);
  }

  if (!snapshot || snapshot.cards.length === 0) {
    const nextCardReleaseAt = findEarliestFuturePublishedCardReleaseAt(
      activeCycle.cards,
      activeCycle,
      now,
    );

    return finalize({
      status: "no_card_today",
      isAuthenticated,
      ...cycleShell,
      leaderboardEntries,
      nextCycle,
      nextCardReleaseAtIso: nextCardReleaseAt?.toISOString() ?? null,
      ...emptyPlaySlots(),
    });
  }

  const guestCardsToday = serializeSessionSlots(snapshot.cards);

  if (!isAuthenticated || !userId) {
    const previewCard = guestCardsToday[0]?.card ?? null;
    return finalize({
      status: "sign_in_required",
      isAuthenticated: false,
      ...cycleShell,
      leaderboardEntries,
      nextCycle,
      nextCardReleaseAtIso: null,
      cardsToday: guestCardsToday,
      activeCardIndex: 0,
      card: previewCard,
      lockedDecision: null,
      cardProgress: buildCardProgress(guestCardsToday, 0),
    });
  }

  let playSession = null;
  try {
    playSession = await getTodayMarketPulsePlaySession(userId, locale);
  } catch (error) {
    console.error("[market-pulse/play-data] Failed to load user cards:", error);
  }

  const cardsToday = playSession
    ? serializeSessionSlots(playSession.cards)
    : guestCardsToday;

  if (cardsToday.length === 0) {
    const nextCardReleaseAt = findEarliestFuturePublishedCardReleaseAt(
      activeCycle.cards,
      activeCycle,
      now,
    );

    return finalize({
      status: "no_card_today",
      isAuthenticated: true,
      ...cycleShell,
      leaderboardEntries,
      nextCycle,
      nextCardReleaseAtIso: nextCardReleaseAt?.toISOString() ?? null,
      ...emptyPlaySlots(),
    });
  }

  return finalize({
    isAuthenticated: true,
    ...cycleShell,
    leaderboardEntries,
    nextCycle,
    nextCardReleaseAtIso: null,
    cardsToday,
    ...resolveAuthenticatedPlayState(cardsToday),
  });
}
