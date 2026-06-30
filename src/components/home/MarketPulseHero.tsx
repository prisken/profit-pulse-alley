"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

import HomeHeroSignalPreview from "@/components/home/HomeHeroSignalPreview";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import MarketPulseTrackedLink from "@/components/market-pulse/MarketPulseTrackedLink";
import {
  MarketPulseGlowBackground,
  MarketPulseProofChip,
  MarketPulseStatusChip,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { getHomeHeroCountdown } from "@/lib/market-pulse/challenge-cycle";
import { MARKET_PULSE_ANALYTICS_EVENTS } from "@/lib/market-pulse/analytics";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";

const PROOF_CHIP_KEYS = [
  "home.hero.proof.dailySignals",
  "home.hero.proof.leaderboard",
  "home.hero.proof.ppaReveal",
  "home.hero.proof.prize",
] as const;

const PROOF_VARIANTS = [
  "dailySignal",
  "participation",
  "ppaInsight",
  "prize",
] as const;

export default function MarketPulseHero() {
  const { t } = useTranslations();
  const initialCountdown = getHomeHeroCountdown();
  const preLaunch = isBeforePublicLaunch();

  const primaryHref = preLaunch ? "/market-pulse" : "/market-pulse/play";
  const primaryLabel = preLaunch
    ? t("home.hero.ctaEnter")
    : t("home.hero.ctaPlayToday");
  const primaryAria = preLaunch
    ? t("home.hero.ctaEnterAria")
    : t("home.hero.ctaPlayTodayAria");
  const heroCtaName = preLaunch ? "enter_hub" : "play_today";
  const heroStatus = preLaunch ? "pre_launch" : "live";

  return (
    <MarketPulseGlowBackground
      accent="dual"
      showGrid
      className="px-3 py-8 sm:px-6 sm:py-14 lg:py-16"
      innerClassName="mx-auto w-full max-w-6xl"
    >
      <section aria-labelledby="market-pulse-heading">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <MarketPulseStatusChip
              variant={preLaunch ? "preLaunch" : "live"}
              label={preLaunch ? t("home.hero.badgePreLaunch") : t("home.hero.badgeLive")}
              icon={<TrendingUp aria-hidden="true" />}
              showPulse={!preLaunch}
              className="motion-reduce:[&_span]:animate-none"
            />

            <div className="mt-4 sm:mt-5">
              <MarketPulseLogo
                variant="header"
                priority
                className="mx-auto h-8 w-auto sm:h-9 lg:mx-0"
              />
              <h1
                id="market-pulse-heading"
                className="mt-3 text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:mt-4 sm:text-3xl md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
              >
                {t("home.hero.headline")}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base md:text-lg lg:mx-0">
                {t("home.hero.subheadline")}
              </p>
            </div>

            <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <MarketPulseTrackedLink
                href={primaryHref}
                aria-label={primaryAria}
                event={MARKET_PULSE_ANALYTICS_EVENTS.hero_cta_clicked}
                payload={{
                  surface: "home",
                  cta: heroCtaName,
                  status: heroStatus,
                }}
                className={mergeMpClasses(
                  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500 sm:w-auto sm:min-w-[12rem] sm:px-8",
                  MP_FOCUS_RING,
                )}
              >
                {primaryLabel}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </MarketPulseTrackedLink>
              <Link
                href="/market-pulse/rules"
                aria-label={t("home.hero.ctaSecondaryAria")}
                className={mergeMpClasses(
                  "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/10 sm:w-auto sm:px-8",
                  MP_FOCUS_RING,
                )}
              >
                {t("home.hero.ctaSecondary")}
              </Link>
            </div>

            <ul className="mt-5 flex max-w-xl flex-wrap justify-center gap-2 sm:mt-6 lg:justify-start">
              {PROOF_CHIP_KEYS.map((key, index) => (
                <li key={key} className="max-w-full">
                  <MarketPulseProofChip
                    label={t(key)}
                    variant={PROOF_VARIANTS[index]}
                  />
                </li>
              ))}
            </ul>
          </div>

          <HomeHeroSignalPreview initialCountdown={initialCountdown} />
        </div>
      </section>
    </MarketPulseGlowBackground>
  );
}
