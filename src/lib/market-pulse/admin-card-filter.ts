import type { MarketPulseCardStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { cardNeedsPpa } from "@/lib/market-pulse/admin-card-ppa-status";

export type AdminCardPublishFilter = "ALL" | "PUBLISHED" | "UNPUBLISHED";
export type AdminCardStatusFilter = "ALL" | MarketPulseCardStatus;

export type AdminCardFilterState = {
  cycleId: string;
  status: AdminCardStatusFilter;
  publishFilter: AdminCardPublishFilter;
  missingImageOnly: boolean;
  needsPpaOnly: boolean;
};

export const DEFAULT_ADMIN_CARD_FILTERS: AdminCardFilterState = {
  cycleId: "ALL",
  status: "ALL",
  publishFilter: "ALL",
  missingImageOnly: false,
  needsPpaOnly: false,
};

export function isCardPublished(card: Pick<MarketPulseAdminCardRow, "status">): boolean {
  return card.status === "PUBLISHED";
}

export function isCardImageMissing(
  card: Pick<MarketPulseAdminCardRow, "cardImageUrl">,
): boolean {
  return !card.cardImageUrl?.trim();
}

export function isCardPpaUnlocked(
  card: Pick<MarketPulseAdminCardRow, "ppaSignalLockedAt">,
): boolean {
  return !card.ppaSignalLockedAt;
}

export function isCardNeedsPpa(
  card: Pick<MarketPulseAdminCardRow, "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt">,
): boolean {
  return cardNeedsPpa(card);
}

export function filterAdminCards<T extends MarketPulseAdminCardRow>(
  cards: T[],
  filters: AdminCardFilterState,
): T[] {
  return cards.filter((card) => {
    if (filters.cycleId !== "ALL" && card.cycleId !== filters.cycleId) {
      return false;
    }

    if (filters.status !== "ALL" && card.status !== filters.status) {
      return false;
    }

    if (filters.publishFilter === "PUBLISHED" && !isCardPublished(card)) {
      return false;
    }

    if (filters.publishFilter === "UNPUBLISHED" && isCardPublished(card)) {
      return false;
    }

    if (filters.missingImageOnly && !isCardImageMissing(card)) {
      return false;
    }

    if (filters.needsPpaOnly && !isCardNeedsPpa(card)) {
      return false;
    }

    return true;
  });
}
