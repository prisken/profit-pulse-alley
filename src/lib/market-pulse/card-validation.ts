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

export type MarketPulseCardFormValues = {
  cycleId: string;
  dayIndex: number;
  companyName: string;
  companyNameZh: string;
  ticker: string;
  exchange: string;
  logoUrl: string;
  priceLabel: string;
  priceDirection: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  summary: string;
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
    errors.headline = "Headline is required.";
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
    errors.sourceDate = "Invalid source date.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCardPublishable(card: {
  headline: string;
  companyName: string;
  ticker: string;
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
  priceLabel: "",
  priceDirection: "",
  headline: "",
  sourceName: "",
  sourceUrl: "",
  sourceDate: "",
  summary: "",
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
  priceLabel?: string | null;
  priceDirection?: string | null;
  headline: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  summary?: string | null;
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
    priceLabel: values.priceLabel || null,
    priceDirection: values.priceDirection || null,
    headline: values.headline,
    sourceName: values.sourceName || null,
    sourceUrl: values.sourceUrl || null,
    sourceDate: values.sourceDate || null,
    summary: values.summary || null,
    ppaSignal: values.ppaSignal || null,
    ppaInsight: values.ppaInsight || null,
    ppaSignalLockedAt: lockedAt ?? null,
  };
}
