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
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    sourceName: card.sourceName,
    sourceDate: card.sourceDate,
    summary: card.summary,
  };
}
