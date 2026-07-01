import type { MarketPulseCardStatus, MarketPulseCardType, MarketPulseSignal } from "@prisma/client";

import {
  collectUsedSourceDateKeys,
  nextAvailableSourceDate,
  suggestQuickDraftSlot,
} from "@/lib/market-pulse/admin-card-scheduling";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";

import { QUICK_DRAFT_CARD_STATUS } from "@/lib/market-pulse/cycle-card-defaults";

export const DUPLICATE_CARD_STATUS: MarketPulseCardStatus = QUICK_DRAFT_CARD_STATUS;

export type DuplicateCardSource = {
  cycleId: string;
  cardType: MarketPulseCardType;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  headlineZhHant: string | null;
  newsBody: string | null;
  newsBodyZhHant: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  cardImageAltZhHant: string | null;
  summary: string | null;
  summaryZhHant: string | null;
  userPrompt: string | null;
  userPromptZhHant: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaInsightZhHant: string | null;
};

export type DuplicateCardCreateData = {
  cycleId: string;
  dayIndex: number;
  sortOrder: number;
  cardType: MarketPulseCardType;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  headlineZhHant: string | null;
  newsBody: string | null;
  newsBodyZhHant: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: Date;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  cardImageAltZhHant: string | null;
  summary: string | null;
  summaryZhHant: string | null;
  userPrompt: string | null;
  userPromptZhHant: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaInsightZhHant: string | null;
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
  existingCards: Array<{ dayIndex: number; sortOrder?: number; sourceDate?: Date | null }>;
}): DuplicateCardCreateData {
  const slot = suggestQuickDraftSlot({
    cycleStartsAt: input.targetCycleStartsAt,
    cycleEndsAt: input.targetCycleEndsAt ?? input.targetCycleStartsAt,
    cards: input.existingCards,
  });
  const dayIndex = slot.dayIndex;
  const sortOrder = slot.sortOrder;
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
    sortOrder,
    cardType: input.source.cardType,
    companyName: input.source.companyName,
    companyNameZh: input.source.companyNameZh,
    ticker: input.source.ticker,
    exchange: input.source.exchange,
    logoUrl: input.source.logoUrl,
    logoInitials: input.source.logoInitials,
    priceLabel: input.source.priceLabel,
    priceDirection: input.source.priceDirection,
    headline: input.source.headline,
    headlineZhHant: input.source.headlineZhHant,
    newsBody: input.source.newsBody,
    newsBodyZhHant: input.source.newsBodyZhHant,
    sourceName: input.source.sourceName,
    sourceUrl: input.source.sourceUrl,
    sourceDate: sourceAssignment.sourceDate,
    cardImageUrl: input.source.cardImageUrl,
    cardImageAlt: input.source.cardImageAlt,
    cardImageAltZhHant: input.source.cardImageAltZhHant,
    summary: input.source.summary,
    summaryZhHant: input.source.summaryZhHant,
    userPrompt: input.source.userPrompt,
    userPromptZhHant: input.source.userPromptZhHant,
    ppaSignal: isMarketPulseRestCard(input.source) ? null : input.source.ppaSignal,
    ppaInsight: isMarketPulseRestCard(input.source) ? null : input.source.ppaInsight,
    ppaInsightZhHant: isMarketPulseRestCard(input.source)
      ? null
      : input.source.ppaInsightZhHant,
    status: DUPLICATE_CARD_STATUS,
    publishedAt: null,
    revealAt: null,
    ppaSignalLockedAt: null,
  };
}
