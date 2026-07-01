"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";

import MarketPulseSwipeCard from "@/components/market-pulse/MarketPulseSwipeCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { adminPreviewDataToSwipeCard } from "@/lib/market-pulse/admin-card-preview-data";
import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import { isMarketPulsePpaSignal } from "@/lib/market-pulse/card-type";
import { getSignalTone } from "@/lib/market-pulse/constants";

const noopSubmit = async () => ({ ok: true as const });

type Props = {
  card: MarketPulseAdminCardPreviewData;
  cardId?: string;
  className?: string;
  playerLive?: boolean;
  published?: boolean;
};

export default function MarketPulseAdminCardPreview({
  card,
  cardId = "admin-preview",
  className = "",
  playerLive = false,
  published = false,
}: Readonly<Props>) {
  const { t } = useTranslations();
  const swipeCard = useMemo(
    () => adminPreviewDataToSwipeCard(card, cardId),
    [card, cardId],
  );
  const locked = Boolean(card.ppaSignalLockedAt);
  const ppaTone = isMarketPulsePpaSignal(card.ppaSignal)
    ? getSignalTone(card.ppaSignal)
    : null;

  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      <div className="mb-3 space-y-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
            {t("auth.admin.mp.preview.banner")}
          </span>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
            {published && playerLive
              ? t("auth.admin.mp.preview.publishedLive")
              : t("auth.admin.mp.preview.draftPrivate")}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-sky-100/80">
          {t("auth.admin.mp.preview.decisionsDisabled")}
        </p>
      </div>

      <MarketPulseSwipeCard
        card={swipeCard}
        onSubmit={noopSubmit}
        disabled
        showDecisionControls
        className="pointer-events-none"
      />

      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200/90">
            {t("auth.admin.mp.preview.ppaAdminTitle")}
          </p>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-100">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {t("auth.admin.mp.preview.locked")}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-amber-100/70">
          {t("auth.admin.mp.preview.ppaHidden")}
        </p>

        {card.ppaSignal && ppaTone ? (
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${ppaTone.bgClass} ${ppaTone.borderClass} ${ppaTone.textClass}`}
            >
              {ppaTone.label}
            </span>
            {card.ppaInsight ? (
              <p className="mt-3 text-sm leading-relaxed text-amber-50/90">
                {card.ppaInsight}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-amber-100/50">
                {t("auth.admin.mp.preview.ppaInsightMissing")}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm italic text-amber-100/60">
            {t("auth.admin.mp.preview.ppaIncomplete")}
          </p>
        )}
      </div>
    </div>
  );
}
