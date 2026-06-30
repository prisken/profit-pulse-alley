import type { MarketPulseCardStatus, MarketPulseSignal } from "@prisma/client";

import {
  collectUsedSourceDateKeys,
  nextAvailableSourceDate,
} from "@/lib/market-pulse/admin-card-scheduling";
import {
  nextQuickDraftDayIndex,
  QUICK_DRAFT_CARD_STATUS,
} from "@/lib/market-pulse/cycle-card-defaults";

export const DUPLICATE_CARD_STATUS: MarketPulseCardStatus = QUICK_DRAFT_CARD_STATUS;

export type DuplicateCardSource = {
  cycleId: string;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  newsBody: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  summary: string | null;
  userPrompt: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
};

export type DuplicateCardCreateData = {
  cycleId: string;
  dayIndex: number;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  newsBody: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: Date;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  summary: string | null;
  userPrompt: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  status: typeof DUPLICATE_CARD_STATUS;
  publishedAt: null;
  revealAt: null;
  ppaSignalLockedAt: null;
};

export function buildDuplicateCardCreateData(input: {
  source: DuplicateCardSource;
  targetCycleId: string;
  targetCycleStartsAt: Date;
  targetCycleEndsAt?: Date;
  existingCards: Array<{ dayIndex: number; sourceDate?: Date | null }>;
}): DuplicateCardCreateData {
  const existingDayIndexes = input.existingCards.map((card) => card.dayIndex);
  const dayIndex = nextQuickDraftDayIndex(existingDayIndexes);
  const usedSourceDateKeys = collectUsedSourceDateKeys(
    input.existingCards.map((card) => ({ sourceDate: card.sourceDate ?? null })),
  );
  const sourceAssignment = nextAvailableSourceDate({
    cycleStartsAt: input.targetCycleStartsAt,
    preferredDayIndex: dayIndex,
    usedSourceDateKeys,
    cycleEndsAt: input.targetCycleEndsAt,
  });

  return {
    cycleId: input.targetCycleId,
    dayIndex,
    companyName: input.source.companyName,
    companyNameZh: input.source.companyNameZh,
    ticker: input.source.ticker,
    exchange: input.source.exchange,
    logoUrl: input.source.logoUrl,
    logoInitials: input.source.logoInitials,
    priceLabel: input.source.priceLabel,
    priceDirection: input.source.priceDirection,
    headline: input.source.headline,
    newsBody: input.source.newsBody,
    sourceName: input.source.sourceName,
    sourceUrl: input.source.sourceUrl,
    sourceDate: sourceAssignment.sourceDate,
    cardImageUrl: input.source.cardImageUrl,
    cardImageAlt: input.source.cardImageAlt,
    summary: input.source.summary,
    userPrompt: input.source.userPrompt,
    ppaSignal: input.source.ppaSignal,
    ppaInsight: input.source.ppaInsight,
    status: DUPLICATE_CARD_STATUS,
    publishedAt: null,
    revealAt: null,
    ppaSignalLockedAt: null,
  };
}
