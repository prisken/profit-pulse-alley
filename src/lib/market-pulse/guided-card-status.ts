import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import {
  isPlaceholderDraftContent,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
} from "@/lib/market-pulse/cycle-card-defaults";
import { getMissingPpaFields } from "@/lib/market-pulse/reveal-ppa-validation";

export type GuidedCardStatus =
  | "published"
  | "missing_content"
  | "missing_ppa"
  | "ready";

export type GuidedCardStatusInput = Pick<
  MarketPulseAdminCardRow,
  | "cardType"
  | "status"
  | "headline"
  | "newsBody"
  | "companyName"
  | "ticker"
  | "summary"
  | "ppaSignal"
  | "ppaInsight"
  | "ppaSignalLockedAt"
>;

export type GuidedSignalContentFieldId =
  | "headline"
  | "newsBody"
  | "companyName"
  | "ticker"
  | "summary";

export type GuidedRestContentFieldId = "headline" | "newsBody";

export function collectGuidedSignalMissingContentFields(
  card: Pick<
    GuidedCardStatusInput,
    "headline" | "newsBody" | "companyName" | "ticker" | "summary"
  >,
): GuidedSignalContentFieldId[] {
  const missing: GuidedSignalContentFieldId[] = [];

  if (isPlaceholderDraftContent(card)) {
    missing.push("headline", "companyName", "ticker");
  }

  if (!card.headline?.trim() && !missing.includes("headline")) {
    missing.push("headline");
  }
  if (!card.newsBody?.trim()) {
    missing.push("newsBody");
  }
  if (!card.companyName?.trim() && !missing.includes("companyName")) {
    missing.push("companyName");
  }
  if (!card.ticker?.trim() && !missing.includes("ticker")) {
    missing.push("ticker");
  }
  if (!card.summary?.trim()) {
    missing.push("summary");
  }

  return missing;
}

export function collectGuidedRestMissingContentFields(
  card: Pick<GuidedCardStatusInput, "headline" | "newsBody">,
): GuidedRestContentFieldId[] {
  const headline = card.headline?.trim() ?? "";
  const newsBody = card.newsBody?.trim() ?? "";
  const missing: GuidedRestContentFieldId[] = [];

  if (!headline) {
    missing.push("headline");
  }
  if (!newsBody) {
    missing.push("newsBody");
  }

  if (
    headline === QUICK_REST_DRAFT_CARD_HEADLINE &&
    newsBody === QUICK_REST_DRAFT_CARD_NEWS_BODY
  ) {
    if (!missing.includes("headline")) {
      missing.push("headline");
    }
    if (!missing.includes("newsBody")) {
      missing.push("newsBody");
    }
  }

  return missing;
}

export function isGuidedSignalContentComplete(
  card: Pick<
    GuidedCardStatusInput,
    "headline" | "newsBody" | "companyName" | "ticker" | "summary"
  >,
): boolean {
  return collectGuidedSignalMissingContentFields(card).length === 0;
}

export function isGuidedRestContentComplete(
  card: Pick<GuidedCardStatusInput, "headline" | "newsBody">,
): boolean {
  return collectGuidedRestMissingContentFields(card).length === 0;
}

export function isGuidedCardContentComplete(card: GuidedCardStatusInput): boolean {
  if (isMarketPulseRestCard(card)) {
    return isGuidedRestContentComplete(card);
  }

  return isGuidedSignalContentComplete(card);
}

export function isGuidedPpaApproved(
  card: Pick<
    GuidedCardStatusInput,
    "cardType" | "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt"
  >,
): boolean {
  if (isMarketPulseRestCard(card)) {
    return true;
  }

  return getMissingPpaFields(card).length === 0;
}

export function getGuidedCardStatus(card: GuidedCardStatusInput): GuidedCardStatus {
  if (isCardPublished(card)) {
    return "published";
  }

  if (!isGuidedCardContentComplete(card)) {
    return "missing_content";
  }

  if (!isGuidedPpaApproved(card)) {
    return "missing_ppa";
  }

  return "ready";
}

export const GUIDED_CARD_STATUS_LABELS: Record<GuidedCardStatus, string> = {
  published: "Published",
  missing_content: "Missing content",
  missing_ppa: "Missing PPA",
  ready: "Ready",
};
