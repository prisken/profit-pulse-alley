import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { getAdminCardPpaStatus } from "@/lib/market-pulse/admin-card-ppa-status";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { validateCardPublishable } from "@/lib/market-pulse/card-validation";
import { isQuickDraftCardContent } from "@/lib/market-pulse/cycle-card-defaults";

export type BuilderCardValidationStatus =
  | "published"
  | "ready_to_publish"
  | "missing_required"
  | "ppa_incomplete";

export function getBuilderCardValidationStatus(
  card: MarketPulseAdminCardRow,
): BuilderCardValidationStatus {
  if (isCardPublished(card)) {
    return "published";
  }

  if (isQuickDraftCardContent(card)) {
    return "missing_required";
  }

  const ppaStatus = getAdminCardPpaStatus(card);
  if (ppaStatus.needsPpa) {
    return "ppa_incomplete";
  }

  const publishError = validateCardPublishable({
    headline: card.headline,
    companyName: card.companyName,
    ticker: card.ticker,
    summary: card.summary,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  });

  if (publishError) {
    return "missing_required";
  }

  return "ready_to_publish";
}
