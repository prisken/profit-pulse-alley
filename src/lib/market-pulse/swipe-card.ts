import type { MarketPulseCardType } from "@prisma/client";

import { isMarketPulseRestCard, resolveMarketPulseCardType } from "@/lib/market-pulse/card-type";
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

/** API-safe card payload: strips PPA, ensures cardType, never exposes PPA on REST cards. */
export function sanitizeMarketPulseApiCardPayload<
  T extends Record<string, unknown> & { cardType?: MarketPulseCardType | null },
>(card: T): Omit<T, "ppaSignal" | "ppaInsight"> & { cardType: MarketPulseCardType } {
  const cardType = resolveMarketPulseCardType(card.cardType);
  const stripped = stripPpaFromCardPayload(card);
  return {
    ...stripped,
    cardType,
  };
}

/** API-safe reveal row — REST cards never include PPA fields. */
export function sanitizeMarketPulseApiRevealCard<
  T extends {
    cardType: MarketPulseCardType;
    ppaSignal?: unknown;
    ppaInsight?: unknown;
  },
>(card: T): T {
  if (!isMarketPulseRestCard(card)) {
    return card;
  }

  const sanitized = { ...card };
  delete sanitized.ppaSignal;
  delete sanitized.ppaInsight;
  return sanitized as T;
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
    cardType: card.cardType ?? "SIGNAL",
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
