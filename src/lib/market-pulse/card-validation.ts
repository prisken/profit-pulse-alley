import type {
  MarketPulseCardStatus,
  MarketPulseCardType,
  MarketPulseSignal,
} from "@prisma/client";

import {
  cardTypeRequiresPpa,
  isMarketPulseRestCard,
  isMarketPulseSignalCard,
  isRestCardType,
  MARKET_PULSE_CARD_TYPE_SIGNAL,
  MARKET_PULSE_PPA_SIGNAL_VALUES,
  resolveMarketPulseCardType,
  type MarketPulsePpaSignal,
} from "@/lib/market-pulse/card-type";

export const MARKET_PULSE_CARD_STATUS_OPTIONS: MarketPulseCardStatus[] = [
  "DRAFT",
  "READY",
  "PUBLISHED",
  "CLOSED",
  "REVEALED",
];

export const MARKET_PULSE_SIGNAL_OPTIONS: MarketPulsePpaSignal[] = [
  ...MARKET_PULSE_PPA_SIGNAL_VALUES,
];

const PPA_REQUIRED_STATUSES: MarketPulseCardStatus[] = ["READY", "PUBLISHED"];

export const MARKET_PULSE_DEFAULT_USER_PROMPT =
  "What is your read on this signal?";

export const MARKET_PULSE_CARD_IMAGE_GUIDANCE =
  "Recommended image size: 1200 × 675 px, 16:9 ratio. Minimum 800 × 450 px. JPG, PNG, or WebP. Keep the subject centered because mobile cards may crop slightly.";

export type MarketPulseCardFormValues = {
  cycleId: string;
  dayIndex: number;
  sortOrder: number;
  cardType: MarketPulseCardType;
  companyName: string;
  companyNameZh: string;
  ticker: string;
  exchange: string;
  logoUrl: string;
  logoInitials: string;
  priceLabel: string;
  priceDirection: string;
  headline: string;
  headlineZhHant: string;
  newsBody: string;
  newsBodyZhHant: string;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  cardImageUrl: string;
  cardImageAlt: string;
  cardImageAltZhHant: string;
  summary: string;
  summaryZhHant: string;
  userPrompt: string;
  userPromptZhHant: string;
  ppaSignal: MarketPulseSignal | "";
  ppaInsight: string;
  ppaInsightZhHant: string;
  status: MarketPulseCardStatus;
  publishedAt: string;
  revealAt: string;
  changeReason: string;
};

export type CardFormFieldErrors = Partial<
  Record<
    | keyof MarketPulseCardFormValues
    | "dayIndex"
    | "global",
    string
  >
>;

