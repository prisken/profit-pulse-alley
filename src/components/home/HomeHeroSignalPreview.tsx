"use client";

import type { ReactNode } from "react";
import { Gift, Trophy } from "lucide-react";

import ChallengeCountdown from "@/components/home/ChallengeCountdown";
import {
  MarketPulseDecisionPreviewPair,
  MarketPulseMockLeaderboardRows,
  MarketPulseProofChip,
  MarketPulseSurface,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { ChallengeCountdown as ChallengeCountdownState } from "@/lib/market-pulse/types";

export type HomeHeroSignalPreviewProps = Readonly<{
  initialCountdown: ChallengeCountdownState;
}>;

export default function HomeHeroSignalPreview({
  initialCountdown,
}: HomeHeroSignalPreviewProps) {
  const { t } = useTranslations();

  return (
    <div
      className="relative w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end"
      role="img"
      aria-label={t("home.hero.preview.ariaLabel")}
    >
      <MarketPulseSurface
        variant="glass"
        density="compact"
        showOrbs
        className="border-emerald-500/15 shadow-2xl shadow-black/40"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MarketPulseProofChip
              label={t("home.hero.preview.signalLabel")}
              variant="dailySignal"
            />
            <MarketPulseProofChip
              label={t("home.hero.preview.cycle")}
              variant="participation"
            />
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-white/80 bg-black p-3 shadow-lg shadow-black/40 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
              {t("home.hero.preview.signalLabel")}
            </p>
            <p className="mt-1.5 text-balance text-sm font-bold leading-snug text-white sm:text-base">
              {t("home.hero.preview.headline")}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("home.hero.preview.yourCall")}
            </p>
            <MarketPulseDecisionPreviewPair
              className="mt-2"
              bullishLabel={t("signal.bullish")}
              cautiousLabel={t("signal.cautious")}
              activeDecision="BULLISH"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            <p className="text-xs font-medium leading-snug text-amber-100 sm:text-sm">
              {t("home.hero.preview.prize")}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-emerald-300/90">
              <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold text-white sm:text-sm">
                {t("home.hero.preview.leaderboard")}
              </p>
            </div>
            <MarketPulseMockLeaderboardRows compact showScores={false} />
          </div>

          <StatusModule countdown={<ChallengeCountdown initial={initialCountdown} />} />
        </div>
      </MarketPulseSurface>
    </div>
  );
}

function StatusModule({ countdown }: Readonly<{ countdown: ReactNode }>) {
  const { t } = useTranslations();

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {t("home.hero.preview.statusLabel")}
      </p>
      <div className="mt-2">{countdown}</div>
    </div>
  );
}
