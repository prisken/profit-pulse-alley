import type {
  MarketPulseCard,
  MarketPulseCardStatus,
  MarketPulseCycle,
  MarketPulseSignal,
} from "@prisma/client";

import type { SiteLocale } from "@/lib/i18n/locales";
import { DEFAULT_SITE_LOCALE } from "@/lib/i18n/locales";
import { localizeMarketPulseCardPublicPayload } from "@/lib/market-pulse/card-localization";

export type MarketPulseCardPublicPayload = {
  id: string;
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
  sourceDate: Date | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  summary: string | null;
  userPrompt: string | null;
  status: MarketPulseCardStatus;
  publishedAt: Date | null;
  revealAt: Date | null;
  isRevealed: boolean;
  ppaSignal?: MarketPulseSignal;
  ppaInsight?: string | null;
};

function effectiveCardRevealAt(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "revealAt">,
): Date {
  return card.revealAt ?? cycle.revealAt;
}

export function isMarketPulseCycleRevealed(
  cycle: Pick<MarketPulseCycle, "status" | "revealAt">,
  at: Date = new Date(),
): boolean {
  return cycle.status === "REVEALED" || at >= cycle.revealAt;
}

export function isMarketPulseCardRevealed(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "status" | "revealAt">,
  at: Date = new Date(),
): boolean {
  if (isMarketPulseCycleRevealed(cycle, at)) {
    return true;
  }
  return at >= effectiveCardRevealAt(card, cycle);
}

export function getMarketPulseCardPublicPayload(
  card: MarketPulseCard,
  options: {
    cycle: Pick<MarketPulseCycle, "status" | "revealAt">;
    at?: Date;
    locale?: SiteLocale;
  },
): MarketPulseCardPublicPayload {
  const at = options.at ?? new Date();
  const locale = options.locale ?? DEFAULT_SITE_LOCALE;
  const revealed = isMarketPulseCardRevealed(card, options.cycle, at);

  const payload: MarketPulseCardPublicPayload = {
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
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
    status: card.status,
    publishedAt: card.publishedAt,
    revealAt: card.revealAt,
    isRevealed: revealed,
  };

  if (revealed) {
    if (card.ppaSignal) {
      payload.ppaSignal = card.ppaSignal;
    }
    if (card.ppaInsight != null) {
      payload.ppaInsight = card.ppaInsight;
    }
  }

  return localizeMarketPulseCardPublicPayload(payload, card, locale);
}
