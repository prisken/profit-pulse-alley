import type { MarketPulseCycleStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { isMarketPulseRestCard, isMarketPulseSignalCard } from "@/lib/market-pulse/card-type";
import {
  getGuidedCardStatus,
  type GuidedCardStatus,
} from "@/lib/market-pulse/guided-card-status";

export const GUIDED_LAUNCH_ELIGIBLE_STATUSES: MarketPulseCycleStatus[] = [
  "DRAFT",
  "OPEN",
];

export type GuidedLaunchSummary = {
  totalCards: number;
  signalReady: number;
  signalTotal: number;
  restReady: number;
  restTotal: number;
  missingContentCount: number;
  missingPpaCount: number;
  publishedCount: number;
  unpublishedReadyCount: number;
};

export type GuidedLaunchReadinessResult = {
  ready: boolean;
  reasons: string[];
  summary: GuidedLaunchSummary;
};

export type GuidedLaunchEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

export type GuidedLaunchCompleteInput = {
  cycleStatus: MarketPulseCycleStatus;
  activeCycleId: string | null;
  runtimeStatus: string;
  cycleId: string;
  cards: Pick<MarketPulseAdminCardRow, "status">[];
};

export function isGuidedCardLaunchReady(
  card: Pick<MarketPulseAdminCardRow, "status"> & Parameters<typeof getGuidedCardStatus>[0],
): boolean {
  if (isCardPublished(card)) {
    return true;
  }

  return getGuidedCardStatus(card) === "ready";
}

function emptySummary(): GuidedLaunchSummary {
  return {
    totalCards: 0,
    signalReady: 0,
    signalTotal: 0,
    restReady: 0,
    restTotal: 0,
    missingContentCount: 0,
    missingPpaCount: 0,
    publishedCount: 0,
    unpublishedReadyCount: 0,
  };
}

export function buildGuidedLaunchSummary(
  cards: MarketPulseAdminCardRow[],
): GuidedLaunchSummary {
  const summary = emptySummary();
  summary.totalCards = cards.length;

  for (const card of cards) {
    const status = getGuidedCardStatus(card);
    const launchReady = isGuidedCardLaunchReady(card);
    const signal = isMarketPulseSignalCard(card);
    const rest = isMarketPulseRestCard(card);

    if (signal) {
      summary.signalTotal += 1;
      if (launchReady) {
        summary.signalReady += 1;
      }
    }
    if (rest) {
      summary.restTotal += 1;
      if (launchReady) {
        summary.restReady += 1;
      }
    }

    if (isCardPublished(card)) {
      summary.publishedCount += 1;
    } else if (status === "ready") {
      summary.unpublishedReadyCount += 1;
    }

    if (status === "missing_content") {
      summary.missingContentCount += 1;
    } else if (status === "missing_ppa") {
      summary.missingPpaCount += 1;
    }
  }

  return summary;
}

export function evaluateGuidedLaunchEligibility(input: {
  status: MarketPulseCycleStatus;
}): GuidedLaunchEligibilityResult {
  if (input.status === "ARCHIVED") {
    return {
      eligible: false,
      reasons: ["Archived cycles cannot be launched."],
    };
  }

  if (input.status === "CLOSED") {
    return {
      eligible: false,
      reasons: ["Closed cycles cannot be launched from the guided launcher."],
    };
  }

  if (input.status === "REVEALED") {
    return {
      eligible: false,
      reasons: ["Revealed cycles cannot be launched from the guided launcher."],
    };
  }

  if (!GUIDED_LAUNCH_ELIGIBLE_STATUSES.includes(input.status)) {
    return {
      eligible: false,
      reasons: ["This cycle cannot be launched from the guided launcher."],
    };
  }

  return { eligible: true, reasons: [] };
}

export function evaluateGuidedLaunchReadiness(
  cards: MarketPulseAdminCardRow[],
): GuidedLaunchReadinessResult {
  const summary = buildGuidedLaunchSummary(cards);
  const reasons: string[] = [];

  if (summary.totalCards === 0) {
    reasons.push("There are no cards in this cycle.");
  }

  const signalMissingContent = cards.some(
    (card) =>
      isMarketPulseSignalCard(card) &&
      getGuidedCardStatus(card) === "missing_content",
  );
  if (signalMissingContent) {
    reasons.push("Some signal cards are missing content.");
  }

  const signalMissingPpa = cards.some(
    (card) =>
      isMarketPulseSignalCard(card) &&
      getGuidedCardStatus(card) === "missing_ppa",
  );
  if (signalMissingPpa) {
    reasons.push("Some signal cards still need PPA approval.");
  }

  const restMissingContent = cards.some(
    (card) =>
      isMarketPulseRestCard(card) &&
      getGuidedCardStatus(card) === "missing_content",
  );
  if (restMissingContent) {
    reasons.push("Some rest cards are missing content.");
  }

  const allLaunchReady = cards.length > 0 && cards.every(isGuidedCardLaunchReady);

  return {
    ready: allLaunchReady && reasons.length === 0,
    reasons,
    summary,
  };
}

export function isGuidedLaunchAlreadyComplete(
  input: GuidedLaunchCompleteInput,
): boolean {
  if (input.cycleStatus !== "OPEN") {
    return false;
  }
  if (input.activeCycleId !== input.cycleId) {
    return false;
  }
  if (input.runtimeStatus !== "OPEN") {
    return false;
  }
  if (input.cards.length === 0) {
    return false;
  }

  return input.cards.every((card) => isCardPublished(card));
}

export function canShowGuidedLaunchHubLink(
  status: MarketPulseCycleStatus,
): boolean {
  return GUIDED_LAUNCH_ELIGIBLE_STATUSES.includes(status);
}

export function guidedStatusBlocksLaunch(status: GuidedCardStatus): boolean {
  return status === "missing_content" || status === "missing_ppa";
}
