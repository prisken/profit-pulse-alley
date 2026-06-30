"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

import ChallengeCountdown from "@/components/home/ChallengeCountdown";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { siteLocaleToMarketPulseLocale } from "@/lib/i18n/locales";
import { getChallengeCountdown } from "@/lib/market-pulse/challenge-cycle";
import {
  getMarketPulseLaunchMessages,
  isBeforePublicLaunch,
} from "@/lib/market-pulse/launch-config";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export default function MarketPulseHero() {
  const { t, locale } = useTranslations();
  const initialCountdown = getChallengeCountdown();
  const preLaunch = isBeforePublicLaunch();
  const messages = getMarketPulseLaunchMessages(
    siteLocaleToMarketPulseLocale(locale),
  );

  return (
    <section
      className="relative overflow-hidden bg-zinc-950 px-3 py-6 sm:px-6 sm:py-14 md:py-16 lg:py-20"
      aria-labelledby="market-pulse-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.18),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <article className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/95 to-zinc-950 p-4 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-8 md:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-amber-400/8 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center gap-3 text-center sm:gap-6 md:items-start md:gap-8 md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              {preLaunch ? t("home.hero.badgePreLaunch") : t("home.hero.badgeLive")}
            </div>

            {preLaunch ? (
              <MarketPulseLaunchAnnouncement
                variant="hero"
                className="w-full text-left"
              />
            ) : null}

            <div className="space-y-2 sm:space-y-4">
              <h1
                id="market-pulse-heading"
                className="flex justify-center md:justify-start"
              >
                <MarketPulseLogo variant="hero" priority />
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-sm leading-snug text-zinc-200 sm:text-lg md:mx-0 md:text-xl md:leading-relaxed">
                {t("home.hero.tagline")}
              </p>
              {!preLaunch ? (
                <p className="mx-auto max-w-xl text-pretty text-xs text-amber-200/90 sm:text-sm md:mx-0 md:text-base">
                  {messages.prize}
                </p>
              ) : null}
            </div>

            <Link
              href="/market-pulse"
              className={`inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500 sm:w-auto sm:min-w-[12rem] sm:px-8 sm:py-3.5 sm:text-lg ${focusRing}`}
            >
              {preLaunch ? t("home.hero.ctaExplore") : t("home.hero.ctaPlay")}
              <ArrowRight className="h-5 w-5 sm:hidden" aria-hidden="true" />
            </Link>

            <div className="w-full md:max-w-md">
              <ChallengeCountdown initial={initialCountdown} className="md:hidden" />
              <ChallengeCountdown
                initial={initialCountdown}
                large
                className="hidden md:block"
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
