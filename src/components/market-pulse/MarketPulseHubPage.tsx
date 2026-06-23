"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

import RevealCountdown from "@/components/market-pulse/RevealCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import PrizeBanner from "@/components/market-pulse/PrizeBanner";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import type { MarketPulseHubPageData } from "@/lib/market-pulse/hub-data";
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

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

export default function MarketPulseHubPage({
  data,
}: Readonly<{ data: MarketPulseHubPageData }>) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const playHref = "/market-pulse/play";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(playHref)}`;

  const leaderboardSubtitle = data.leaderboardRevealed
    ? "Top players this cycle — match bonuses included"
    : "Top players this cycle — participation points only until reveal";

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.market_pulse_viewed, {
      cycleId: data.cycleId ?? undefined,
      surface: "hub",
    });
  }, [data.cycleId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden="true"
      />

      <main className="relative mx-auto w-full max-w-5xl px-3 py-8 sm:px-6 sm:py-12 lg:py-16">
        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/95 to-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8 md:p-10"
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

          <div className="relative space-y-6 sm:space-y-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                {data.runtimeOpen ? "Live challenge" : "Challenge paused"}
              </div>
            </motion.div>

            <motion.div custom={0.05} variants={fadeUp} initial="hidden" animate="visible">
              <h1
                id="market-pulse-title"
                className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              >
                Market Pulse
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
                Read the signal. Make your call. Compare your market instinct
                with PPA Insight.
              </p>
            </motion.div>

            <motion.div
              custom={0.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 shadow-lg shadow-black/20">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Current challenge
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {data.challengeName}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 shadow-lg shadow-black/20 sm:col-span-2 lg:col-span-1">
                <CycleProgress
                  dayCurrent={data.dayCurrent}
                  dayTotal={data.dayTotal}
                />
              </div>

              <PrizeBanner
                className="sm:col-span-2 lg:col-span-1"
                primaryPrize={`#1 wins ${data.prizeLabel}`}
                monthlyPrize="Round-trip plane ticket to Taiwan"
              />
            </motion.div>

            <motion.div
              custom={0.15}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <RevealCountdown
                revealAtIso={data.revealAtIso}
                initialRemainingMs={data.revealRemainingMs}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isAuthenticated ? (
                  <Link
                    href={data.runtimeOpen ? playHref : "#"}
                    aria-disabled={!data.runtimeOpen}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-8 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500 disabled:pointer-events-none disabled:opacity-50 ${focusRing}`}
                    onClick={(event) => {
                      if (!data.runtimeOpen) {
                        event.preventDefault();
                      }
                    }}
                  >
                    Play Today&apos;s Card
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href={loginHref}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-8 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 ${focusRing}`}
                  >
                    Sign in to play
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                )}

                {!isAuthenticated && !isLoading ? (
                  <p className="text-sm text-zinc-400">
                    New here?{" "}
                    <Link
                      href={loginHref}
                      className="font-medium text-emerald-300 underline-offset-4 hover:underline"
                    >
                      Create a free account
                    </Link>
                  </p>
                ) : null}

                {isLoading ? (
                  <p className="text-sm text-zinc-500">Checking session…</p>
                ) : null}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Leaderboard preview */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 sm:mt-10"
          aria-labelledby="leaderboard-preview-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-300/90">
                <Trophy className="h-5 w-5" aria-hidden="true" />
                <h2
                  id="leaderboard-preview-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  Leaderboard
                </h2>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{leaderboardSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href="/market-pulse/rules"
                className={`text-sm font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`}
              >
                How scoring works
              </Link>
              <Link
                href="/market-pulse/leaderboard"
                className={`text-sm font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`}
              >
                Full leaderboard
              </Link>
            </div>
          </div>

          {data.leaderboardEntries.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center">
              <Sparkles
                className="mx-auto h-8 w-8 text-zinc-600"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-zinc-300">
                No scores yet this cycle
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Be the first to play today&apos;s card and claim the top spot.
              </p>
            </div>
          ) : (
            <ol className="mt-5 divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/20">
              {data.leaderboardEntries.map((entry, index) => (
                <motion.li
                  key={entry.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 + index * 0.06 }}
                  className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                      entry.rank === 1
                        ? "bg-amber-500/20 text-amber-300"
                        : entry.rank <= 3
                          ? "bg-zinc-800 text-zinc-200"
                          : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-zinc-100">
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
          className="mt-8 sm:mt-10"
          surface="hub"
          cycleId={data.cycleId ?? undefined}
        />
      </main>
    </div>
  );
}
