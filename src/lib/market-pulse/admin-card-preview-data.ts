import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

const ADMIN_PREVIEW_CARD_ID = "admin-preview";

export function adminPreviewDataToSwipeCard(
  preview: MarketPulseAdminCardPreviewData,
  cardId: string = ADMIN_PREVIEW_CARD_ID,
): MarketPulseSwipeCardData {
  return toMarketPulseSwipeCardData({
    id: cardId,
    cardType: "SIGNAL",
    companyName: preview.companyName?.trim() || "Company name",
    companyNameZh: preview.companyNameZh ?? null,
    ticker: preview.ticker?.trim() || "TICKER",
    exchange: preview.exchange ?? null,
    logoUrl: preview.logoUrl ?? null,
    logoInitials: preview.logoInitials ?? null,
    priceLabel: preview.priceLabel ?? null,
    priceDirection: preview.priceDirection ?? null,
    headline: preview.headline?.trim() || "News headline preview",
    newsBody: preview.newsBody ?? null,
    sourceName: preview.sourceName ?? null,
    sourceUrl: preview.sourceUrl ?? null,
    sourceDate: preview.sourceDate ?? null,
    cardImageUrl: preview.cardImageUrl ?? null,
    cardImageAlt: preview.cardImageAlt ?? null,
    summary: preview.summary ?? null,
    userPrompt: preview.userPrompt ?? null,
    ppaSignal: preview.ppaSignal,
    ppaInsight: preview.ppaInsight,
  });
}

export function swipeCardPayloadHasNoPpaFields(
  payload: MarketPulseSwipeCardData,
): boolean {
  const record = payload as Record<string, unknown>;
  return !("ppaSignal" in record) && !("ppaInsight" in record);
}

export function adminPreviewIsReadOnly(): true {
  return true;
}
