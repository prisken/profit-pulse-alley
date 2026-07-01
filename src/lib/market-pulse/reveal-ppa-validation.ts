import type { MarketPulseCardStatus, MarketPulseCardType } from "@prisma/client";

import {
  buildCardsOnDayCountMap,
  formatMarketPulseCardDayLabel,
  formatMarketPulseDayDisplayNumber,
} from "@/lib/market-pulse/card-play-order";
import { isMarketPulseSignalCard } from "@/lib/market-pulse/card-type";

export type RevealPpaMissingField = "ppaSignal" | "ppaInsight" | "ppaLocked";

export type RevealPpaMissingCard = {
  id: string;
  dayIndex: number;
  sortOrder?: number;
  headline: string;
  companyName: string;
  ticker?: string;
  missing: RevealPpaMissingField[];
};

export type RevealPpaValidationResult =
  | { ready: true }
  | {
      ready: false;
      message: string;
      missingCards: RevealPpaMissingCard[];
    };

export type RevealPpaCardInput = {
  id: string;
  cycleId: string;
  dayIndex: number;
  sortOrder?: number | null;
  headline: string;
  companyName: string;
  status: MarketPulseCardStatus;
  cardType?: MarketPulseCardType | null;
  ppaSignal: string | null;
  ppaInsight: string | null;
  ppaSignalLockedAt: Date | string | null;
};

/** Cards published for the cycle — intended to be scored and revealed. */
export function getPublishedCardsForReveal<T extends Pick<RevealPpaCardInput, "cycleId" | "status">>(
  cycleId: string,
  cards: T[],
): T[] {
  return cards.filter(
    (card) => card.cycleId === cycleId && card.status === "PUBLISHED",
  );
}

/** Published signal cards only — REST cards never require PPA for reveal. */
export function getPublishedSignalCardsForReveal<
  T extends Pick<RevealPpaCardInput, "cycleId" | "status" | "cardType">,
>(cycleId: string, cards: T[]): T[] {
  return getPublishedCardsForReveal(cycleId, cards).filter((card) =>
    isMarketPulseSignalCard(card),
  );
}

export function cardRequiresRevealPpa(
  card: Pick<RevealPpaCardInput, "cardType">,
): boolean {
  return isMarketPulseSignalCard(card);
}

export function getMissingPpaFields(
  card: Pick<
    RevealPpaCardInput,
    "cardType" | "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt"
  >,
): RevealPpaMissingField[] {
  if (!cardRequiresRevealPpa(card)) {
    return [];
  }

  const missing: RevealPpaMissingField[] = [];

  if (!card.ppaSignal) {
    missing.push("ppaSignal");
  }
  if (!card.ppaInsight?.trim()) {
    missing.push("ppaInsight");
  }
  if (!card.ppaSignalLockedAt) {
    missing.push("ppaLocked");
  }

  return missing;
}

function formatMissingCardLabel(
  card: RevealPpaMissingCard,
  cardsOnDay: number,
): string {
  const day = formatMarketPulseDayDisplayNumber(card.dayIndex);
  const sortOrder = card.sortOrder ?? 0;
  if (cardsOnDay > 1) {
    return formatMarketPulseCardDayLabel(card.dayIndex, sortOrder, cardsOnDay)
      .replace(/^Day /, "day ")
      .concat(` (${card.companyName})`);
  }
  return `day ${day} (${card.companyName})`;
}

export function formatRevealPpaBlockMessage(
  missingCards: RevealPpaMissingCard[],
  allPublishedCards?: Pick<RevealPpaMissingCard, "dayIndex">[],
): string {
  if (missingCards.length === 0) {
    return "Cannot reveal yet. Published cards are missing locked PPA insight.";
  }

  const dayCounts = buildCardsOnDayCountMap(allPublishedCards ?? missingCards);

  const labels = missingCards
    .map((card) =>
      formatMissingCardLabel(card, dayCounts.get(card.dayIndex) ?? 1),
    )
    .join(", ");

  return `Cannot reveal yet. ${missingCards.length} card(s) are missing locked PPA insight — ${labels}.`;
}

export function validatePublishedCardsPpaForReveal(
  cycleId: string,
  cards: RevealPpaCardInput[],
): RevealPpaValidationResult {
  const publishedSignalCards = getPublishedSignalCardsForReveal(cycleId, cards);
  const missingCards: RevealPpaMissingCard[] = [];

  for (const card of publishedSignalCards) {
    const missing = getMissingPpaFields(card);
    if (missing.length > 0) {
      missingCards.push({
        id: card.id,
        dayIndex: card.dayIndex,
        sortOrder: card.sortOrder ?? 0,
        headline: card.headline,
        companyName: card.companyName,
        missing,
      });
    }
  }

  if (missingCards.length === 0) {
    return { ready: true };
  }

  return {
    ready: false,
    message: formatRevealPpaBlockMessage(missingCards, publishedSignalCards),
    missingCards,
  };
}
