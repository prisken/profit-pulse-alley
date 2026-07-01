import type { MarketPulseCard, MarketPulseGameRuntimeStatus } from "@prisma/client";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  getCycleDayReleaseAt,
  hasLegacyPublishedAtGatePassed,
  isCardReleasedForPlay,
} from "@/lib/market-pulse/card-release-schedule";
import { getTodayCardStatus } from "@/lib/market-pulse/admin-mp-status";
import { getCardSchedulingConflictMessages } from "@/lib/market-pulse/admin-card-scheduling";
import { getCyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import {
  buildLeaderboardCycleOptions,
  getLeaderboardViewState,
} from "@/lib/market-pulse/leaderboard-cycle-select";
import {
  canAccessMarketPulsePlay,
  isBeforePublicLaunch,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
} from "@/lib/market-pulse/launch-config";
import {
  findPlayableCardForToday,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";
import {
  getMarketPulseCardPublicPayload,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/reveal-access";

export type PlayerVisibilityCheckId =
  | "runtime-open"
  | "active-cycle"
  | "cycle-status-open"
  | "cycle-play-window"
  | "today-card-exists"
  | "today-card-published"
  | "today-card-live"
  | "card-day-mapping"
  | "public-launch-gate"
  | "leaderboard-locked"
  | "ppa-privacy";

export type PlayerVisibilityCheckStatus = "pass" | "fail" | "info";

export type PlayerVisibilityCheck = {
  id: PlayerVisibilityCheckId;
  status: PlayerVisibilityCheckStatus;
  message: string;
};

export type PlayerVisibilityReadiness = {
  overallStatus: "ready" | "needs_attention";
  headline: string;
  detail: string | null;
  playersCanSubmitToday: boolean;
  checks: PlayerVisibilityCheck[];
};

const PLAYABILITY_BLOCKING_IDS = new Set<PlayerVisibilityCheckId>([
  "runtime-open",
  "active-cycle",
  "cycle-status-open",
  "cycle-play-window",
  "today-card-exists",
  "today-card-published",
  "today-card-live",
  "card-day-mapping",
]);

function toPlayableCard(card: MarketPulseAdminCardRow): MarketPulseCard {
  return {
    id: card.id,
    status: card.status,
    publishedAt: card.publishedAt ? new Date(card.publishedAt) : null,
    dayIndex: card.dayIndex,
  } as MarketPulseCard;
}

function toMarketPulseCard(card: MarketPulseAdminCardRow): MarketPulseCard {
  return {
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
    sourceDate: card.sourceDate ? new Date(card.sourceDate) : null,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
    summary: card.summary,
    userPrompt: card.userPrompt,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    status: card.status,
    publishedAt: card.publishedAt ? new Date(card.publishedAt) : null,
    revealAt: card.revealAt ? new Date(card.revealAt) : null,
    ppaSignalLockedAt: card.ppaSignalLockedAt
      ? new Date(card.ppaSignalLockedAt)
      : null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } as MarketPulseCard;
}

function formatPublicLaunchLabel(): string {
  return MARKET_PULSE_PUBLIC_LAUNCH_AT.toLocaleString("en-GB", {
    timeZone: "Asia/Hong_Kong",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function findCardForDisplayDay(
  cards: MarketPulseAdminCardRow[],
  displayDay: number,
): MarketPulseAdminCardRow | undefined {
  return cards.find(
    (card) => card.dayIndex === displayDay || card.dayIndex === displayDay - 1,
  );
}

function isBlockingFailure(
  check: PlayerVisibilityCheck,
  now: Date,
): boolean {
  if (check.status !== "fail") {
    return false;
  }
  if (check.id === "public-launch-gate") {
    return !isBeforePublicLaunch(now);
  }
  return PLAYABILITY_BLOCKING_IDS.has(check.id);
}

function finalizeReadiness(
  checks: PlayerVisibilityCheck[],
  input: {
    runtimeStatus: MarketPulseGameRuntimeStatus;
    playIssue: ReturnType<typeof getCyclePlayabilityIssue>;
    playable: MarketPulseCard | null;
    now: Date;
  },
): PlayerVisibilityReadiness {
  const blockingFails = checks.filter((check) => isBlockingFailure(check, input.now));

  const playersCanSubmitToday =
    input.runtimeStatus === "OPEN" &&
    input.playIssue === null &&
    input.playable != null &&
    canAccessMarketPulsePlay("USER", input.now);

  const headline =
    blockingFails.length === 0 ? "Ready for players" : "Needs attention";

  let detail: string | null = null;
  if (playersCanSubmitToday) {
    detail = "Players can submit today";
  } else if (blockingFails[0]) {
    detail = blockingFails[0].message;
  } else if (isBeforePublicLaunch(input.now) && input.playable) {
    detail = `Cycle is playable for verification. Public play opens on ${formatPublicLaunchLabel()} HKT.`;
  }

  return {
    overallStatus: blockingFails.length === 0 ? "ready" : "needs_attention",
    headline,
    detail,
    playersCanSubmitToday,
    checks,
  };
}

export function evaluatePlayerVisibilityReadiness(input: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  activeCycleCards: MarketPulseAdminCardRow[];
  now?: Date;
}): PlayerVisibilityReadiness {
  const now = input.now ?? new Date();
  const checks: PlayerVisibilityCheck[] = [];

  if (input.runtimeStatus === "OPEN") {
    checks.push({
      id: "runtime-open",
      status: "pass",
      message: "Runtime is open.",
    });
  } else {
    checks.push({
      id: "runtime-open",
      status: "fail",
      message:
        input.runtimeStatus === "CLOSED"
          ? "Runtime is closed."
          : `Runtime is ${input.runtimeStatus}.`,
    });
  }

  if (!input.activeCycle) {
    checks.push({
      id: "active-cycle",
      status: "fail",
      message: "No active cycle is set.",
    });
    return finalizeReadiness(checks, {
      runtimeStatus: input.runtimeStatus,
      playIssue: "not_open",
      playable: null,
      now,
    });
  }

  checks.push({
    id: "active-cycle",
    status: "pass",
    message: "Active cycle is set.",
  });

  const cycle = input.activeCycle;
  const cards = input.activeCycleCards;
  const startsAt = new Date(cycle.startsAt);
  const cycleRevealAt = new Date(cycle.revealAt);
  const displayDay = getCycleDisplayDay(startsAt, now);

  if (cycle.status === "OPEN") {
    checks.push({
      id: "cycle-status-open",
      status: "pass",
      message: "Active cycle status is OPEN.",
    });
  } else {
    checks.push({
      id: "cycle-status-open",
      status: "fail",
      message: `Active cycle status is ${cycle.status}.`,
    });
  }

  const playIssue = getCyclePlayabilityIssue(
    {
      status: cycle.status,
      startsAt,
      revealAt: cycleRevealAt,
    },
    now,
  );

  if (!playIssue) {
    checks.push({
      id: "cycle-play-window",
      status: "pass",
      message: "Current time is within the active cycle play window.",
    });
  } else if (playIssue === "not_started") {
    checks.push({
      id: "cycle-play-window",
      status: "fail",
      message: "Active cycle is outside its play window (not started yet).",
    });
  } else if (playIssue === "reveal_passed") {
    checks.push({
      id: "cycle-play-window",
      status: "fail",
      message: "Active cycle is outside its play window (reveal has passed).",
    });
  } else {
    checks.push({
      id: "cycle-play-window",
      status: "fail",
      message: "Active cycle is outside its play window.",
    });
  }

  const playable = findPlayableCardForToday(
    {
      startsAt,
      cards: cards.map(toPlayableCard),
    },
    now,
  );

  const cardForDay = findCardForDisplayDay(cards, displayDay);
  const todayStatus = getTodayCardStatus(cycle, cards, now);

  if (todayStatus?.status === "missing" || !cardForDay) {
    checks.push({
      id: "today-card-exists",
      status: "fail",
      message: "No published card for today.",
    });
  } else {
    checks.push({
      id: "today-card-exists",
      status: "pass",
      message: `Today's card (day ${displayDay}) exists.`,
    });
  }

  if (cardForDay?.status === "PUBLISHED") {
    checks.push({
      id: "today-card-published",
      status: "pass",
      message: "Today's card is published.",
    });
  } else {
    checks.push({
      id: "today-card-published",
      status: "fail",
      message: cardForDay
        ? `Today's card is ${cardForDay.status}.`
        : "No published card for today.",
    });
  }

  if (playable) {
    checks.push({
      id: "today-card-live",
      status: "pass",
      message: "Today's card is live for play.",
    });
  } else if (
    cardForDay &&
    !isCardReleasedForPlay(
      {
        status: cardForDay.status,
        publishedAt: cardForDay.publishedAt
          ? new Date(cardForDay.publishedAt)
          : null,
        dayIndex: cardForDay.dayIndex,
      },
      { startsAt },
      now,
    )
  ) {
    const derivedRelease = getCycleDayReleaseAt(startsAt, cardForDay.dayIndex);
    const message =
      now.getTime() < derivedRelease.getTime()
        ? "Today's card is not live until 9:00 AM HKT on its cycle day."
        : cardForDay.publishedAt &&
            !hasLegacyPublishedAtGatePassed(
              new Date(cardForDay.publishedAt),
              now,
            )
          ? "Today's card published date is in the future."
          : "Today's card is not live for play yet.";

    checks.push({
      id: "today-card-live",
      status: "fail",
      message,
    });
  } else {
    checks.push({
      id: "today-card-live",
      status: "fail",
      message: "Today's card is not live for play yet.",
    });
  }

  const mappingIssues: string[] = [];
  if (cardForDay) {
    mappingIssues.push(
      ...getCardSchedulingConflictMessages(
        cardForDay,
        { startsAt: cycle.startsAt, endsAt: cycle.endsAt },
        cards,
      ),
    );
  }
  if (playable && cardForDay && playable.id !== cardForDay.id) {
    mappingIssues.push(
      `Playable card does not match today's day ${displayDay} mapping.`,
    );
  }

  if (mappingIssues.length === 0 && playable) {
    checks.push({
      id: "card-day-mapping",
      status: "pass",
      message: "Card day index matches today's cycle day.",
    });
  } else if (mappingIssues.length > 0) {
    checks.push({
      id: "card-day-mapping",
      status: "fail",
      message: mappingIssues[0]!,
    });
  } else {
    checks.push({
      id: "card-day-mapping",
      status: "fail",
      message: "Card day index does not match today's cycle day.",
    });
  }

  if (isBeforePublicLaunch(now)) {
    checks.push({
      id: "public-launch-gate",
      status: "info",
      message: `Public play opens on ${formatPublicLaunchLabel()} HKT.`,
    });
  } else if (canAccessMarketPulsePlay("USER", now)) {
    checks.push({
      id: "public-launch-gate",
      status: "pass",
      message: "Public play is open.",
    });
  } else {
    checks.push({
      id: "public-launch-gate",
      status: "fail",
      message: "Public play is not available.",
    });
  }

  const cycleRevealed = isMarketPulseCycleRevealed(
    { status: cycle.status, revealAt: cycleRevealAt },
    now,
  );
  const leaderboardOption = buildLeaderboardCycleOptions(
    {
      id: cycle.id,
      name: cycle.name,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      revealAt: cycle.revealAt,
      status: cycle.status,
    },
    [],
    now,
  )[0];
  const leaderboardState = getLeaderboardViewState(
    leaderboardOption ?? null,
    1,
    false,
  );

  if (!cycleRevealed && leaderboardState === "locked") {
    checks.push({
      id: "leaderboard-locked",
      status: "info",
      message: "Leaderboard remains locked until reveal.",
    });
  } else if (cycleRevealed) {
    checks.push({
      id: "leaderboard-locked",
      status: "pass",
      message: "Leaderboard is available after reveal.",
    });
  } else {
    checks.push({
      id: "leaderboard-locked",
      status: "info",
      message: "Leaderboard remains locked until reveal.",
    });
  }

  const sampleCard =
    (playable ? cards.find((card) => card.id === playable.id) : undefined) ??
    cardForDay;

  if (sampleCard && !cycleRevealed) {
    const payload = getMarketPulseCardPublicPayload(
      toMarketPulseCard(sampleCard),
      {
        cycle: { status: cycle.status, revealAt: cycleRevealAt },
        at: now,
      },
    );
    if (payload.ppaSignal === undefined && payload.ppaInsight === undefined) {
      checks.push({
        id: "ppa-privacy",
        status: "pass",
        message: "PPA remains hidden from players before reveal.",
      });
    } else {
      checks.push({
        id: "ppa-privacy",
        status: "fail",
        message: "PPA would be exposed to players before reveal.",
      });
    }
  } else if (cycleRevealed) {
    checks.push({
      id: "ppa-privacy",
      status: "info",
      message: "Cycle has been revealed — PPA is visible on the reveal page.",
    });
  } else {
    checks.push({
      id: "ppa-privacy",
      status: "info",
      message: "PPA remains hidden from players before reveal.",
    });
  }

  return finalizeReadiness(checks, {
    runtimeStatus: input.runtimeStatus,
    playIssue,
    playable,
    now,
  });
}
