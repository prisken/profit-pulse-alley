import type { MarketPulseCardStatus, MarketPulseSignal } from "@prisma/client";

export const MARKET_PULSE_CARD_STATUS_OPTIONS: MarketPulseCardStatus[] = [
  "DRAFT",
  "READY",
  "PUBLISHED",
  "CLOSED",
  "REVEALED",
];

export const MARKET_PULSE_SIGNAL_OPTIONS: MarketPulseSignal[] = [
  "BULLISH",
  "CAUTIOUS",
];

const PPA_REQUIRED_STATUSES: MarketPulseCardStatus[] = ["READY", "PUBLISHED"];

export const MARKET_PULSE_DEFAULT_USER_PROMPT =
  "What is your read on this signal?";

export const MARKET_PULSE_CARD_IMAGE_GUIDANCE =
  "Recommended image size: 1200 × 675 px, 16:9 ratio. Minimum 800 × 450 px. JPG, PNG, or WebP. Keep the subject centered because mobile cards may crop slightly.";

export type MarketPulseCardFormValues = {
  cycleId: string;
  dayIndex: number;
  companyName: string;
  companyNameZh: string;
  ticker: string;
  exchange: string;
  logoUrl: string;
  logoInitials: string;
  priceLabel: string;
  priceDirection: string;
  headline: string;
  newsBody: string;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  cardImageUrl: string;
  cardImageAlt: string;
  summary: string;
  userPrompt: string;
  ppaSignal: MarketPulseSignal | "";
  ppaInsight: string;
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

export function requiresPpaForStatus(status: MarketPulseCardStatus): boolean {
  return PPA_REQUIRED_STATUSES.includes(status);
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
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors: CardFormFieldErrors = {};

  if (!values.cycleId.trim()) {
    errors.cycleId = "Cycle is required.";
  }

  if (!Number.isInteger(values.dayIndex) || values.dayIndex < 1) {
    errors.dayIndex = "Day index must be a positive integer.";
  } else if (
    options?.existingDayIndexes?.includes(values.dayIndex) &&
    values.dayIndex !== options.excludeDayIndex
  ) {
    errors.dayIndex = "Day index must be unique within the cycle.";
  }

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

  if (requiresPpaForStatus(values.status)) {
    if (!values.ppaSignal) {
      errors.ppaSignal = "PPA signal is required for READY or PUBLISHED status.";
    }
    if (!values.ppaInsight.trim()) {
      errors.ppaInsight = "PPA insight is required for READY or PUBLISHED status.";
    }
  }

  if (values.publishedAt.trim() && !parseCardDate(values.publishedAt)) {
    errors.publishedAt = "Invalid published date.";
  }
  if (values.revealAt.trim() && !parseCardDate(values.revealAt)) {
    errors.revealAt = "Invalid reveal date.";
  }
  if (values.sourceDate.trim() && !parseCardDate(values.sourceDate)) {
    errors.sourceDate = "Invalid news published date.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Relaxed validation for builder draft saves — publish rules enforced separately. */
export function validateMarketPulseCardDraftSave(
  values: MarketPulseCardFormValues,
  options?: {
    existingDayIndexes?: number[];
    excludeDayIndex?: number;
  },
): { valid: boolean; errors: CardFormFieldErrors } {
  const errors: CardFormFieldErrors = {};

  if (!values.cycleId.trim()) {
    errors.cycleId = "Cycle is required.";
  }

  if (!Number.isInteger(values.dayIndex) || values.dayIndex < 1) {
    errors.dayIndex = "Day index must be a positive integer.";
  } else if (
    options?.existingDayIndexes?.includes(values.dayIndex) &&
    values.dayIndex !== options.excludeDayIndex
  ) {
    errors.dayIndex = "Day index must be unique within the cycle.";
  }

  if (!values.companyName.trim()) {
    errors.companyName = "Company name is required.";
  }
  if (!values.ticker.trim()) {
    errors.ticker = "Ticker is required.";
  }
  if (!values.headline.trim()) {
    errors.headline = "News headline is required.";
  }

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

  if (values.publishedAt.trim() && !parseCardDate(values.publishedAt)) {
    errors.publishedAt = "Invalid published date.";
  }
  if (values.revealAt.trim() && !parseCardDate(values.revealAt)) {
    errors.revealAt = "Invalid reveal date.";
  }
  if (values.sourceDate.trim() && !parseCardDate(values.sourceDate)) {
    errors.sourceDate = "Invalid news published date.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCardPublishable(card: {
  headline: string;
  companyName: string;
  ticker: string;
  summary: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaSignalLockedAt: Date | string | null;
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
  return null;
}

export function validateCardStatusPpa(input: {
  status: MarketPulseCardStatus;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
}): string | null {
  if (!requiresPpaForStatus(input.status)) {
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
  companyName: "",
  companyNameZh: "",
  ticker: "",
  exchange: "",
  logoUrl: "",
  logoInitials: "",
  priceLabel: "",
  priceDirection: "",
  headline: "",
  newsBody: "",
  sourceName: "",
  sourceUrl: "",
  sourceDate: "",
  cardImageUrl: "",
  cardImageAlt: "",
  summary: "",
  userPrompt: MARKET_PULSE_DEFAULT_USER_PROMPT,
  ppaSignal: "",
  ppaInsight: "",
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
