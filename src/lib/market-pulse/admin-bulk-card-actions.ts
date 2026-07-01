import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { getBuilderCardValidationStatus } from "@/lib/market-pulse/admin-builder-card-status";
import { getCardSchedulingPublishBlockReason } from "@/lib/market-pulse/admin-card-scheduling";
import { validateCardPublishable } from "@/lib/market-pulse/card-validation";

export type BulkCardActionSkip = {
  cardId: string;
  dayIndex: number;
  headline: string;
  reason: string;
};

export type BulkCardActionTarget = {
  cardId: string;
  dayIndex: number;
  headline: string;
};

export type BulkPublishPlan = {
  publishable: BulkCardActionTarget[];
  skipped: BulkCardActionSkip[];
};

export type BulkUnpublishPlan = {
  unpublishable: BulkCardActionTarget[];
  skipped: BulkCardActionSkip[];
};

export type BulkPublishCardsResult = {
  publishedCount: number;
  skippedCount: number;
  publishedCardIds: string[];
  skipped: BulkCardActionSkip[];
};

export type BulkUnpublishCardsResult = {
  unpublishedCount: number;
  skippedCount: number;
  unpublishedCardIds: string[];
  skipped: BulkCardActionSkip[];
};

export function getCardPublishBlockReason(
  card: MarketPulseAdminCardRow,
  context?: {
    cycle?: { startsAt: Date | string; endsAt: Date | string };
    allCards?: MarketPulseAdminCardRow[];
  },
): string | null {
  if (isCardPublished(card)) {
    return "Already published.";
  }

  const contentReason = validateCardPublishable({
    cardType: card.cardType,
    headline: card.headline,
    companyName: card.companyName,
    ticker: card.ticker,
    summary: card.summary,
    newsBody: card.newsBody,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  });
  if (contentReason) {
    return contentReason;
  }

  if (context?.cycle && context.allCards) {
    return getCardSchedulingPublishBlockReason(card, context.cycle, context.allCards);
  }

  return null;
}

export function getCardUnpublishBlockReason(
  card: Pick<MarketPulseAdminCardRow, "status" | "decisionCount">,
): string | null {
  if (!isCardPublished(card)) {
    return "Card is not published.";
  }

  if (card.decisionCount > 0) {
    return "Cannot unpublish: players have already submitted decisions on this card.";
  }

  return null;
}

export function isCardReadyToPublish(card: MarketPulseAdminCardRow): boolean {
  return getBuilderCardValidationStatus(card) === "ready_to_publish";
}

export function getReadyToPublishCards(
  cards: MarketPulseAdminCardRow[],
): MarketPulseAdminCardRow[] {
  return cards.filter(isCardReadyToPublish);
}

function toTarget(card: MarketPulseAdminCardRow): BulkCardActionTarget {
  return {
    cardId: card.id,
    dayIndex: card.dayIndex,
    headline: card.headline,
  };
}

function toSkip(card: MarketPulseAdminCardRow, reason: string): BulkCardActionSkip {
  return {
    cardId: card.id,
    dayIndex: card.dayIndex,
    headline: card.headline,
    reason,
  };
}

export function planBulkPublish(
  cards: MarketPulseAdminCardRow[],
  cardIds: string[],
  cycle?: { startsAt: Date | string; endsAt: Date | string },
): BulkPublishPlan {
  const selectedIds = new Set(cardIds);
  const selected = cards.filter((card) => selectedIds.has(card.id));
  const publishable: BulkCardActionTarget[] = [];
  const skipped: BulkCardActionSkip[] = [];
  const publishContext = cycle ? { cycle, allCards: cards } : undefined;

  for (const card of selected) {
    const reason = getCardPublishBlockReason(card, publishContext);
    if (reason) {
      skipped.push(toSkip(card, reason));
    } else {
      publishable.push(toTarget(card));
    }
  }

  const missingIds = cardIds.filter(
    (id) => !cards.some((card) => card.id === id),
  );
  for (const cardId of missingIds) {
    skipped.push({
      cardId,
      dayIndex: 0,
      headline: "Unknown card",
      reason: "Card not found in this cycle.",
    });
  }

  return { publishable, skipped };
}

export function planBulkUnpublish(
  cards: MarketPulseAdminCardRow[],
  cardIds: string[],
): BulkUnpublishPlan {
  const selectedIds = new Set(cardIds);
  const selected = cards.filter((card) => selectedIds.has(card.id));
  const unpublishable: BulkCardActionTarget[] = [];
  const skipped: BulkCardActionSkip[] = [];

  for (const card of selected) {
    const reason = getCardUnpublishBlockReason(card);
    if (reason) {
      skipped.push(toSkip(card, reason));
    } else {
      unpublishable.push(toTarget(card));
    }
  }

  const missingIds = cardIds.filter(
    (id) => !cards.some((card) => card.id === id),
  );
  for (const cardId of missingIds) {
    skipped.push({
      cardId,
      dayIndex: 0,
      headline: "Unknown card",
      reason: "Card not found in this cycle.",
    });
  }

  return { unpublishable, skipped };
}

export function formatBulkPublishMessage(result: BulkPublishCardsResult): string {
  if (result.publishedCount === 0 && result.skippedCount === 0) {
    return "No cards were selected.";
  }

  if (result.publishedCount === 0) {
    return `Published 0 cards. ${result.skippedCount} skipped.`;
  }

  if (result.skippedCount === 0) {
    return `Published ${result.publishedCount} card(s).`;
  }

  return `Published ${result.publishedCount} card(s). ${result.skippedCount} skipped.`;
}

export function formatBulkUnpublishMessage(
  result: BulkUnpublishCardsResult,
): string {
  if (result.unpublishedCount === 0 && result.skippedCount === 0) {
    return "No cards were selected.";
  }

  if (result.unpublishedCount === 0) {
    return `Unpublished 0 cards. ${result.skippedCount} skipped.`;
  }

  if (result.skippedCount === 0) {
    return `Unpublished ${result.unpublishedCount} card(s).`;
  }

  return `Unpublished ${result.unpublishedCount} card(s). ${result.skippedCount} skipped.`;
}
