import type { MarketPulseSignal } from "@prisma/client";

import type { MarketPulseCardType } from "@prisma/client";

import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import { isValidOptionalHttpUrl } from "@/lib/market-pulse/card-validation";

export type GuidedCardFieldErrors = Partial<
  Record<
    | "headline"
    | "newsBody"
    | "companyName"
    | "ticker"
    | "summary"
    | "dayIndex"
    | "cardImageUrl"
    | "cardImageAlt"
    | "priceLabel"
    | "ppaSignal"
    | "ppaInsight",
    string
  >
>;

export type GuidedSignalCardSaveInput = {
  cardType: "SIGNAL";
  headline: string;
  newsBody: string;
  companyName: string;
  ticker: string;
  summary: string;
  dayIndex: number;
  priceLabel?: string;
  cardImageUrl?: string;
  cardImageAlt?: string;
};

export type GuidedRestCardSaveInput = {
  cardType: "REST";
  headline: string;
  newsBody: string;
  dayIndex: number;
  cardImageUrl?: string;
  cardImageAlt?: string;
};

export type GuidedCardSaveInput =
  | GuidedSignalCardSaveInput
  | GuidedRestCardSaveInput;

export type GuidedPpaApproveInput = {
  ppaSignal: MarketPulseSignal | "";
  ppaInsight: string;
};

export type GuidedSaveBlockingFieldId = "dayIndex" | "cardImageUrl" | "cardImageAlt";

function validateGuidedMediaFields(input: {
  cardImageUrl?: string;
  cardImageAlt?: string;
}): GuidedCardFieldErrors {
  const errors: GuidedCardFieldErrors = {};
  const imageUrl = input.cardImageUrl?.trim() ?? "";
  const imageAlt = input.cardImageAlt?.trim() ?? "";

  if (imageUrl && !isValidOptionalHttpUrl(imageUrl)) {
    errors.cardImageUrl = "Image URL must be a valid http(s) link.";
  }
  if (imageUrl && !imageAlt) {
    errors.cardImageAlt = "Image alt text is required when image URL is provided.";
  }

  return errors;
}

function validateGuidedDayIndex(dayIndex: number): GuidedCardFieldErrors {
  if (!Number.isFinite(dayIndex) || dayIndex < 1) {
    return { dayIndex: "Day must be at least 1." };
  }
  return {};
}

export function collectGuidedSaveBlockingFields(input: {
  dayIndex: number;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
}): GuidedSaveBlockingFieldId[] {
  const missing: GuidedSaveBlockingFieldId[] = [];
  const dayErrors = validateGuidedDayIndex(input.dayIndex);
  if (dayErrors.dayIndex) {
    missing.push("dayIndex");
  }

  const mediaErrors = validateGuidedMediaFields({
    cardImageUrl: input.cardImageUrl?.trim() || undefined,
    cardImageAlt: input.cardImageAlt?.trim() || undefined,
  });
  if (mediaErrors.cardImageUrl) {
    missing.push("cardImageUrl");
  }
  if (mediaErrors.cardImageAlt) {
    missing.push("cardImageAlt");
  }

  return missing;
}

export function validateGuidedSignalCardSave(
  input: GuidedSignalCardSaveInput,
): { valid: boolean; errors: GuidedCardFieldErrors; error: string | null } {
  const errors: GuidedCardFieldErrors = {
    ...validateGuidedDayIndex(input.dayIndex),
    ...validateGuidedMediaFields(input),
  };

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors).find(Boolean) ?? "Invalid card data.";
    return { valid: false, errors, error: firstError };
  }

  return { valid: true, errors: {}, error: null };
}

export function validateGuidedRestCardSave(
  input: GuidedRestCardSaveInput,
): { valid: boolean; errors: GuidedCardFieldErrors; error: string | null } {
  const errors: GuidedCardFieldErrors = {
    ...validateGuidedDayIndex(input.dayIndex),
    ...validateGuidedMediaFields(input),
  };

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors).find(Boolean) ?? "Invalid card data.";
    return { valid: false, errors, error: firstError };
  }

  return { valid: true, errors: {}, error: null };
}

export function validateGuidedCardSave(
  input: GuidedCardSaveInput,
): { valid: boolean; errors: GuidedCardFieldErrors; error: string | null } {
  if (input.cardType === "REST") {
    return validateGuidedRestCardSave(input);
  }
  return validateGuidedSignalCardSave(input);
}

export function validateGuidedPpaApprove(
  input: GuidedPpaApproveInput,
): { valid: boolean; errors: GuidedCardFieldErrors; error: string | null } {
  const errors: GuidedCardFieldErrors = {};

  if (!input.ppaSignal) {
    errors.ppaSignal = "PPA decision is missing.";
  }
  if (!input.ppaInsight.trim()) {
    errors.ppaInsight = "PPA insight is missing.";
  }

  if (Object.keys(errors).length > 0) {
    const firstError =
      errors.ppaSignal ?? errors.ppaInsight ?? "PPA approval is incomplete.";
    return { valid: false, errors, error: firstError };
  }

  return { valid: true, errors: {}, error: null };
}

export function guidedRestSummaryFromBody(newsBody: string): string | null {
  const trimmed = newsBody.trim();
  return trimmed || null;
}

export function isGuidedCardSaveAllowed(
  card: Pick<{ status: string }, "status">,
): boolean {
  return card.status !== "PUBLISHED";
}

export function guidedCardTypeLabel(
  cardType: MarketPulseCardType | null | undefined,
): "Signal" | "Market Rest" {
  return isMarketPulseRestCard({ cardType }) ? "Market Rest" : "Signal";
}
