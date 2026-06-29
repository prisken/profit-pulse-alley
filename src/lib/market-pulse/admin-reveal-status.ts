import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  formatRevealPpaBlockMessage,
  type RevealPpaMissingCard,
  validatePublishedCardsPpaForReveal,
} from "@/lib/market-pulse/reveal-ppa-validation";

export type RevealBlockReason =
  | "no_cycle"
  | "already_revealed"
  | "incomplete_ppa"
  | "reveal_scheduled";

export type RevealReadiness = {
  canReveal: boolean;
  blockReason: RevealBlockReason | null;
  blockMessage: string | null;
  revealAtIso: string | null;
  revealAtPassed: boolean;
  alreadyRevealed: boolean;
  missingPpaCards: RevealPpaMissingCard[];
  scheduledRevealNote: string | null;
};

/** @deprecated Use validatePublishedCardsPpaForReveal — kept for filter tests. */
export function getUnlockedPublishedCards(
  cycleId: string,
  cards: MarketPulseAdminCardRow[],
): MarketPulseAdminCardRow[] {
  return cards.filter(
    (card) =>
      card.cycleId === cycleId &&
      card.status === "PUBLISHED" &&
      !card.ppaSignalLockedAt,
  );
}

export function formatRevealBlockMessage(
  reason: RevealBlockReason,
  context: {
    revealAtLabel?: string;
    missingPpaCards?: RevealPpaMissingCard[];
  } = {},
): string {
  switch (reason) {
    case "no_cycle":
      return "No active cycle.";
    case "already_revealed":
      return "This cycle has already been revealed.";
    case "incomplete_ppa":
      return formatRevealPpaBlockMessage(context.missingPpaCards ?? []);
    case "reveal_scheduled":
      return context.revealAtLabel
        ? `Reveal is not available until ${context.revealAtLabel}.`
        : "Reveal is not available yet.";
    default:
      return "Reveal is not available.";
  }
}

function toRevealPpaCardInput(card: MarketPulseAdminCardRow) {
  return {
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    headline: card.headline,
    companyName: card.companyName,
    status: card.status,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  };
}

export function evaluateRevealReadiness(
  cycle: MarketPulseAdminCycleRow | null,
  cards: MarketPulseAdminCardRow[],
  now: Date = new Date(),
): RevealReadiness {
  if (!cycle) {
    return {
      canReveal: false,
      blockReason: "no_cycle",
      blockMessage: formatRevealBlockMessage("no_cycle"),
      revealAtIso: null,
      revealAtPassed: false,
      alreadyRevealed: false,
      missingPpaCards: [],
      scheduledRevealNote: null,
    };
  }

  const revealAt = new Date(cycle.revealAt);
  const revealAtPassed = now.getTime() >= revealAt.getTime();
  const alreadyRevealed = cycle.status === "REVEALED";
  const ppaValidation = validatePublishedCardsPpaForReveal(
    cycle.id,
    cards.map(toRevealPpaCardInput),
  );
  const missingPpaCards = ppaValidation.ready ? [] : ppaValidation.missingCards;

  const revealAtLabel = revealAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (alreadyRevealed) {
    return {
      canReveal: false,
      blockReason: "already_revealed",
      blockMessage: formatRevealBlockMessage("already_revealed"),
      revealAtIso: cycle.revealAt,
      revealAtPassed,
      alreadyRevealed: true,
      missingPpaCards,
      scheduledRevealNote: null,
    };
  }

  if (!ppaValidation.ready) {
    return {
      canReveal: false,
      blockReason: "incomplete_ppa",
      blockMessage: ppaValidation.message,
      revealAtIso: cycle.revealAt,
      revealAtPassed,
      alreadyRevealed: false,
      missingPpaCards,
      scheduledRevealNote: null,
    };
  }

  const scheduledRevealNote = !revealAtPassed
    ? formatRevealBlockMessage("reveal_scheduled", { revealAtLabel })
    : null;

  return {
    canReveal: true,
    blockReason: null,
    blockMessage: null,
    revealAtIso: cycle.revealAt,
    revealAtPassed,
    alreadyRevealed: false,
    missingPpaCards: [],
    scheduledRevealNote,
  };
}