export function parseCardDate(value: string): Date | null {
  if (!value.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function toCardDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function requiresPpaForStatus(
  status: MarketPulseCardStatus,
  cardType: MarketPulseCardType = MARKET_PULSE_CARD_TYPE_SIGNAL,
): boolean {
  return isMarketPulseSignalCard({ cardType }) && PPA_REQUIRED_STATUSES.includes(status);
}

function validateSharedCardScheduling(
  values: Pick<MarketPulseCardFormValues, "cycleId" | "dayIndex" | "sortOrder">,
  options?: {
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
  errors: CardFormFieldErrors = {},
): CardFormFieldErrors {
  if (!values.cycleId.trim()) {
    errors.cycleId = "Cycle is required.";
  }

  if (!Number.isInteger(values.dayIndex) || values.dayIndex < 1) {
    errors.dayIndex = "Day index must be a positive integer.";
  }

  if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0) {
    errors.sortOrder = "Order within day must be zero or greater.";
  } else if (
    options?.existingSortOrdersOnDay?.some(
      (row) => !row.exclude && row.sortOrder === values.sortOrder,
    )
  ) {
    errors.sortOrder = "Another card on this cycle day already uses this order.";
  }

  return errors;
}

function validateSharedCardMediaUrls(
  values: Pick<
    MarketPulseCardFormValues,
    "logoUrl" | "sourceUrl" | "cardImageUrl" | "cardImageAlt"
  >,
  errors: CardFormFieldErrors = {},
): CardFormFieldErrors {
  if (values.logoUrl.trim() && !isValidOptionalHttpUrl(values.logoUrl)) {
    errors.logoUrl = "Company logo URL must be a valid http(s) URL.";
  }
  if (values.sourceUrl.trim() && !isValidOptionalHttpUrl(values.sourceUrl)) {
    errors.sourceUrl = "News source URL must be a valid http(s) URL.";
  }
  if (values.cardImageUrl.trim() && !isValidOptionalHttpUrl(values.cardImageUrl)) {
    errors.cardImageUrl = "Card image URL must be a valid http(s) URL.";
  }
  if (values.cardImageUrl.trim() && !values.cardImageAlt.trim()) {
    errors.cardImageAlt = "Card image alt text is required when an image URL is set.";
  }

  return errors;
}

function validateSharedCardDates(
  values: Pick<
    MarketPulseCardFormValues,
    "publishedAt" | "revealAt" | "sourceDate"
  >,
  errors: CardFormFieldErrors = {},
): CardFormFieldErrors {
  if (values.publishedAt.trim() && !parseCardDate(values.publishedAt)) {
    errors.publishedAt = "Invalid published date.";
  }
  if (values.revealAt.trim() && !parseCardDate(values.revealAt)) {
    errors.revealAt = "Invalid reveal date.";
  }
  if (values.sourceDate.trim() && !parseCardDate(values.sourceDate)) {
    errors.sourceDate = "Invalid news published date.";
  }

  return errors;
}

function hasRestCardBodyContent(input: {
  newsBody: string;
  summary: string;
}): boolean {
  return Boolean(input.newsBody.trim() || input.summary.trim());
}

function validateSignalMarketPulseCardForm(
  values: MarketPulseCardFormValues,
  options?: {
    existingDayIndexes?: number[];
    excludeDayIndex?: number;
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors = validateSharedCardScheduling(values, options);

  if (!values.companyName.trim()) {
    errors.companyName = "Company name is required.";
  }
  if (!values.ticker.trim()) {
    errors.ticker = "Ticker is required.";
  }
  if (!values.headline.trim()) {
    errors.headline = "News headline is required.";
  }
  if (!values.summary.trim()) {
    errors.summary = "Summary is required.";
  }

  validateSharedCardMediaUrls(values, errors);

  if (requiresPpaForStatus(values.status, values.cardType)) {
    if (!values.ppaSignal) {
      errors.ppaSignal = "PPA signal is required for READY or PUBLISHED status.";
    }
    if (!values.ppaInsight.trim()) {
      errors.ppaInsight = "PPA insight is required for READY or PUBLISHED status.";
    }
  }

  validateSharedCardDates(values, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateRestMarketPulseCardForm(
  values: MarketPulseCardFormValues,
  options?: {
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors = validateSharedCardScheduling(values, options);

  if (!values.headline.trim()) {
    errors.headline = "Rest card title is required.";
  }
  if (!hasRestCardBodyContent(values)) {
    errors.newsBody = "Rest card body text or summary is required.";
  }

  validateSharedCardMediaUrls(values, errors);
  validateSharedCardDates(values, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateSignalMarketPulseCardDraftSave(
  values: MarketPulseCardFormValues,
  options?: {
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors = validateSharedCardScheduling(values, options);

  if (!values.companyName.trim()) {
    errors.companyName = "Company name is required.";
  }
  if (!values.ticker.trim()) {
    errors.ticker = "Ticker is required.";
  }
  if (!values.headline.trim()) {
    errors.headline = "News headline is required.";
  }

  validateSharedCardMediaUrls(values, errors);
  validateSharedCardDates(values, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateRestMarketPulseCardDraftSave(
  values: MarketPulseCardFormValues,
  options?: {
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors = validateSharedCardScheduling(values, options);

  if (!values.headline.trim()) {
    errors.headline = "Rest card title is required.";
  }

  validateSharedCardMediaUrls(values, errors);
  validateSharedCardDates(values, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateSignalCardPublishable(card: {
  headline: string;
  companyName: string;
  ticker: string;
  summary: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaSignalLockedAt: Date | string | null;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}): string | null {
  if (!card.headline.trim()) {
    return "Headline is required to publish.";
  }
  if (!card.companyName.trim()) {
    return "Company name is required to publish.";
  }
  if (!card.ticker.trim()) {
    return "Ticker is required to publish.";
  }
  if (!card.summary?.trim()) {
    return "Summary is required to publish.";
  }
  if (!card.ppaSignal) {
    return "PPA signal is required to publish.";
  }
  if (!card.ppaInsight?.trim()) {
    return "PPA insight is required to publish.";
  }
  if (!card.ppaSignalLockedAt) {
    return "PPA signal must be locked before publishing.";
  }
  if (card.cardImageUrl?.trim() && !card.cardImageAlt?.trim()) {
    return "Card image alt text is required when an image URL is set.";
  }
  const sourceError = validateCardSource({
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
  });
  if (sourceError) {
    return sourceError;
  }
  return null;
}

/**
 * Due-diligence guard: every SIGNAL card must carry a citable, direct source.
 * Rejects missing sources and non-citable aggregator/shim URLs (Google News RSS).
 */
export function validateCardSource(input: {
  sourceName?: string | null;
  sourceUrl?: string | null;
}): string | null {
  const name = input.sourceName?.trim() ?? "";
  const url = input.sourceUrl?.trim() ?? "";
  if (!name) {
    return "Source name is required before publishing.";
  }
  if (!url) {
    return "Source URL is required before publishing.";
  }
  if (!isValidOptionalHttpUrl(url)) {
    return "Source URL must be a valid http(s) link.";
  }
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "news.google.com" || host.endsWith(".news.google.com")) {
      return "Source URL must be a direct article link (Google News shims are not citable).";
    }
  } catch {
    return "Source URL must be a valid http(s) link.";
  }
  return null;
}

function validateRestCardPublishable(card: {
  headline: string;
  newsBody?: string | null;
  summary?: string | null;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
}): string | null {
  if (!card.headline.trim()) {
    return "Rest card title is required to publish.";
  }
  if (!hasRestCardBodyContent({
    newsBody: card.newsBody ?? "",
    summary: card.summary ?? "",
  })) {
    return "Rest card body text or summary is required to publish.";
  }
  if (card.cardImageUrl?.trim() && !card.cardImageAlt?.trim()) {
    return "Card image alt text is required when an image URL is set.";
  }
  return null;
}

export function isValidOptionalHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateMarketPulseCardForm(
  values: MarketPulseCardFormValues,
  options?: {
    existingDayIndexes?: number[];
    excludeDayIndex?: number;
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const cardType = resolveMarketPulseCardType(values.cardType);

  if (isRestCardType(cardType)) {
    return validateRestMarketPulseCardForm(values, options);
  }

  return validateSignalMarketPulseCardForm(values, options);
}

/** Relaxed validation for builder draft saves — publish rules enforced separately. */
export function validateMarketPulseCardDraftSave(
  values: MarketPulseCardFormValues,
  options?: {
    existingDayIndexes?: number[];
    excludeDayIndex?: number;
    existingSortOrdersOnDay?: Array<{ sortOrder: number; exclude?: boolean }>;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const cardType = resolveMarketPulseCardType(values.cardType);

  if (isRestCardType(cardType)) {
    return validateRestMarketPulseCardDraftSave(values, options);
  }

  return validateSignalMarketPulseCardDraftSave(values, options);
}

export function validateCardPublishable(card: {
  cardType?: MarketPulseCardType | null;
  headline: string;
  companyName: string;
  ticker: string;
  summary: string | null;
  newsBody?: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaSignalLockedAt: Date | string | null;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}): string | null {
  if (isMarketPulseRestCard(card)) {
    return validateRestCardPublishable(card);
  }

  return validateSignalCardPublishable(card);
}

export function validateCardStatusPpa(input: {
  cardType?: MarketPulseCardType | null;
  status: MarketPulseCardStatus;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
}): string | null {
  if (!cardTypeRequiresPpa(input)) {
    return null;
  }

  if (!requiresPpaForStatus(input.status, resolveMarketPulseCardType(input.cardType))) {
    return null;
  }
  if (!input.ppaSignal) {
    return "PPA signal is required for READY or PUBLISHED status.";
  }
  if (!input.ppaInsight?.trim()) {
    return "PPA insight is required for READY or PUBLISHED status.";
  }
  return null;
}

export const DEFAULT_CARD_FORM_VALUES: MarketPulseCardFormValues = {
  cycleId: "",
  dayIndex: 1,
  sortOrder: 0,
  cardType: MARKET_PULSE_CARD_TYPE_SIGNAL,
  companyName: "",
  companyNameZh: "",
  ticker: "",
  exchange: "",
  logoUrl: "",
  logoInitials: "",
  priceLabel: "",
  priceDirection: "",
  headline: "",
  headlineZhHant: "",
  newsBody: "",
  newsBodyZhHant: "",
  sourceName: "",
  sourceUrl: "",
  sourceDate: "",
  cardImageUrl: "",
  cardImageAlt: "",
  cardImageAltZhHant: "",
  summary: "",
  summaryZhHant: "",
  userPrompt: MARKET_PULSE_DEFAULT_USER_PROMPT,
  userPromptZhHant: "",
  ppaSignal: "",
  ppaInsight: "",
  ppaInsightZhHant: "",
  status: "DRAFT",
  publishedAt: "",
  revealAt: "",
  changeReason: "",
};

export type MarketPulseAdminCardPreviewData = {
  companyName: string;
  companyNameZh?: string | null;
  ticker: string;
  exchange?: string | null;
  logoUrl?: string | null;
  logoInitials?: string | null;
  priceLabel?: string | null;
  priceDirection?: string | null;
  headline: string;
  newsBody?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
  summary?: string | null;
  userPrompt?: string | null;
  ppaSignal?: MarketPulseSignal | null;
  ppaInsight?: string | null;
  ppaSignalLockedAt?: string | null;
};

export function cardFormValuesToPreview(
  values: MarketPulseCardFormValues,
  lockedAt?: string | null,
): MarketPulseAdminCardPreviewData {
  return {
    companyName: values.companyName,
    companyNameZh: values.companyNameZh || null,
    ticker: values.ticker,
    exchange: values.exchange || null,
    logoUrl: values.logoUrl || null,
    logoInitials: values.logoInitials.trim() || null,
    priceLabel: values.priceLabel || null,
    priceDirection: values.priceDirection || null,
    headline: values.headline,
    newsBody: values.newsBody.trim() || null,
    sourceName: values.sourceName || null,
    sourceUrl: values.sourceUrl || null,
    sourceDate: values.sourceDate || null,
    cardImageUrl: values.cardImageUrl.trim() || null,
    cardImageAlt: values.cardImageAlt.trim() || null,
    summary: values.summary || null,
    userPrompt: values.userPrompt.trim() || null,
    ppaSignal: values.ppaSignal || null,
    ppaInsight: values.ppaInsight || null,
    ppaSignalLockedAt: lockedAt ?? null,
  };
}
