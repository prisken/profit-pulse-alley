import type { MarketPulseCard } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";

/** Nullable bilingual / ordering fields for synthetic or partial admin card rows. */
export const MARKET_PULSE_ADMIN_CARD_ROW_LOCALIZATION_DEFAULTS = {
  sortOrder: 0,
  headlineZhHant: null,
  newsBodyZhHant: null,
  summaryZhHant: null,
  cardImageAltZhHant: null,
  userPromptZhHant: null,
  ppaInsightZhHant: null,
} as const satisfies Pick<
  MarketPulseAdminCardRow,
  | "sortOrder"
  | "headlineZhHant"
  | "newsBodyZhHant"
  | "summaryZhHant"
  | "cardImageAltZhHant"
  | "userPromptZhHant"
  | "ppaInsightZhHant"
>;

type CardWithDecisionCount = Pick<
  MarketPulseCard,
  | "id"
  | "cycleId"
  | "dayIndex"
  | "sortOrder"
  | "cardType"
  | "companyName"
  | "companyNameZh"
  | "ticker"
  | "exchange"
  | "logoUrl"
  | "logoInitials"
  | "priceLabel"
  | "priceDirection"
  | "headline"
  | "headlineZhHant"
  | "newsBody"
  | "newsBodyZhHant"
  | "sourceName"
  | "sourceUrl"
  | "sourceDate"
  | "cardImageUrl"
  | "cardImageAlt"
  | "cardImageAltZhHant"
  | "summary"
  | "summaryZhHant"
  | "userPrompt"
  | "userPromptZhHant"
  | "status"
  | "ppaSignal"
  | "ppaInsight"
  | "ppaInsightZhHant"
  | "ppaSignalLockedAt"
  | "publishedAt"
  | "revealAt"
  | "createdAt"
> & {
  _count: { decisions: number };
};

export function mapMarketPulseAdminCardRow(
  card: CardWithDecisionCount,
): MarketPulseAdminCardRow {
  return {
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    sortOrder: card.sortOrder,
    cardType: card.cardType,
    companyName: card.companyName,
    companyNameZh: card.companyNameZh,
    ticker: card.ticker,
    exchange: card.exchange,
    logoUrl: card.logoUrl,
    logoInitials: card.logoInitials,
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    headlineZhHant: card.headlineZhHant,
    newsBody: card.newsBody,
    newsBodyZhHant: card.newsBodyZhHant,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    sourceDate: card.sourceDate?.toISOString() ?? null,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
    cardImageAltZhHant: card.cardImageAltZhHant,
    summary: card.summary,
    summaryZhHant: card.summaryZhHant,
    userPrompt: card.userPrompt,
    userPromptZhHant: card.userPromptZhHant,
    status: card.status,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaInsightZhHant: card.ppaInsightZhHant,
    ppaSignalLockedAt: card.ppaSignalLockedAt?.toISOString() ?? null,
    publishedAt: card.publishedAt?.toISOString() ?? null,
    revealAt: card.revealAt?.toISOString() ?? null,
    createdAt: (card.createdAt ?? card.publishedAt ?? new Date(0)).toISOString(),
    decisionCount: card._count.decisions,
  };
}
