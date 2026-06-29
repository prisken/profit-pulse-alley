"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import PrizeBanner from "@/components/market-pulse/PrizeBanner";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import type { MarketPulseHubPageData } from "@/lib/market-pulse/hub-data";
import {
  canAccessMarketPulsePlay,
  isBeforePublicLaunch,
} from "@/lib/market-pulse/launch-config";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: MARKET_PULSE_EASE },
  }),
};

function fadeUpMotionProps(reduceMotion: boolean, delay = 0) {
  return reduceMotion
    ? { initial: false as const }
    : {
        custom: delay,
        variants: fadeUp,
        initial: "hidden" as const,
        animate: "visible" as const,
      };
}

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function PlayCta({
  isAuthenticated,
  isLoading,
  runtimeOpen,
  preLaunch,
  playHref,
  loginHref,
}: Readonly<{
  isAuthenticated: boolean;
  isLoading: boolean;
  runtimeOpen: boolean;
  preLaunch: boolean;
  playHref: string;
  loginHref: string;
}>) {
  const { t } = useTranslations();

  if (preLaunch) {
    return (
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          disabled
          className={`inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-emerald-400/60 px-6 py-3.5 text-base font-bold text-zinc-950/80 shadow-lg shadow-emerald-900/20 sm:w-auto sm:px-8 ${focusRing}`}
        >
          {t("mp.hub.cta.opens")}
        </button>
        {!isAuthenticated && !isLoading ? (
          <Link
            href={loginHref}
            className={`inline-flex min-h-11 items-center justify-center text-sm font-medium text-emerald-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            {t("mp.hub.cta.signInReady")}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {isAuthenticated ? (
        runtimeOpen ? (
          <Link
            href={playHref}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500 sm:w-auto sm:px-8 ${focusRing}`}
          >
            {t("mp.hub.cta.playToday")}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-emerald-400/60 px-6 py-3.5 text-base font-bold text-zinc-950/80 shadow-lg shadow-emerald-900/20 sm:w-auto sm:px-8 ${focusRing}`}
          >
            {t("mp.hub.cta.playToday")}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )
      ) : (
        <Link
          href={loginHref}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 sm:w-auto sm:px-8 ${focusRing}`}
        >
          {t("mp.hub.cta.signInPlay")}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}

      {!isAuthenticated && !isLoading ? (
        <p className="text-center text-sm text-zinc-400 sm:text-left">
          {t("mp.hub.cta.newHere")}{" "}
          <Link
            href={loginHref}
            className={`inline-flex min-h-11 items-center font-medium text-emerald-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            {t("mp.hub.cta.createAccount")}
          </Link>
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-center text-sm text-zinc-500 sm:text-left">
          {t("lang.checkingSession")}
        </p>
      ) : null}
    </div>
  );
}

export default function MarketPulseHubPage({
  data,
}: Readonly<{ data: MarketPulseHubPageData }>) {
  const { t } = useTranslations();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const reduceMotion = useReducedMotion() ?? false;
  const revealMotion = reduceMotion
    ? { initial: false as const }
    : { initial: "hidden" as const, animate: "visible" as const };

  const playHref = "/market-pulse/play";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(playHref)}`;
  const showPreLaunchMarketing = isBeforePublicLaunch();
  const adminRole =
    status === "authenticated" ? session?.user?.role : undefined;
  const playBlocked = !canAccessMarketPulsePlay(adminRole);

  const leaderboardSubtitle = data.leaderboardRevealed
    ? t("mp.hub.leaderboard.subtitleRevealed")
    : t("mp.hub.leaderboard.subtitlePreReveal");

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.market_pulse_viewed, {
      cycleId: data.cycleId ?? undefined,
      surface: "hub",
    });
  }, [data.cycleId]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden="true"
      />

      <main className="relative mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-12 lg:py-16">
        {showPreLaunchMarketing ? (
          <MarketPulseLaunchAnnouncement className="mb-4 sm:mb-6" />
        ) : null}

        <motion.section
          {...revealMotion}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/95 to-zinc-950 p-4 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-8 md:p-10"
          aria-labelledby="market-pulse-title"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-amber-400/8 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-4 sm:space-y-8">
            <motion.div
              {...(reduceMotion
                ? { initial: false }
                : { custom: 0, variants: fadeUp, initial: "hidden", animate: "visible" })}
              className="flex flex-wrap items-center gap-2 sm:gap-3"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                {playBlocked
                  ? t("mp.hub.badge.preLaunch")
                  : data.runtimeOpen
                    ? t("mp.hub.badge.live")
                    : t("mp.hub.badge.paused")}
              </div>
              <div className="min-w-[7.5rem] flex-1 sm:hidden">
                <CycleProgress
                  variant="compact"
                  dayCurrent={data.dayCurrent}
                  dayTotal={data.dayTotal}
                />
              </div>
            </motion.div>

            <motion.div {...fadeUpMotionProps(reduceMotion, 0.05)}>
              <h1
                id="market-pulse-title"
                className="text-balance text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              >
                {t("nav.marketPulse")}
              </h1>
              <p className="mt-2 text-sm text-zinc-400 sm:hidden">
                {t("mp.hub.taglineShort")}
              </p>
              <p className="mt-4 hidden max-w-2xl text-pretty text-base leading-relaxed text-zinc-300 sm:block sm:text-lg">
                {t("mp.hub.taglineLong")}
              </p>
            </motion.div>

            <motion.div
              {...fadeUpMotionProps(reduceMotion, 0.08)}
              className="lg:hidden"
            >
              <PlayCta
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                runtimeOpen={data.runtimeOpen}
                preLaunch={playBlocked}
                playHref={playHref}
                loginHref={loginHref}
              />
            </motion.div>

            <motion.div
              {...fadeUpMotionProps(reduceMotion, 0.1)}
              className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
            >
              <div className="col-span-2 rounded-xl border border-white/10 bg-zinc-950/50 p-3 shadow-lg shadow-black/20 sm:col-span-1 sm:rounded-2xl sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs sm:tracking-[0.16em]">
                  {t("mp.hub.challenge.label")}
                </p>
                <p className="mt-1.5 truncate text-base font-semibold text-white sm:mt-2 sm:text-lg">
                  {data.challengeName}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-zinc-950/50 p-4 shadow-lg shadow-black/20 sm:block lg:col-span-1">
                <CycleProgress
                  dayCurrent={data.dayCurrent}
                  dayTotal={data.dayTotal}
                />
              </div>

              <div className="col-span-2 rounded-xl border border-white/10 bg-zinc-950/50 p-3 shadow-lg shadow-black/20 sm:col-span-2 sm:rounded-2xl sm:p-4 lg:hidden">
                <MarketPulseCountdown
                  variant="compact"
                  targetDate={data.revealAtIso}
                  className="sm:hidden"
                />
                <MarketPulseCountdown
                  targetDate={data.revealAtIso}
                  className="hidden sm:block"
                />
              </div>

              <PrizeBanner className="col-span-2 lg:col-span-1" variant="compact" />
            </motion.div>

            <motion.div
              {...fadeUpMotionProps(reduceMotion, 0.15)}
              className="hidden flex-col gap-6 border-t border-white/10 pt-6 lg:flex lg:flex-row lg:items-end lg:justify-between"
            >
              <MarketPulseCountdown targetDate={data.revealAtIso} />

              <PlayCta
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                runtimeOpen={data.runtimeOpen}
                preLaunch={playBlocked}
                playHref={playHref}
                loginHref={loginHref}
              />
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-10"
          aria-labelledby="leaderboard-preview-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-emerald-300/90">
                <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2
                  id="leaderboard-preview-heading"
                  className="text-lg font-semibold text-white sm:text-2xl"
                >
                  {t("nav.leaderboard")}
                </h2>
              </div>
              <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                {leaderboardSubtitle}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4 sm:gap-y-2">
              <Link
                href="/market-pulse/rules"
                className={`text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-sm ${focusRing}`}
              >
                {t("mp.hub.leaderboard.howScoring")}
              </Link>
              <Link
                href="/market-pulse/leaderboard"
                className={`text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-sm ${focusRing}`}
              >
                {t("mp.hub.leaderboard.full")}
              </Link>
            </div>
          </div>

          {data.leaderboardEntries.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-10 text-center sm:mt-5 sm:px-6 sm:py-12">
              <Sparkles
                className="mx-auto h-8 w-8 text-zinc-600"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-zinc-300">
                {t("mp.hub.leaderboard.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                {t("mp.hub.leaderboard.emptyBody")}
              </p>
            </div>
          ) : (
            <ol className="mt-4 divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/20 sm:mt-5">
              {data.leaderboardEntries.map((entry, index) => (
                <motion.li
                  key={entry.userId}
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 + index * 0.06 }}
                  className="flex items-center gap-3 px-3 py-3 sm:px-5 sm:py-4"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:h-9 sm:w-9 sm:text-sm ${
                      entry.rank === 1
                        ? "bg-amber-500/20 text-amber-300"
                        : entry.rank <= 3
                          ? "bg-zinc-800 text-zinc-200"
                          : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100 sm:text-base">
                    {entry.playerName}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-300 sm:text-base">
                    {formatScore(entry.score)}
                  </span>
                </motion.li>
              ))}
            </ol>
          )}
        </motion.section>

        <MarketPulseInlineDisclaimer
          className="mt-6 sm:mt-10"
          surface="hub"
          cycleId={data.cycleId ?? undefined}
        />
      </main>
    </div>
  );
}
