/**
 * Admin-only PPA reveal readiness helpers.
 * Players can decide before PPA is complete; these utilities warn admins when
 * revealAt is within PPA_REVEAL_WARNING_HOURS and published cards lack locked PPA.
 */
import { PPA_REVEAL_WARNING_HOURS } from "@/lib/market-pulse/constants";
import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  validatePublishedCardsPpaForReveal,
  type RevealPpaMissingField,
} from "@/lib/market-pulse/reveal-ppa-validation";

const MS_PER_HOUR = 60 * 60 * 1000;

export type PpaRevealWarningCard = {
  id: string;
  dayIndex: number;
  ticker: string;
  headline: string;
  companyName: string;
  missing: RevealPpaMissingField[];
};

export type PpaRevealWarningSeverity = "none" | "setup" | "urgent" | "complete";

export type PpaRevealWarningEvaluation = {
  severity: PpaRevealWarningSeverity;
  revealAtIso: string | null;
  hoursUntilReveal: number | null;
  missingCards: PpaRevealWarningCard[];
};

function toRevealPpaCardInput(card: MarketPulseAdminCardRow) {
  return {
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    headline: card.headline,
    companyName: card.companyName,
    status: card.status,
    cardType: card.cardType,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  };
}

export function getHoursUntilReveal(
  revealAt: string | Date,
  now: Date = new Date(),
): number {
  const target = typeof revealAt === "string" ? new Date(revealAt) : revealAt;
  return (target.getTime() - now.getTime()) / MS_PER_HOUR;
}

export function isRevealWithinPpaWarningWindow(
  revealAt: string | Date,
  now: Date = new Date(),
  warningHours: number = PPA_REVEAL_WARNING_HOURS,
): boolean {
  return getHoursUntilReveal(revealAt, now) <= warningHours;
}

/** Published cards on the cycle that are missing signal, insight, and/or lock. */
export function getMissingPpaForCycle(
  cycleId: string,
  cards: MarketPulseAdminCardRow[],
): PpaRevealWarningCard[] {
  const cycleCards = cards.filter((card) => card.cycleId === cycleId);
  const validation = validatePublishedCardsPpaForReveal(
    cycleId,
    cycleCards.map(toRevealPpaCardInput),
  );

  if (validation.ready) {
    return [];
  }

  return validation.missingCards.map((missing) => {
    const source = cycleCards.find((card) => card.id === missing.id);
    return {
      id: missing.id,
      dayIndex: missing.dayIndex,
      ticker: source?.ticker ?? "—",
      headline: missing.headline,
      companyName: missing.companyName,
      missing: missing.missing,
    };
  });
}

export function evaluatePpaRevealWarning(input: {
  activeCycle: MarketPulseAdminCycleRow | null;
  cards: MarketPulseAdminCardRow[];
  now?: Date;
  warningHours?: number;
}): PpaRevealWarningEvaluation {
  const now = input.now ?? new Date();
  const warningHours = input.warningHours ?? PPA_REVEAL_WARNING_HOURS;

  if (!input.activeCycle || input.activeCycle.status === "REVEALED") {
    return {
      severity: "none",
      revealAtIso: null,
      hoursUntilReveal: null,
      missingCards: [],
    };
  }

  const revealAtIso = input.activeCycle.revealAt;
  const hoursUntilReveal = getHoursUntilReveal(revealAtIso, now);
  const missingCards = getMissingPpaForCycle(input.activeCycle.id, input.cards);

  if (missingCards.length === 0) {
    return {
      severity: "complete",
      revealAtIso,
      hoursUntilReveal,
      missingCards: [],
    };
  }

  if (isRevealWithinPpaWarningWindow(revealAtIso, now, warningHours)) {
    return {
      severity: "urgent",
      revealAtIso,
      hoursUntilReveal,
      missingCards,
    };
  }

  return {
    severity: "setup",
    revealAtIso,
    hoursUntilReveal,
    missingCards,
  };
}

export function formatPpaMissingFields(
  missing: RevealPpaMissingField[],
): string {
  return missing
    .map((field) => {
      switch (field) {
        case "ppaSignal":
          return "signal";
        case "ppaInsight":
          return "insight";
        case "ppaLocked":
          return "lock";
        default:
          return field;
      }
    })
    .join(", ");
}
