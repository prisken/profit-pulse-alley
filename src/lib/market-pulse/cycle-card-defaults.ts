import type { MarketPulseCardStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import {
  getCycleDayCapacity,
  nextAvailableSourceDate,
  suggestQuickDraftSlot,
  type QuickDraftSlot,
} from "@/lib/market-pulse/admin-card-scheduling";
import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";

export const QUICK_DRAFT_CARD_HEADLINE = "Untitled signal";
export const QUICK_DRAFT_CARD_COMPANY_NAME = "Untitled company";
export const QUICK_DRAFT_CARD_TICKER = "TBD";
export const QUICK_DRAFT_CARD_STATUS: MarketPulseCardStatus = "DRAFT";

export const QUICK_REST_DRAFT_CARD_HEADLINE = "Market rest day";
export const QUICK_REST_DRAFT_CARD_NEWS_BODY =
  "No market signal is published today. Check in to claim participation.";
export const QUICK_REST_DRAFT_CARD_HEADLINE_ZH = "市場休息日";
export const QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH =
  "今日沒有市場信號。登入即可獲得參與分。";

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
  sortOrder?: number;
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
  sortOrder: number;
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

export type QuickRestDraftCardDefaults = {
  dayIndex: number;
  sortOrder: number;
  headline: string;
  headlineZhHant: string;
  newsBody: string;
  newsBodyZhHant: string;
  status: MarketPulseCardStatus;
  sourceDate: Date;
  schedulingWarning: string | null;
};

export type QuickDraftCardDefaults = {
  dayIndex: number;
  sortOrder: number;
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

  return [...cards].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) {
      return b.dayIndex - a.dayIndex;
    }
    return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
  })[0] ?? null;
}

export function formatCycleCardCategoryLabel(
  exchange: string | null | undefined,
  sourceName: string | null | undefined,
): string | null {
  const parts = [exchange?.trim(), sourceName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function schedulingWarningForSlot(
  slot: QuickDraftSlot,
  cycleDayCapacity: number,
): string | null {
  if (slot.exceedsCycleCapacity) {
    return `Day ${slot.dayIndex} is beyond this cycle's ${cycleDayCapacity}-day span. Adjust before publishing.`;
  }
  return null;
}

export function deriveCycleCardCreationDefaults(input: {
  cycle: CycleCardDefaultsContext & { endsAt?: Date | string };
  cards: CycleCardReference[];
  now?: Date;
}): CycleCardCreationDefaults {
  const cycleStartsAt = new Date(input.cycle.startsAt);
  const cycleEndsAt = input.cycle.endsAt ? new Date(input.cycle.endsAt) : undefined;
  const cycleDayCapacity = cycleEndsAt
    ? getCycleDayCapacity(cycleStartsAt, cycleEndsAt)
    : 1;
  const slot = suggestQuickDraftSlot({
    cycleStartsAt,
    cycleEndsAt: cycleEndsAt ?? cycleStartsAt,
    cards: input.cards,
    now: input.now,
  });
  const usedSourceDateKeys = new Set<string>();
  const sourceAssignment = nextAvailableSourceDate({
    cycleStartsAt,
    preferredDayIndex: slot.dayIndex,
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
    schedulingWarningForSlot(slot, cycleDayCapacity) ??
    (sourceAssignment.outsideCycleRange
      ? "Assigned source date falls outside the cycle date range."
      : null);

  return {
    dayIndex: slot.dayIndex,
    sortOrder: slot.sortOrder,
    sourceDate: sourceAssignment.sourceDate,
    userPrompt,
    exchange,
    sourceName,
    sourceUrl,
    prizeLabel: input.cycle.prizeLabel?.trim() || null,
    cycleRevealAt: new Date(input.cycle.revealAt).toISOString(),
    referenceCardId: reference?.id ?? null,
    referenceDayIndex: reference?.dayIndex ?? null,
    exceedsCycleCapacity: slot.exceedsCycleCapacity,
    schedulingWarning,
  };
}

export function nextQuickDraftDayIndex(
  existingDayIndexes: number[],
  cycleDayCapacity?: number,
): number {
  return suggestQuickDraftSlot({
    cycleStartsAt: new Date(),
    cycleEndsAt: new Date(Date.now() + (cycleDayCapacity ?? 10) * 24 * 60 * 60 * 1000),
    cards: existingDayIndexes.map((dayIndex) => ({ dayIndex, sortOrder: 0 })),
  }).dayIndex;
}

export function quickDraftCardSourceDate(
  cycleStartsAt: Date,
  dayIndex: number,
): Date {
  return getCycleDayReleaseAt(cycleStartsAt, dayIndex);
}

export function buildQuickRestDraftCardDefaults(input: {
  cycle: CycleCardDefaultsContext;
  cards: CycleCardReference[];
  now?: Date;
}): QuickRestDraftCardDefaults {
  const derived = deriveCycleCardCreationDefaults(input);

  return {
    dayIndex: derived.dayIndex,
    sortOrder: derived.sortOrder,
    headline: QUICK_REST_DRAFT_CARD_HEADLINE,
    headlineZhHant: QUICK_REST_DRAFT_CARD_HEADLINE_ZH,
    newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
    newsBodyZhHant: QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH,
    status: QUICK_DRAFT_CARD_STATUS,
    sourceDate: derived.sourceDate,
    schedulingWarning: derived.schedulingWarning,
  };
}

export function buildQuickDraftCardDefaults(input: {
  cycle: CycleCardDefaultsContext;
  cards: CycleCardReference[];
  now?: Date;
}): QuickDraftCardDefaults {
  const derived = deriveCycleCardCreationDefaults(input);

  return {
    dayIndex: derived.dayIndex,
    sortOrder: derived.sortOrder,
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
