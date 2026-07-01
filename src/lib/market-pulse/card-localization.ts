import type { MarketPulseCard } from "@prisma/client";

import type { SiteLocale } from "@/lib/i18n/locales";
import type { MarketPulseSwipeCardData } from "@/lib/market-pulse/types";

/** Text-bearing card columns used for locale resolution (storage is never mutated). */
export type MarketPulseCardLocalizableSource = Pick<
  MarketPulseCard,
  | "companyName"
  | "companyNameZh"
  | "headline"
  | "headlineZhHant"
  | "newsBody"
  | "newsBodyZhHant"
  | "summary"
  | "summaryZhHant"
  | "cardImageAlt"
  | "cardImageAltZhHant"
  | "userPrompt"
  | "userPromptZhHant"
  | "ppaInsight"
  | "ppaInsightZhHant"
>;

export type LocalizedMarketPulseCardText = {
  companyName: string;
  companyNameZh: string | null;
  headline: string;
  newsBody: string | null;
  summary: string | null;
  cardImageAlt: string | null;
  userPrompt: string | null;
  ppaInsight: string | null;
};

function pickLocalizedOptional(
  zhHant: string | null | undefined,
  english: string | null | undefined,
): string | null {
  const zh = zhHant?.trim();
  if (zh) {
    return zh;
  }
  const en = english?.trim();
  return en || null;
}

function pickLocalizedRequired(
  zhHant: string | null | undefined,
  english: string,
): string {
  return pickLocalizedOptional(zhHant, english) ?? english;
}

/**
 * Resolve player-facing text for a card in the requested locale.
 * English locale preserves stored English fields and keeps `companyNameZh` for legacy dual-line UI.
 */
export function localizeMarketPulseCardText(
  card: MarketPulseCardLocalizableSource,
  locale: SiteLocale,
): LocalizedMarketPulseCardText {
  if (locale === "en") {
    return {
      companyName: card.companyName,
      companyNameZh: card.companyNameZh,
      headline: card.headline,
      newsBody: card.newsBody,
      summary: card.summary,
      cardImageAlt: card.cardImageAlt,
      userPrompt: card.userPrompt,
      ppaInsight: card.ppaInsight,
    };
  }

  return {
    companyName: pickLocalizedRequired(card.companyNameZh, card.companyName),
    companyNameZh: null,
    headline: pickLocalizedRequired(card.headlineZhHant, card.headline),
    newsBody: pickLocalizedOptional(card.newsBodyZhHant, card.newsBody),
    summary: pickLocalizedOptional(card.summaryZhHant, card.summary),
    cardImageAlt: pickLocalizedOptional(card.cardImageAltZhHant, card.cardImageAlt),
    userPrompt: pickLocalizedOptional(card.userPromptZhHant, card.userPrompt),
    ppaInsight: pickLocalizedOptional(card.ppaInsightZhHant, card.ppaInsight),
  };
}

/** Alias for card-shaped Prisma rows. */
export function localizeMarketPulseCard(
  card: MarketPulseCardLocalizableSource,
  locale: SiteLocale,
): LocalizedMarketPulseCardText {
  return localizeMarketPulseCardText(card, locale);
}

export type LocalizableMarketPulsePublicPayload = {
  companyName: string;
  companyNameZh: string | null;
  headline: string;
  newsBody: string | null;
  summary: string | null;
  cardImageAlt: string | null;
  userPrompt: string | null;
  ppaInsight?: string | null;
};

export function localizeMarketPulseCardPublicPayload<
  T extends LocalizableMarketPulsePublicPayload,
>(
  payload: T,
  source: MarketPulseCardLocalizableSource,
  locale: SiteLocale,
): T {
  const text = localizeMarketPulseCardText(source, locale);

  const localized = {
    ...payload,
    companyName: text.companyName,
    companyNameZh: text.companyNameZh,
    headline: text.headline,
    newsBody: text.newsBody,
    summary: text.summary,
    cardImageAlt: text.cardImageAlt,
    userPrompt: text.userPrompt,
  } as T;

  if (payload.ppaInsight !== undefined) {
    (localized as LocalizableMarketPulsePublicPayload).ppaInsight = text.ppaInsight;
  }

  return localized;
}

export function localizeMarketPulseSwipeCardData(
  card: MarketPulseSwipeCardData,
  source: MarketPulseCardLocalizableSource,
  locale: SiteLocale,
): MarketPulseSwipeCardData {
  const text = localizeMarketPulseCardText(source, locale);

  return {
    ...card,
    companyName: text.companyName,
    companyNameZh: text.companyNameZh,
    headline: text.headline,
    newsBody: text.newsBody,
    summary: text.summary,
    cardImageAlt: text.cardImageAlt,
    userPrompt: text.userPrompt,
  };
}

export function localizeMarketPulseRevealCardFields(
  card: MarketPulseCardLocalizableSource & {
    companyName: string;
    headline: string;
    ppaInsight: string | null;
  },
  locale: SiteLocale,
): Pick<LocalizedMarketPulseCardText, "companyName" | "headline" | "ppaInsight"> {
  const text = localizeMarketPulseCardText(card, locale);
  return {
    companyName: text.companyName,
    headline: text.headline,
    ppaInsight: text.ppaInsight,
  };
}
