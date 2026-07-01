import type { MarketPulseCard, MarketPulseGameRuntimeStatus } from "@prisma/client";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { evaluatePpaRevealWarning } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import { PPA_REVEAL_WARNING_HOURS } from "@/lib/market-pulse/constants";
import { describeCyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import {
  isDemoOrSeedCycleName,
  isMarketPulseProductionDeploy,
} from "@/lib/market-pulse/demo-cycle-guards";
import {
  isMarketPulseRestCard,
  isMarketPulseSignalCard,
} from "@/lib/market-pulse/card-type";
import {
  findCardsForCycleDisplayDay,
  findPlayableCardsForToday,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";
import { isCardReleasedForPlay } from "@/lib/market-pulse/card-release-schedule";
import type { MessageKey } from "@/lib/i18n/messages";

export type TodayCardShellMessage = {
  key: MessageKey;
  params: Record<string, string | number>;
};

export type TodayCardStatus = {
  displayDay: number;
  companyName: string | null;
  status: string;
  tone: "ok" | "warn" | "neutral";
  liveCount: number;
  signalCount: number;
  restCount: number;
  shellMessage: TodayCardShellMessage;
};

export type MarketPulseStatusSnapshot = {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycleName: string | null;
  activeCycleStatus: string | null;
  playerVisible: boolean;
  playerVisibilityReason: string | null;
  todayCard: TodayCardStatus | null;
  revealAt: string | null;
  prizeLabel: string | null;
};

export type PlayabilityAlert = {
  id: string;
  severity: "error" | "warning";
  message: string;
};

function toPlayableCard(card: MarketPulseAdminCardRow): MarketPulseCard {
  return {
    id: card.id,
    status: card.status,
    publishedAt: card.publishedAt ? new Date(card.publishedAt) : null,
    dayIndex: card.dayIndex,
    sortOrder: card.sortOrder,
    createdAt: new Date(card.createdAt),
  } as MarketPulseCard;
}

function buildTodayShellMessage(input: {
  liveCount: number;
  signalCount: number;
  restCount: number;
  signalName: string | null;
}): TodayCardShellMessage {
  if (input.restCount === 1 && input.signalCount === 0) {
    return {
      key: "auth.admin.mp.shell.todayRestCardLive",
      params: {},
    };
  }

  if (input.signalCount === 1 && input.restCount === 0) {
    return {
      key: "auth.admin.mp.shell.todaySignalCardLive",
      params: { name: input.signalName?.trim() || "Signal card" },
    };
  }

  if (input.signalCount > 0 && input.restCount > 0) {
    return {
      key: "auth.admin.mp.shell.todayMixedCardsLive",
      params: {
        count: input.liveCount,
        signalCount: input.signalCount,
        restCount: input.restCount,
      },
    };
  }

  return {
    key: "auth.admin.mp.shell.todayCardsLive",
    params: { count: input.liveCount },
  };
}

export function getTodayCardStatus(
  activeCycle: MarketPulseAdminCycleRow | null,
  activeCycleCards: MarketPulseAdminCardRow[],
  now: Date = new Date(),
): TodayCardStatus | null {
  if (!activeCycle) {
    return null;
  }

  const startsAt = new Date(activeCycle.startsAt);
  const revealAt = new Date(activeCycle.revealAt);
  const displayDay = getCycleDisplayDay(startsAt, now);
  const playable = findPlayableCardsForToday(
    {
      startsAt,
      revealAt,
      cards: activeCycleCards.map(toPlayableCard),
    },
    now,
  );

  const playableIds = new Set(playable.map((card) => card.id));
  const liveCards = activeCycleCards.filter((card) => playableIds.has(card.id));

  if (liveCards.length > 0) {
    const signalCards = liveCards.filter((card) => isMarketPulseSignalCard(card));
    const restCards = liveCards.filter((card) => isMarketPulseRestCard(card));

    return {
      displayDay,
      companyName: signalCards[0]?.companyName ?? null,
      status: "PUBLISHED",
      tone: "ok",
      liveCount: liveCards.length,
      signalCount: signalCards.length,
      restCount: restCards.length,
      shellMessage: buildTodayShellMessage({
        liveCount: liveCards.length,
        signalCount: signalCards.length,
        restCount: restCards.length,
        signalName: signalCards[0]?.companyName ?? signalCards[0]?.headline ?? null,
      }),
    };
  }

  const cardsForDay = findCardsForCycleDisplayDay(
    activeCycleCards.map(toPlayableCard),
    startsAt,
    now,
  );
  const cardForDay = cardsForDay[0];

  if (!cardForDay) {
    return {
      displayDay,
      companyName: null,
      status: "missing",
      tone: "warn",
      liveCount: 0,
      signalCount: 0,
      restCount: 0,
      shellMessage: {
        key: "auth.admin.mp.shell.todayCardMissing",
        params: { day: displayDay },
      },
    };
  }

  const source = activeCycleCards.find((card) => card.id === cardForDay.id);

  if (cardForDay.status !== "PUBLISHED") {
    return {
      displayDay,
      companyName: source?.companyName ?? null,
      status: cardForDay.status,
      tone: "warn",
      liveCount: 0,
      signalCount: 0,
      restCount: 0,
      shellMessage: {
        key: "auth.admin.mp.shell.todayCardIssue",
        params: { day: displayDay, status: cardForDay.status },
      },
    };
  }

  if (
    !isCardReleasedForPlay(
      {
        status: cardForDay.status,
        publishedAt: cardForDay.publishedAt,
        dayIndex: cardForDay.dayIndex,
      },
      { startsAt },
      now,
    )
  ) {
    return {
      displayDay,
      companyName: source?.companyName ?? null,
      status: "scheduled",
      tone: "warn",
      liveCount: 0,
      signalCount: 0,
      restCount: 0,
      shellMessage: {
        key: "auth.admin.mp.shell.todayCardIssue",
        params: { day: displayDay, status: "scheduled" },
      },
    };
  }

  return {
    displayDay,
    companyName: source?.companyName ?? null,
    status: cardForDay.status,
    tone: "neutral",
    liveCount: 0,
    signalCount: 0,
    restCount: 0,
    shellMessage: {
      key: "auth.admin.mp.shell.todayCardIssue",
      params: { day: displayDay, status: cardForDay.status },
    },
  };
}

export function buildMarketPulseStatusSnapshot(input: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  activeCycleCards: MarketPulseAdminCardRow[];
  now?: Date;
}): MarketPulseStatusSnapshot {
  const now = input.now ?? new Date();
  const { activeCycle } = input;
  const runtimeOpen = input.runtimeStatus === "OPEN";

  let playerVisibilityReason: string | null = null;
  if (!runtimeOpen) {
    playerVisibilityReason = `Runtime is ${input.runtimeStatus}.`;
  } else if (!activeCycle) {
    playerVisibilityReason = "No active cycle.";
  } else if (!activeCycle.isPlayableNow && activeCycle.playabilityIssue) {
    playerVisibilityReason = activeCycle.playabilityIssue;
  }

  return {
    runtimeStatus: input.runtimeStatus,
    activeCycleName: activeCycle?.name ?? null,
    activeCycleStatus: activeCycle?.status ?? null,
    playerVisible: runtimeOpen && (activeCycle?.isPlayableNow ?? false),
    playerVisibilityReason,
    todayCard: getTodayCardStatus(activeCycle, input.activeCycleCards, now),
    revealAt: activeCycle?.revealAt ?? null,
    prizeLabel: activeCycle?.prizeLabel ?? null,
  };
}

export function buildMarketPulsePlayabilityAlerts(input: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  activeCycleCards: MarketPulseAdminCardRow[];
  now?: Date;
}): PlayabilityAlert[] {
  const now = input.now ?? new Date();
  const alerts: PlayabilityAlert[] = [];

  if (input.runtimeStatus !== "OPEN") {
    alerts.push({
      id: "runtime-not-open",
      severity: "error",
      message: `Game runtime is ${input.runtimeStatus}. Players cannot play until runtime is OPEN.`,
    });
  }

  if (!input.activeCycle) {
    alerts.push({
      id: "no-active-cycle",
      severity: "error",
      message: "No active cycle is set. Create a cycle and mark it active.",
    });
    return alerts;
  }

  const cycle = input.activeCycle;

  if (isDemoOrSeedCycleName(cycle.name)) {
    alerts.push({
      id: "demo-cycle-active",
      severity: isMarketPulseProductionDeploy() ? "error" : "warning",
      message: `Active cycle "${cycle.name}" is demo or local seed data. Public players will not see it in production until you pin a real cycle.`,
    });
  }

  if (!cycle.isPlayableNow && cycle.playabilityIssue) {
    alerts.push({
      id: "cycle-not-playable",
      severity: "warning",
      message: cycle.playabilityIssue,
    });
  }

  const today = getTodayCardStatus(cycle, input.activeCycleCards, now);
  if (today && today.tone === "warn") {
    const detail =
      today.status === "missing"
        ? `No playable card for day ${today.displayDay}.`
        : `Today's playable card(s) for day ${today.displayDay} are not ready (${today.status}).`;
    alerts.push({
      id: "today-card-issue",
      severity: "warning",
      message: detail,
    });
  }

  const unpublished = input.activeCycleCards.filter(
    (card) => card.status !== "PUBLISHED",
  );
  if (unpublished.length > 0) {
    alerts.push({
      id: "unpublished-cards",
      severity: "warning",
      message: `${unpublished.length} card(s) on the active cycle are not PUBLISHED.`,
    });
  }

  const ppaWarning = evaluatePpaRevealWarning({
    activeCycle: cycle,
    cards: input.activeCycleCards,
    now,
  });

  if (ppaWarning.severity === "urgent" && ppaWarning.missingCards.length > 0) {
    const revealLabel =
      ppaWarning.revealAtIso != null
        ? new Date(ppaWarning.revealAtIso).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—";
    alerts.push({
      id: "ppa-urgent",
      severity: "error",
      message: `Reveal is scheduled for ${revealLabel}. ${ppaWarning.missingCards.length} signal card(s) are missing locked PPA insight (within ${PPA_REVEAL_WARNING_HOURS} hours).`,
    });
  }

  if (ppaWarning.severity === "setup" && ppaWarning.missingCards.length > 0) {
    const hoursLabel =
      ppaWarning.hoursUntilReveal != null
        ? Math.ceil(ppaWarning.hoursUntilReveal)
        : null;
    alerts.push({
      id: "ppa-setup",
      severity: "warning",
      message:
        hoursLabel != null
          ? `${ppaWarning.missingCards.length} signal card(s) need locked PPA insight before reveal (scheduled in about ${hoursLabel} hours).`
          : `${ppaWarning.missingCards.length} signal card(s) need locked PPA insight before reveal.`,
    });
  }

  if (cycle.status !== "OPEN" && input.runtimeStatus === "OPEN") {
    alerts.push({
      id: "cycle-status-not-open",
      severity: "warning",
      message: describeCyclePlayabilityIssue("not_open"),
    });
  }

  return alerts;
}
