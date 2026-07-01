import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardReleasedForPlay } from "@/lib/market-pulse/card-release-schedule";
import { getMissingPpaFields } from "@/lib/market-pulse/reveal-ppa-validation";

export type AdminCardPpaStatusKind =
  | "complete"
  | "missing_signal"
  | "missing_insight"
  | "not_locked"
  | "missing_signal_insight";

export type AdminCardPpaStatus = {
  kind: AdminCardPpaStatusKind;
  needsPpa: boolean;
  missingFields: ReturnType<typeof getMissingPpaFields>;
};

export type AdminCardPpaCardInput = Pick<
  MarketPulseAdminCardRow,
  "ppaSignal" | "ppaInsight" | "ppaSignalLockedAt"
>;

export function cardNeedsPpa(card: AdminCardPpaCardInput): boolean {
  return getMissingPpaFields(card).length > 0;
}

export function getAdminCardPpaStatus(card: AdminCardPpaCardInput): AdminCardPpaStatus {
  const missingFields = getMissingPpaFields(card);

  if (missingFields.length === 0) {
    return { kind: "complete", needsPpa: false, missingFields };
  }

  const missingSignal = missingFields.includes("ppaSignal");
  const missingInsight = missingFields.includes("ppaInsight");

  if (missingSignal && missingInsight) {
    return { kind: "missing_signal_insight", needsPpa: true, missingFields };
  }
  if (missingSignal) {
    return { kind: "missing_signal", needsPpa: true, missingFields };
  }
  if (missingInsight) {
    return { kind: "missing_insight", needsPpa: true, missingFields };
  }

  return { kind: "not_locked", needsPpa: true, missingFields };
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
