import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardReleasedForPlay } from "@/lib/market-pulse/card-release-schedule";
import {
  isMarketPulseRestCard,
  MARKET_PULSE_REST_CARD_PPA_ADMIN_LABEL,
  type MarketPulseCardTypeSource,
} from "@/lib/market-pulse/card-type";
import { getMissingPpaFields } from "@/lib/market-pulse/reveal-ppa-validation";

export type AdminCardPpaStatusKind =
  | "complete"
  | "rest_card"
  | "missing_signal"
  | "missing_insight"
  | "not_locked"
  | "missing_signal_insight";

export type AdminCardPpaStatus = {
  kind: AdminCardPpaStatusKind;
  needsPpa: boolean;
  label: string;
  missingFields: ReturnType<typeof getMissingPpaFields>;
};

export type AdminCardPpaCardInput = MarketPulseCardTypeSource &
  Pick<MarketPulseAdminCardRow, "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt">;

export function cardNeedsPpa(card: AdminCardPpaCardInput): boolean {
  if (isMarketPulseRestCard(card)) {
    return false;
  }

  return getMissingPpaFields(card).length > 0;
}

export function getAdminCardPpaStatus(card: AdminCardPpaCardInput): AdminCardPpaStatus {
  if (isMarketPulseRestCard(card)) {
    return {
      kind: "rest_card",
      needsPpa: false,
      label: MARKET_PULSE_REST_CARD_PPA_ADMIN_LABEL,
      missingFields: [],
    };
  }

  const missingFields = getMissingPpaFields(card);

  if (missingFields.length === 0) {
    return {
      kind: "complete",
      needsPpa: false,
      label: "PPA complete",
      missingFields,
    };
  }

  const missingSignal = missingFields.includes("ppaSignal");
  const missingInsight = missingFields.includes("ppaInsight");

  if (missingSignal && missingInsight) {
    return {
      kind: "missing_signal_insight",
      needsPpa: true,
      label: "Needs PPA signal and insight",
      missingFields,
    };
  }
  if (missingSignal) {
    return {
      kind: "missing_signal",
      needsPpa: true,
      label: "Needs PPA signal",
      missingFields,
    };
  }
  if (missingInsight) {
    return {
      kind: "missing_insight",
      needsPpa: true,
      label: "Needs PPA insight",
      missingFields,
    };
  }

  return {
    kind: "not_locked",
    needsPpa: true,
    label: "PPA not locked",
    missingFields,
  };
}

export function isCardLiveForPlayers(
  card: Pick<MarketPulseAdminCardRow, "status" | "publishedAt" | "dayIndex">,
  cycleStartsAt: Date | string,
  now: Date = new Date(),
): boolean {
  return isCardReleasedForPlay(
    {
      status: card.status,
      publishedAt: card.publishedAt ? new Date(card.publishedAt) : null,
      dayIndex: card.dayIndex,
    },
    { startsAt: new Date(cycleStartsAt) },
    now,
  );
}
