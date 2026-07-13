import type { MarketPulseCycleStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import {
  isMarketPulseSignalCard,
} from "@/lib/market-pulse/card-type";
import { getGuidedCardFieldReadiness } from "@/lib/market-pulse/guided-card-field-readiness";
import {
  getGuidedCardStatus,
  type GuidedCardStatus,
} from "@/lib/market-pulse/guided-card-status";
import { GUIDED_LAUNCH_ELIGIBLE_STATUSES } from "@/lib/market-pulse/guided-launch-readiness";

export type GuidedCardDashboardFocusReason =
  | "missing_ppa"
  | "missing_content"
  | "save_blocking"
  | "unpublished_ready";

export type GuidedHubProgressSummary = {
  totalCards: number;
  readyCount: number;
  publishedCount: number;
  missingContentCount: number;
  missingPpaCount: number;
  saveBlockingCount: number;
  nextSuggestedFocusReason: GuidedCardDashboardFocusReason | null;
};

export type GuidedCardDashboardFocus = {
  cardId: string;
  reason: GuidedCardDashboardFocusReason;
};

export type GuidedCardDashboardRow = {
  id: string;
  dayIndex: number;
  cardType: "SIGNAL" | "REST";
  status: GuidedCardStatus;
  isPublished: boolean;
  missingContentCount: number;
  missingPpaCount: number;
  saveBlockingCount: number;
  isSaveBlocking: boolean;
};

export type GuidedCardDashboardFilter =
  | "all"
  | "missing_content"
  | "missing_ppa"
  | "ready"
  | "published"
  | "signal"
  | "rest";

export type GuidedCardDashboard = {
  totalCards: number;
  signalCount: number;
  restCount: number;
  publishedCount: number;
  readyCount: number;
  missingContentCount: number;
  missingPpaCount: number;
  saveBlockingCount: number;
  cardsByStatus: Record<GuidedCardStatus, number>;
  cardRows: GuidedCardDashboardRow[];
  nextSuggestedFocus: GuidedCardDashboardFocus | null;
};

export const GUIDED_CARD_DASHBOARD_SENSITIVE_FIELD_MARKERS = [
  "ppaSignal",
  "ppaInsight",
  "ppaSignalLockedAt",
  "newsBody",
  "body",
  "imageUrl",
  "imageAltText",
  "cardImageUrl",
  "cardImageAlt",
] as const;

export const GUIDED_HUB_PROGRESS_SENSITIVE_FIELD_MARKERS = [
  ...GUIDED_CARD_DASHBOARD_SENSITIVE_FIELD_MARKERS,
  "cardId",
  "cardRows",
  "cardsByStatus",
] as const;

function canShowGuidedHubProgress(status: MarketPulseCycleStatus): boolean {
  return GUIDED_LAUNCH_ELIGIBLE_STATUSES.includes(status);
}

export function buildGuidedHubProgressSummary(input: {
  cycleStatus: MarketPulseCycleStatus;
  cards: MarketPulseAdminCardRow[];
}): GuidedHubProgressSummary | null {
  if (!canShowGuidedHubProgress(input.cycleStatus)) {
    return null;
  }

  const dashboard = getGuidedCardDashboard(input.cards);

  return {
    totalCards: dashboard.totalCards,
    readyCount: dashboard.readyCount,
    publishedCount: dashboard.publishedCount,
    missingContentCount: dashboard.missingContentCount,
    missingPpaCount: dashboard.missingPpaCount,
    saveBlockingCount: dashboard.saveBlockingCount,
    nextSuggestedFocusReason: dashboard.nextSuggestedFocus?.reason ?? null,
  };
}

export function guidedHubProgressExcludesSensitiveFields(
  summary: GuidedHubProgressSummary,
): boolean {
  const serialized = JSON.stringify(summary);

  return GUIDED_HUB_PROGRESS_SENSITIVE_FIELD_MARKERS.every(
    (marker) => !serialized.includes(marker),
  );
}

export function enrichCycleRowsWithGuidedProgress<
  T extends { id: string; status: MarketPulseCycleStatus },
>(
  cycles: T[],
  cardsByCycleId: Map<string, MarketPulseAdminCardRow[]>,
): Array<T & { guidedProgress: GuidedHubProgressSummary | null }> {
  return cycles.map((cycle) => ({
    ...cycle,
    guidedProgress: buildGuidedHubProgressSummary({
      cycleStatus: cycle.status,
      cards: cardsByCycleId.get(cycle.id) ?? [],
    }),
  }));
}

function emptyCardsByStatus(): Record<GuidedCardStatus, number> {
  return {
    published: 0,
    missing_content: 0,
    missing_ppa: 0,
    ready: 0,
  };
}

function buildDashboardRow(card: MarketPulseAdminCardRow): GuidedCardDashboardRow {
  const readiness = getGuidedCardFieldReadiness(card);
  const status = getGuidedCardStatus(card);
  const isPublished = isCardPublished(card);
  const missingContentCount = readiness.missingContentFields.length;
  const missingPpaCount = readiness.missingPpaFields.length;
  const saveBlockingCount = readiness.missingSaveFields.length;

  return {
    id: card.id,
    dayIndex: card.dayIndex,
    cardType: isMarketPulseSignalCard(card) ? "SIGNAL" : "REST",
    status,
    isPublished,
    missingContentCount,
    missingPpaCount,
    saveBlockingCount,
    isSaveBlocking: saveBlockingCount > 0,
  };
}

function pickNextSuggestedFocus(
  rows: GuidedCardDashboardRow[],
): GuidedCardDashboardFocus | null {
  for (const row of rows) {
    if (row.cardType === "SIGNAL" && row.status === "missing_ppa") {
      return { cardId: row.id, reason: "missing_ppa" };
    }
  }

  for (const row of rows) {
    if (row.status === "missing_content") {
      return { cardId: row.id, reason: "missing_content" };
    }
  }

  for (const row of rows) {
    if (row.isSaveBlocking) {
      return { cardId: row.id, reason: "save_blocking" };
    }
  }

  for (const row of rows) {
    if (!row.isPublished && row.status === "ready") {
      return { cardId: row.id, reason: "unpublished_ready" };
    }
  }

  return null;
}

export function getGuidedCardDashboard(
  cards: MarketPulseAdminCardRow[],
): GuidedCardDashboard {
  const cardsByStatus = emptyCardsByStatus();
  const cardRows = cards.map(buildDashboardRow);

  let signalCount = 0;
  let restCount = 0;
  let publishedCount = 0;
  let readyCount = 0;
  let missingContentCount = 0;
  let missingPpaCount = 0;
  let saveBlockingCount = 0;

  for (const row of cardRows) {
    cardsByStatus[row.status] += 1;

    if (row.cardType === "SIGNAL") {
      signalCount += 1;
    } else {
      restCount += 1;
    }

    if (row.isPublished) {
      publishedCount += 1;
    }

    if (row.status === "ready") {
      readyCount += 1;
    }

    if (row.status === "missing_content") {
      missingContentCount += 1;
    }

    if (row.cardType === "SIGNAL" && row.status === "missing_ppa") {
      missingPpaCount += 1;
    }

    if (row.isSaveBlocking) {
      saveBlockingCount += 1;
    }
  }

  return {
    totalCards: cardRows.length,
    signalCount,
    restCount,
    publishedCount,
    readyCount,
    missingContentCount,
    missingPpaCount,
    saveBlockingCount,
    cardsByStatus,
    cardRows,
    nextSuggestedFocus: pickNextSuggestedFocus(cardRows),
  };
}

export function filterGuidedCycleCardDashboardRows(
  rows: GuidedCardDashboardRow[],
  filter: GuidedCardDashboardFilter,
): GuidedCardDashboardRow[] {
  if (filter === "all") {
    return rows;
  }

  return rows.filter((row) => {
    switch (filter) {
      case "missing_content":
        return row.status === "missing_content";
      case "missing_ppa":
        return row.cardType === "SIGNAL" && row.status === "missing_ppa";
      case "ready":
        return row.status === "ready";
      case "published":
        return row.isPublished;
      case "signal":
        return row.cardType === "SIGNAL";
      case "rest":
        return row.cardType === "REST";
      default:
        return true;
    }
  });
}

export function guidedCardDashboardExcludesSensitiveFields(
  dashboard: GuidedCardDashboard,
): boolean {
  const serialized = JSON.stringify(dashboard);

  return GUIDED_CARD_DASHBOARD_SENSITIVE_FIELD_MARKERS.every(
    (marker) => !serialized.includes(marker),
  );
}
