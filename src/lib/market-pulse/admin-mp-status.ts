import type { MarketPulseCard, MarketPulseGameRuntimeStatus } from "@prisma/client";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { evaluatePpaRevealWarning } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import { PPA_REVEAL_WARNING_HOURS } from "@/lib/market-pulse/constants";
import { describeCyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import {
  findPlayableCardForToday,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";

export type TodayCardStatus = {
  displayDay: number;
  companyName: string | null;
  status: string;
  tone: "ok" | "warn" | "neutral";
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
  } as MarketPulseCard;
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
  const displayDay = getCycleDisplayDay(startsAt, now);
  const playable = findPlayableCardForToday(
    {
      startsAt,
      cards: activeCycleCards.map(toPlayableCard),
    },
    now,
  );

  if (playable) {
    const source = activeCycleCards.find((card) => card.id === playable.id);
    return {
      displayDay,
      companyName: source?.companyName ?? null,
      status: playable.status,
      tone: "ok",
    };
  }

  const cardForDay = activeCycleCards.find(
    (card) => card.dayIndex === displayDay || card.dayIndex === displayDay - 1,
  );

  if (!cardForDay) {
    return {
      displayDay,
      companyName: null,
      status: "missing",
      tone: "warn",
    };
  }

  if (cardForDay.status !== "PUBLISHED") {
    return {
      displayDay,
      companyName: cardForDay.companyName,
      status: cardForDay.status,
      tone: "warn",
    };
  }

  if (!cardForDay.publishedAt || new Date(cardForDay.publishedAt) > now) {
    return {
      displayDay,
      companyName: cardForDay.companyName,
      status: "scheduled",
      tone: "warn",
    };
  }

  return {
    displayDay,
    companyName: cardForDay.companyName,
    status: cardForDay.status,
    tone: "neutral",
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

  if (!cycle.isPlayableNow && cycle.playabilityIssue) {
    alerts.push({
      id: "cycle-not-playable",
      severity: "warning",
      message: cycle.playabilityIssue,
    });
  }

  const today = getTodayCardStatus(cycle, input.activeCycleCards, now);
  if (today && (today.status === "missing" || today.tone === "warn")) {
    const detail =
      today.status === "missing"
        ? `No card for day ${today.displayDay}.`
        : `Today's card (day ${today.displayDay}) is ${today.status}.`;
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
      message: `Reveal is scheduled for ${revealLabel}. ${ppaWarning.missingCards.length} card(s) are missing locked PPA insight (within ${PPA_REVEAL_WARNING_HOURS} hours).`,
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
          ? `${ppaWarning.missingCards.length} card(s) need locked PPA insight before reveal (scheduled in about ${hoursLabel} hours).`
          : `${ppaWarning.missingCards.length} card(s) need locked PPA insight before reveal.`,
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
