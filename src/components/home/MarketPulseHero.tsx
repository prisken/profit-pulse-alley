"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

import HomeMarketPulseSimulator from "@/components/home/HomeMarketPulseSimulator";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import MarketPulseTrackedLink from "@/components/market-pulse/MarketPulseTrackedLink";
import {
  MarketPulseGlowBackground,
  MarketPulseStatusChip,
  MP_FOCUS_RING,
  MP_PRIMARY_BTN,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { MARKET_PULSE_ANALYTICS_EVENTS } from "@/lib/market-pulse/analytics";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";

export default function MarketPulseHero() {
  const { t } = useTranslations();
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
      accent="neutral"
      showGrid
      className="px-3 py-5 sm:px-6 sm:py-8 lg:py-10"
      innerClassName="mx-auto w-full max-w-6xl"
    >
      <section aria-labelledby="market-pulse-heading">
        <div className="grid min-w-0 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-10">
          <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <MarketPulseStatusChip
              variant={preLaunch ? "preLaunch" : "live"}
              label={preLaunch ? t("home.hero.badgePreLaunch") : t("home.hero.badgeLive")}
              icon={<TrendingUp aria-hidden="true" />}
              showPulse={!preLaunch}
              className="motion-reduce:[&_span]:animate-none"
            />

            <div className="mt-3 sm:mt-3.5">
              <MarketPulseLogo
                variant="header"
                priority
                className="mx-auto h-7 w-auto sm:h-8 lg:mx-0"
              />
              <h1
                id="market-pulse-heading"
                className="mt-2.5 text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:mt-3 sm:text-3xl md:text-[2rem] lg:text-[2.25rem] lg:leading-[1.15]"
              >
                {t("home.hero.headline")}
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-relaxed text-mp-muted sm:mt-2.5 sm:text-base lg:mx-0">
                {t("home.hero.subheadline")}
              </p>
            </div>

            <div className="mt-4 flex w-full flex-col gap-2 sm:mt-5 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
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
                  MP_PRIMARY_BTN,
                  "min-h-12 w-full px-6 py-3 text-base sm:w-auto sm:min-w-[12rem] sm:px-8",
                  MP_FOCUS_RING,
                )}
              >
                {primaryLabel}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </MarketPulseTrackedLink>
              <Link
                href="/market-pulse/leaderboard"
                aria-label={t("home.hero.ctaSecondaryAria")}
                className={mergeMpClasses(
                  "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 bg-mp-obsidian-panel px-6 py-3 text-base font-semibold text-zinc-100 transition-colors hover:border-white/15 hover:bg-mp-obsidian-elevated sm:w-auto sm:px-8",
                  MP_FOCUS_RING,
                )}
              >
                {t("home.hero.ctaSecondary")}
              </Link>
            </div>
          </div>

          <HomeMarketPulseSimulator />
        </div>
      </section>
    </MarketPulseGlowBackground>
  );
}
