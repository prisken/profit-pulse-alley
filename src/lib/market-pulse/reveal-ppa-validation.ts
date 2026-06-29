import type { MarketPulseCardStatus } from "@prisma/client";

export type RevealPpaMissingField = "ppaSignal" | "ppaInsight" | "ppaLocked";

export type RevealPpaMissingCard = {
  id: string;
  dayIndex: number;
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
  headline: string;
  companyName: string;
  status: MarketPulseCardStatus;
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

export function getMissingPpaFields(
  card: Pick<RevealPpaCardInput, "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt">,
): RevealPpaMissingField[] {
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

export function formatRevealPpaBlockMessage(
  missingCards: RevealPpaMissingCard[],
): string {
  if (missingCards.length === 0) {
    return "Cannot reveal yet. Published cards are missing locked PPA insight.";
  }

  const labels = missingCards
    .map((card) => `day ${card.dayIndex} (${card.companyName})`)
    .join(", ");

  return `Cannot reveal yet. ${missingCards.length} card(s) are missing locked PPA insight — ${labels}.`;
}

export function validatePublishedCardsPpaForReveal(
  cycleId: string,
  cards: RevealPpaCardInput[],
): RevealPpaValidationResult {
  const published = getPublishedCardsForReveal(cycleId, cards);
  const missingCards: RevealPpaMissingCard[] = [];

  for (const card of published) {
    const missing = getMissingPpaFields(card);
    if (missing.length > 0) {
      missingCards.push({
        id: card.id,
        dayIndex: card.dayIndex,
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
    message: formatRevealPpaBlockMessage(missingCards),
    missingCards,
  };
}
