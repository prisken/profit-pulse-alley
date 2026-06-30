"use client";

import {
  MarketPulseDecisionPreviewPair,
  MarketPulseProofChip,
  MarketPulseSurface,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";

export default function PlayDecorativeSignalPreview() {
  const { t } = useTranslations();

  return (
    <div
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={t("mp.play.state.preview.ariaLabel")}
    >
      <MarketPulseSurface
        variant="glass"
        density="compact"
        showOrbs
        className="border-emerald-500/15 shadow-lg shadow-black/30"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MarketPulseProofChip
              label={t("mp.play.state.preview.signalLabel")}
              variant="dailySignal"
            />
            <MarketPulseProofChip
              label={t("mp.play.state.preview.sample")}
              variant="participation"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-white/15 bg-black/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400/90">
              {t("mp.play.state.preview.signalLabel")}
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-white">
              {t("mp.play.state.preview.headline")}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("mp.play.state.preview.yourCall")}
            </p>
            <MarketPulseDecisionPreviewPair
              className="mt-2"
              bullishLabel={t("signal.bullish")}
              cautiousLabel={t("signal.cautious")}
            />
          </div>
        </div>
      </MarketPulseSurface>
    </div>
  );
}
