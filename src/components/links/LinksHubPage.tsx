import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Handshake,
  Play,
  Trophy,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import {
  MarketPulseGlowBackground,
  MarketPulseStatusChip,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { getCurrentMarketPulseCycle } from "@/lib/market-pulse/challenge-cycle";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_FOCUS_RING,
  MP_PRIMARY_BTN,
  MP_PULSE_TEXT_SOFT,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";
import type { MessageKey } from "@/lib/i18n/messages";

type Destination = {
  href: string;
  icon: typeof Play;
  titleKey: MessageKey;
  descKey: MessageKey;
  primary?: boolean;
};

export default async function LinksHubPage() {
  const { t, locale } = await getServerTranslations();
  const cycle = getCurrentMarketPulseCycle();

  const destinations: Destination[] = [
    {
      href: "/market-pulse/play",
      icon: Play,
      titleKey: "links.dest.play.title",
      descKey: "links.dest.play.desc",
      primary: true,
    },
    {
      href: "/market-pulse/leaderboard",
      icon: Trophy,
      titleKey: "links.dest.leaderboard.title",
      descKey: "links.dest.leaderboard.desc",
    },
    {
      href: "/events",
      icon: CalendarDays,
      titleKey: "links.dest.events.title",
      descKey: "links.dest.events.desc",
    },
    {
      href: "/matching-pulse/request",
      icon: Handshake,
      titleKey: "links.dest.matching.title",
      descKey: "links.dest.matching.desc",
    },
    {
      href: "/market-pulse/rules",
      icon: BookOpen,
      titleKey: "links.dest.rules.title",
      descKey: "links.dest.rules.desc",
    },
  ];

  return (
    <MarketPulseGlowBackground
      accent="emerald"
      showGrid
      className="min-h-dvh"
      innerClassName="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8 sm:px-6 sm:py-10"
    >
      {/* Brand */}
      <header className="flex flex-col items-center gap-3 text-center">
        <MarketPulseLogo variant="header" priority />
        <p className={`text-sm text-white/60 ${MP_TICKER_TEXT}`}>{t("links.tagline")}</p>
      </header>

      {/* Campaign spotlight — live cycle */}
      <section className="mt-6" aria-label={t("links.spotlight.cycleTitle")}>
        <div className="relative overflow-hidden rounded-2xl border border-mp-pulse/20 bg-mp-obsidian-elevated p-5 shadow-xl shadow-black/30 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,230,118,0.10),transparent)] motion-reduce:opacity-80" aria-hidden="true" />
          <div className="relative">
            <MarketPulseStatusChip
              label={t("links.spotlight.cycleLabel")}
              variant="live"
              showPulse
            />
            <h1 className="mt-3 text-xl font-bold text-white sm:text-2xl">
              {t("links.spotlight.cycleTitle")}
            </h1>
            <p className={`mt-2 text-sm leading-relaxed text-white/70 ${MP_PULSE_TEXT_SOFT}`}>
              {t("links.spotlight.cycleBody")}
            </p>

            <div className="mt-4">
              <MarketPulseCountdown
                variant="compact"
                targetDate={cycle.endAt}
                label={t("links.spotlight.cycleEnds")}
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/market-pulse/play"
                className={mergeMpClasses(
                  MP_PRIMARY_BTN,
                  MP_FOCUS_RING,
                  "min-h-12 flex-1 gap-2 px-6 text-sm sm:min-h-11",
                )}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {t("links.spotlight.play")}
              </Link>
              <Link
                href="/market-pulse/leaderboard"
                className={mergeMpClasses(
                  MP_FOCUS_RING,
                  "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/[0.07]",
                )}
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                {t("links.spotlight.leaderboard")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="mt-6" aria-label={t("links.destinationsHeading")}>
        <h2 className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 ${MP_TICKER_TEXT}`}>
          {t("links.destinationsHeading")}
        </h2>
        <ul className="flex flex-col gap-2.5">
          {destinations.map(({ href, icon: Icon, titleKey, descKey, primary }) => (
            <li key={href}>
              <Link
                href={href}
                className={mergeMpClasses(
                  "group flex items-center gap-4 rounded-2xl border p-4 transition-colors",
                  primary
                    ? "border-mp-pulse/30 bg-mp-pulse/10 hover:bg-mp-pulse/15"
                    : "border-white/10 bg-mp-obsidian-panel hover:border-white/20 hover:bg-mp-obsidian-elevated",
                  MP_FOCUS_RING,
                )}
              >
                <span
                  className={mergeMpClasses(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    primary
                      ? "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse"
                      : "border-white/10 bg-white/5 text-white/80",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{t(titleKey)}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/55">
                    {t(descKey)}
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center">
        <p className="text-[11px] text-white/40">{t("links.footer")}</p>
      </footer>
    </MarketPulseGlowBackground>
  );
}
