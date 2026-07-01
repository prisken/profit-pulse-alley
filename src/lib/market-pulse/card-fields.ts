/**
 * Redesigned Market Pulse card field mapping.
 *
 * New design labels map to existing Prisma columns where possible.
 * Only net-new concepts have dedicated columns (see NEW_CARD_CONTENT_FIELDS).
 *
 * Bilingual model (Phase 1 — schema only):
 * - English source fields remain required for publish (headline, summary, companyName, …).
 * - `*ZhHant` columns are optional; runtime resolution falls back to English when empty.
 * - `companyNameZh` predates the ZhHant suffix — treat it as the Traditional Chinese company name.
 * - `ppaInsightZhHant` is reveal-gated like `ppaInsight`; `ppaSignal` stays language-agnostic.
 *
 * Multiple cards per cycle day:
 * - `dayIndex` is the cycle calendar day (1-based in admin; legacy rows may use 0).
 * - `sortOrder` (default 0) orders cards that share the same dayIndex.
 * - `@@unique([cycleId, dayIndex, sortOrder])` replaces the old one-card-per-day constraint.
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

/**
 * Optional Traditional Chinese (`zh-Hant`) content columns on MarketPulseCard.
 * All nullable — existing English-only production rows remain valid without backfill.
 */
export const MARKET_PULSE_CARD_ZH_HANT_FIELDS = [
  "headlineZhHant",
  "newsBodyZhHant",
  "summaryZhHant",
  "cardImageAltZhHant",
  "userPromptZhHant",
  "ppaInsightZhHant",
] as const;

export type MarketPulseCardZhHantField =
  (typeof MARKET_PULSE_CARD_ZH_HANT_FIELDS)[number];

/** English field paired with each ZhHant column for locale resolution. */
export const MARKET_PULSE_CARD_BILINGUAL_FIELD_PAIRS = {
  companyName: "companyNameZh",
  headline: "headlineZhHant",
  newsBody: "newsBodyZhHant",
  summary: "summaryZhHant",
  cardImageAlt: "cardImageAltZhHant",
  userPrompt: "userPromptZhHant",
  ppaInsight: "ppaInsightZhHant",
} as const satisfies Record<string, MarketPulseCardZhHantField | "companyNameZh">;

/** Scheduling / ordering columns (legacy publishedAt + revealAt retained on the model). */
export const MARKET_PULSE_CARD_SCHEDULING_FIELDS = [
  "dayIndex",
  "sortOrder",
  "publishedAt",
  "revealAt",
  "sourceDate",
] as const;

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
