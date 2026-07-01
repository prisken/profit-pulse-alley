import type { MarketPulseCardStatus, MarketPulseCardType, MarketPulseCycleStatus } from "@prisma/client";

import type { AdminCardPpaStatusKind } from "@/lib/market-pulse/admin-card-ppa-status";
import {
  isRestCardType,
  MARKET_PULSE_CARD_TYPE_ADMIN_LABELS,
} from "@/lib/market-pulse/card-type";
import type { MessageKey } from "@/lib/i18n/messages";

const PPA_STATUS_I18N: Record<AdminCardPpaStatusKind, MessageKey> = {
  complete: "auth.admin.mp.cards.ppaStatus.complete",
  rest_card: "auth.admin.mp.cards.ppaStatus.restCard",
  missing_signal: "auth.admin.mp.cards.ppaStatus.missingSignal",
  missing_insight: "auth.admin.mp.cards.ppaStatus.missingInsight",
  not_locked: "auth.admin.mp.cards.ppaStatus.notLocked",
  missing_signal_insight: "auth.admin.mp.cards.ppaStatus.missingSignalInsight",
};

export function CycleStatusBadge({ status }: Readonly<{ status: MarketPulseCycleStatus }>) {
  const className = cycleStatusBadgeClass(status);

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {status}
    </span>
  );
}

export function cycleStatusBadgeClass(status: MarketPulseCycleStatus | string): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "CLOSED":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "REVEALED":
      return "bg-violet-500/15 text-violet-200 ring-violet-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-zinc-700";
  }
}

export function CardStatusBadge({ status }: Readonly<{ status: MarketPulseCardStatus }>) {
  const className = statusBadgeClass(status);

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {status}
    </span>
  );
}

export function statusBadgeClass(status: MarketPulseCardStatus | string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "READY":
      return "bg-sky-500/15 text-sky-200 ring-sky-500/30";
    case "CLOSED":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "REVEALED":
      return "bg-violet-500/15 text-violet-200 ring-violet-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-zinc-700";
  }
}

export function IndicatorBadge({
  label,
  tone,
}: Readonly<{ label: string; tone: "ok" | "warn" | "neutral" | "error" }>) {
  const className =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-200 ring-amber-500/30"
        : tone === "error"
          ? "bg-red-500/15 text-red-200 ring-red-500/40"
          : "bg-zinc-800 text-zinc-400 ring-zinc-700";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

export function ppaStatusBadgeTone(
  kind: AdminCardPpaStatusKind,
  revealUrgent: boolean,
): "ok" | "warn" | "error" {
  if (kind === "complete" || kind === "rest_card") {
    return "ok";
  }
  return revealUrgent ? "error" : "warn";
}

export function getPpaStatusMessageKey(kind: AdminCardPpaStatusKind): MessageKey {
  return PPA_STATUS_I18N[kind];
}

export function PpaStatusBadge({
  label,
  tone,
}: Readonly<{ label: string; tone: "ok" | "warn" | "error" }>) {
  return <IndicatorBadge label={label} tone={tone} />;
}

export function CardTypeBadge({
  cardType,
}: Readonly<{ cardType: MarketPulseCardType }>) {
  if (!isRestCardType(cardType)) {
    return null;
  }

  return (
    <IndicatorBadge
      label={MARKET_PULSE_CARD_TYPE_ADMIN_LABELS.REST}
      tone="neutral"
    />
  );
}
