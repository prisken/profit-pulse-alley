import type { MarketPulseCardStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import { addHktDays } from "@/lib/market-pulse/quick-create-cycle-defaults";
import {
  collectUsedSourceDateKeys,
  getCycleDayCapacity,
  nextAvailableDayIndex,
  nextAvailableSourceDate,
  type NextDayIndexResult,
} from "@/lib/market-pulse/admin-card-scheduling";

export const QUICK_DRAFT_CARD_HEADLINE = "Untitled signal";
export const QUICK_DRAFT_CARD_COMPANY_NAME = "Untitled company";
export const QUICK_DRAFT_CARD_TICKER = "TBD";
export const QUICK_DRAFT_CARD_STATUS: MarketPulseCardStatus = "DRAFT";

export type CycleCardReference = Pick<
  MarketPulseAdminCardRow,
  | "id"
  | "dayIndex"
  | "userPrompt"
  | "exchange"
  | "sourceName"
  | "sourceUrl"
  | "headline"
  | "companyName"
  | "ticker"
> & {
  sourceDate?: string | Date | null;
};

export type CycleCardDefaultsContext = {
  startsAt: Date | string;
  endsAt?: Date | string;
  revealAt: Date | string;
  prizeLabel: string | null;
};

export type CycleCardCreationDefaults = {
  dayIndex: number;
  sourceDate: Date;
  userPrompt: string;
  exchange: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  prizeLabel: string | null;
  cycleRevealAt: string;
  referenceCardId: string | null;
  referenceDayIndex: number | null;
  exceedsCycleCapacity: boolean;
  schedulingWarning: string | null;
};

export type QuickDraftCardDefaults = {
  dayIndex: number;
  companyName: string;
  ticker: string;
  headline: string;
  userPrompt: string;
  exchange: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  status: MarketPulseCardStatus;
  sourceDate: Date;
  schedulingWarning: string | null;
};

export function pickLatestCycleCardReference(
  cards: CycleCardReference[],
): CycleCardReference | null {
  if (cards.length === 0) {
    return null;
  }

  return [...cards].sort((a, b) => b.dayIndex - a.dayIndex)[0] ?? null;
}

export function formatCycleCardCategoryLabel(
  exchange: string | null | undefined,
  sourceName: string | null | undefined,
): string | null {
  const parts = [exchange?.trim(), sourceName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function deriveCycleCardCreationDefaults(input: {
  cycle: CycleCardDefaultsContext & { endsAt?: Date | string };
  cards: CycleCardReference[];
}): CycleCardCreationDefaults {
  const cycleStartsAt = new Date(input.cycle.startsAt);
  const cycleEndsAt = input.cycle.endsAt ? new Date(input.cycle.endsAt) : undefined;
  const existingDayIndexes = input.cards.map((card) => card.dayIndex);
  const cycleDayCapacity = cycleEndsAt
    ? getCycleDayCapacity(cycleStartsAt, cycleEndsAt)
    : undefined;
  const dayAssignment: NextDayIndexResult = nextAvailableDayIndex(
    existingDayIndexes,
    cycleDayCapacity,
  );
  const usedSourceDateKeys = collectUsedSourceDateKeys(input.cards);
  const sourceAssignment = nextAvailableSourceDate({
    cycleStartsAt,
    preferredDayIndex: dayAssignment.dayIndex,
    usedSourceDateKeys,
    cycleEndsAt,
  });
  const reference = pickLatestCycleCardReference(input.cards);

  const userPrompt =
    reference?.userPrompt?.trim() || MARKET_PULSE_DEFAULT_USER_PROMPT;
  const exchange = reference?.exchange?.trim() || null;
  const sourceName = reference?.sourceName?.trim() || null;
  const sourceUrl = reference?.sourceUrl?.trim() || null;

  const schedulingWarning =
    dayAssignment.exceedsCycleCapacity || sourceAssignment.outsideCycleRange
      ? dayAssignment.exceedsCycleCapacity
        ? `Day ${dayAssignment.dayIndex} is beyond this cycle's ${cycleDayCapacity ?? "?"}-day span. Adjust before publishing.`
        : "Assigned source date falls outside the cycle date range."
      : sourceAssignment.skippedUsedDates
        ? "Assigned the next unused source date because earlier dates are already taken."
        : null;

  return {
    dayIndex: dayAssignment.dayIndex,
    sourceDate: sourceAssignment.sourceDate,
    userPrompt,
    exchange,
    sourceName,
    sourceUrl,
    prizeLabel: input.cycle.prizeLabel?.trim() || null,
    cycleRevealAt: new Date(input.cycle.revealAt).toISOString(),
    referenceCardId: reference?.id ?? null,
    referenceDayIndex: reference?.dayIndex ?? null,
    exceedsCycleCapacity: dayAssignment.exceedsCycleCapacity,
    schedulingWarning,
  };
}

export function nextQuickDraftDayIndex(existingDayIndexes: number[]): number {
  return nextAvailableDayIndex(existingDayIndexes).dayIndex;
}

export function quickDraftCardSourceDate(
  cycleStartsAt: Date,
  dayIndex: number,
): Date {
  return addHktDays(cycleStartsAt, Math.max(dayIndex - 1, 0));
}

export function buildQuickDraftCardDefaults(input: {
  cycle: CycleCardDefaultsContext;
  cards: CycleCardReference[];
}): QuickDraftCardDefaults {
  const derived = deriveCycleCardCreationDefaults(input);

  return {
    dayIndex: derived.dayIndex,
    companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
    ticker: QUICK_DRAFT_CARD_TICKER,
    headline: QUICK_DRAFT_CARD_HEADLINE,
    userPrompt: derived.userPrompt,
    exchange: derived.exchange,
    sourceName: derived.sourceName,
    sourceUrl: derived.sourceUrl,
    status: QUICK_DRAFT_CARD_STATUS,
    sourceDate: derived.sourceDate,
    schedulingWarning: derived.schedulingWarning,
  };
}

export function isQuickDraftCardContent(
  card: Pick<
    MarketPulseAdminCardRow,
    "headline" | "companyName" | "ticker" | "status"
  >,
): boolean {
  return (
    card.status === QUICK_DRAFT_CARD_STATUS &&
    card.headline === QUICK_DRAFT_CARD_HEADLINE &&
    card.companyName === QUICK_DRAFT_CARD_COMPANY_NAME &&
    card.ticker === QUICK_DRAFT_CARD_TICKER
  );
}

export function isPlaceholderDraftContent(
  card: Pick<CycleCardReference, "headline" | "companyName" | "ticker">,
): boolean {
  return (
    card.headline === QUICK_DRAFT_CARD_HEADLINE &&
    card.companyName === QUICK_DRAFT_CARD_COMPANY_NAME &&
    card.ticker === QUICK_DRAFT_CARD_TICKER
  );
}
