import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

/** Remove hidden PPA fields from any card-shaped payload (defense in depth). */
export function stripPpaFromCardPayload<T extends Record<string, unknown>>(
  card: T,
): Omit<T, "ppaSignal" | "ppaInsight"> {
  const rest = { ...card };
  delete rest.ppaSignal;
  delete rest.ppaInsight;
  return rest as Omit<T, "ppaSignal" | "ppaInsight">;
}

/** Strip server-only fields before passing card data to the swipe UI. */
export function toMarketPulseSwipeCardData(
  card: MarketPulseSwipeCardData & {
    ppaSignal?: unknown;
    ppaInsight?: unknown;
    isRevealed?: unknown;
  },
): MarketPulseSwipeCardData {
  return {
    id: card.id,
    companyName: card.companyName,
    companyNameZh: card.companyNameZh,
    ticker: card.ticker,
    exchange: card.exchange,
    logoUrl: card.logoUrl,
    logoInitials: card.logoInitials,
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    newsBody: card.newsBody,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    sourceDate: card.sourceDate,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
    summary: card.summary,
    userPrompt: card.userPrompt,
  };
}
