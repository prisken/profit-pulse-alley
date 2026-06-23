"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

import ChallengeCountdown from "@/components/home/ChallengeCountdown";
import { getChallengeCountdown } from "@/lib/market-pulse/challenge-cycle";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export default function MarketPulseHero() {
  const initialCountdown = getChallengeCountdown();

  return (
    <section
      className="relative overflow-hidden bg-zinc-950 px-3 py-10 sm:px-6 sm:py-14 md:py-16 lg:py-20"
      aria-labelledby="market-pulse-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.18),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <article className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/95 to-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8 md:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-amber-400/8 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center gap-6 text-center sm:gap-8 md:items-start md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 sm:text-sm">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Live now
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1
                id="market-pulse-heading"
                className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Market Pulse
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-zinc-200 sm:text-lg md:mx-0 md:text-xl">
                Test your instincts. Win weekly prizes like{" "}
                <span className="font-semibold text-amber-200">
                  Ocean Park tickets!
                </span>
              </p>
            </div>

            <ChallengeCountdown initial={initialCountdown} large />

            <Link
              href="/market-pulse"
              className={`inline-flex w-full min-h-12 items-center justify-center rounded-full bg-emerald-400 px-8 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500 sm:w-auto sm:min-w-[12rem] sm:text-lg ${focusRing}`}
            >
              Play Now
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
