import type { MarketPulseCycleStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { isMarketPulseRestCard, isMarketPulseSignalCard } from "@/lib/market-pulse/card-type";
import {
  getGuidedCardStatus,
  isGuidedPpaApproved,
  type GuidedCardStatus,
} from "@/lib/market-pulse/guided-card-status";
import {
  evaluateGuidedLaunchEligibility,
  evaluateGuidedLaunchReadiness,
} from "@/lib/market-pulse/guided-launch-readiness";

export type GuidedLaunchPreviewCardRow = {
  id: string;
  cardType: "SIGNAL" | "REST";
  headline: string;
  companyName: string | null;
  ticker: string | null;
  status: GuidedCardStatus;
  isPpaApproved: boolean | null;
  isPublished: boolean;
};

export type GuidedLaunchPreview = {
  cycleId: string;
  cycleStatus: MarketPulseCycleStatus;
  totalCards: number;
  signalCount: number;
  restCount: number;
  readyCount: number;
  publishedCount: number;
  cardsByStatus: Record<GuidedCardStatus, number>;
  missingContentCount: number;
  missingPpaCount: number;
  launchAllowed: boolean;
  blockingReasons: string[];
  cardRows: GuidedLaunchPreviewCardRow[];
};

export type GuidedLaunchPreviewInput = {
  cycle: {
    id: string;
    status: MarketPulseCycleStatus;
  };
  cards: MarketPulseAdminCardRow[];
};

function emptyCardsByStatus(): Record<GuidedCardStatus, number> {
  return {
    published: 0,
    missing_content: 0,
    missing_ppa: 0,
    ready: 0,
  };
}

function buildPreviewCardRow(card: MarketPulseAdminCardRow): GuidedLaunchPreviewCardRow {
  const signal = isMarketPulseSignalCard(card);

  return {
    id: card.id,
    cardType: signal ? "SIGNAL" : "REST",
    headline: card.headline,
    companyName: signal ? card.companyName : null,
    ticker: signal ? card.ticker : null,
    status: getGuidedCardStatus(card),
    isPpaApproved: signal ? isGuidedPpaApproved(card) : null,
    isPublished: isCardPublished(card),
  };
}

export function getGuidedLaunchPreview(
  input: GuidedLaunchPreviewInput,
): GuidedLaunchPreview {
  const { cycle, cards } = input;
  const eligibility = evaluateGuidedLaunchEligibility({ status: cycle.status });
  const readiness = evaluateGuidedLaunchReadiness(cards);

  const cardsByStatus = emptyCardsByStatus();
  let signalCount = 0;
  let restCount = 0;
  let readyCount = 0;
  let publishedCount = 0;

  for (const card of cards) {
    const status = getGuidedCardStatus(card);
    cardsByStatus[status] += 1;

    if (isMarketPulseSignalCard(card)) {
      signalCount += 1;
    }
    if (isMarketPulseRestCard(card)) {
      restCount += 1;
    }
    if (status === "ready") {
      readyCount += 1;
    }
    if (isCardPublished(card)) {
      publishedCount += 1;
    }
  }

  const blockingReasons = [
    ...eligibility.reasons,
    ...(eligibility.eligible ? readiness.reasons : []),
  ];

  return {
    cycleId: cycle.id,
    cycleStatus: cycle.status,
    totalCards: cards.length,
    signalCount,
    restCount,
    readyCount,
    publishedCount,
    cardsByStatus,
    missingContentCount: readiness.summary.missingContentCount,
    missingPpaCount: readiness.summary.missingPpaCount,
    launchAllowed: eligibility.eligible && readiness.ready,
    blockingReasons,
    cardRows: cards.map(buildPreviewCardRow),
  };
}

export const GUIDED_LAUNCH_PREVIEW_PPA_FIELD_KEYS = [
  "ppaSignal",
  "ppaInsight",
  "ppaSignalLockedAt",
] as const;

export function guidedLaunchPreviewRowExcludesPpaFields(
  row: GuidedLaunchPreviewCardRow,
): boolean {
  return GUIDED_LAUNCH_PREVIEW_PPA_FIELD_KEYS.every(
    (key) => !(key in row),
  );
}
