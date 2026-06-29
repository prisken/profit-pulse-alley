/**
 * Redesigned Market Pulse card field mapping.
 *
 * New design labels map to existing Prisma columns where possible.
 * Only net-new concepts have dedicated columns (see NEW_CARD_CONTENT_FIELDS).
 */

/** Design concept → existing `MarketPulseCard` column. */
export const MARKET_PULSE_CARD_LEGACY_FIELD_MAP = {
  newsSourceName: "sourceName",
  newsSourceUrl: "sourceUrl",
  newsPublishedAt: "sourceDate",
  companyName: "companyName",
  companyLogoUrl: "logoUrl",
  exchange: "exchange",
  currentPriceText: "priceLabel",
  priceChangeText: "priceDirection",
} as const;

/** Columns added for the redesigned card (all optional for backward compatibility). */
export const MARKET_PULSE_NEW_CARD_CONTENT_FIELDS = [
  "newsBody",
  "logoInitials",
  "cardImageUrl",
  "cardImageAlt",
  "userPrompt",
] as const;

export type MarketPulseNewCardContentField =
  (typeof MARKET_PULSE_NEW_CARD_CONTENT_FIELDS)[number];

/** Public-safe card content fields (never includes PPA). */
export type MarketPulseCardContentFields = {
  headline: string;
  newsBody: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: Date | string | null;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  summary: string | null;
  userPrompt: string | null;
};
