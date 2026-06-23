"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  Sparkles,
  Trophy,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import MarketPulseSwipeCard from "@/components/market-pulse/MarketPulseSwipeCard";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import type { MarketPulseDecision } from "@/lib/market-pulse/constants";
import type { MarketPulsePlayPageData } from "@/lib/market-pulse/play-data";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";
import { submitMarketPulseDecisionAction } from "@/lib/market-pulse/player-actions";
import type { MarketPulseSwipeSubmitResult } from "@/lib/market-pulse/types";

type PlayLeaderboardEntry = MarketPulsePlayPageData["leaderboardEntries"][number];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const pageEnter = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: MARKET_PULSE_EASE },
  },
};

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function PlayLeaderboard({
  entries,
  revealed,
}: Readonly<{
  entries: PlayLeaderboardEntry[];
  revealed: boolean;
}>) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <aside
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl shadow-black/20 sm:p-5"
      aria-labelledby="play-leaderboard-heading"
    >
      <div className="flex items-center gap-2 text-emerald-300/90">
        <Trophy className="h-5 w-5" aria-hidden="true" />
        <h2
          id="play-leaderboard-heading"
          className="text-lg font-semibold text-white"
        >
          Leaderboard
        </h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
        {revealed
          ? "Top scores this cycle"
          : "Participation points until reveal"}
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No scores yet — be first on the board.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.userId}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: reduceMotion ? 0 : index * 0.05, ease: MARKET_PULSE_EASE }}
              whileHover={reduceMotion ? undefined : { scale: 1.01, x: 2 }}
              className="flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-zinc-700/80"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  entry.rank === 1
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                {entry.playerName}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-300">
                {formatScore(entry.score)}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: Readonly<{
  title: string;
  description: string;
  icon: typeof Sparkles;
}>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-400">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      <Link
        href="/market-pulse"
        className={`mt-6 text-sm font-medium text-emerald-300 underline-offset-4 hover:underline ${focusRing}`}
      >
        Back to Market Pulse hub
      </Link>
    </motion.div>
  );
}

export default function MarketPulsePlayExperience({
  data,
}: Readonly<{ data: MarketPulsePlayPageData }>) {
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/market-pulse/play")}`;

  const handleSubmit = useCallback(
    async (decision: MarketPulseDecision): Promise<MarketPulseSwipeSubmitResult> => {
      if (!data.card) {
        return { ok: false, error: "No card available." };
      }

      const result = await submitMarketPulseDecisionAction({
        cardId: data.card.id,
        decision,
      });

      if (!result.ok) {
        if (result.code === "ALREADY_SUBMITTED") {
          return { ok: true };
        }
        return { ok: false, error: result.error };
      }

      return { ok: true };
    },
    [data.card],
  );

  const revealMessage = data.revealAtLabel
    ? `PPA Insight reveals on ${data.revealAtLabel}.`
    : "PPA Insight reveals at the end of this challenge.";

  const lockedFooterMessage = "Come back tomorrow for the next card.";

  const showCycleChrome =
    data.status !== "no_active_cycle" && data.dayTotal > 0;

  useEffect(() => {
    if (!data.card) {
      return;
    }

    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.card_viewed, {
      cardId: data.card.id,
      cycleId: data.cycleId ?? undefined,
      dayIndex: data.dayCurrent,
      surface: "play",
    });
  }, [data.card, data.cycleId, data.dayCurrent]);

  return (
    <div className="min-h-screen overflow-x-hidden overscroll-x-none bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <motion.div
        className="relative mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-10"
        initial="hidden"
        animate="visible"
        variants={pageEnter}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <Link
            href="/market-pulse"
            className={`inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Market Pulse
          </Link>
          {showCycleChrome ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 sm:text-sm">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
                {data.challengeName}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Day {data.dayCurrent} of {data.dayTotal}
              </span>
            </div>
          ) : null}
        </header>

        {showCycleChrome ? (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CycleProgress
                className="max-w-md flex-1"
                dayCurrent={data.dayCurrent}
                dayTotal={data.dayTotal}
              />
              <MarketPulseCountdown targetDate={data.revealAtIso} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
          <div className="min-w-0 overflow-x-hidden pb-2">
            {data.status === "no_active_cycle" ? (
              <EmptyState
                icon={CalendarClock}
                title="No active Market Pulse challenge is open right now."
                description="Check back soon or visit the hub for the next challenge window."
              />
            ) : null}

            {data.status === "no_card_today" ? (
              <EmptyState
                icon={Sparkles}
                title="Today’s Market Pulse card is coming soon."
                description="The team is preparing today’s signal. Check back a little later."
              />
            ) : null}

            {data.status === "sign_in_required" && data.card ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-center">
                  <p className="text-sm text-emerald-100 sm:text-base">
                    Sign in to lock in your read and earn participation points.
                  </p>
                  <Link
                    href={loginHref}
                    className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
                  >
                    Sign in to play
                  </Link>
                </div>
                <MarketPulseSwipeCard
                  card={data.card}
                  disabled
                  analyticsContext={{
                    cycleId: data.cycleId ?? undefined,
                    dayIndex: data.dayCurrent,
                  }}
                  onSubmit={async () => ({
                    ok: false,
                    error: "Sign in required.",
                  })}
                  revealMessage={revealMessage}
                />
              </motion.div>
            ) : null}

            {(data.status === "locked" || data.status === "playable") &&
            data.card ? (
              <motion.div
                key={data.card.id}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.08, ease: MARKET_PULSE_EASE }}
              >
                <MarketPulseSwipeCard
                  card={data.card}
                  initialDecision={data.lockedDecision}
                  analyticsContext={{
                    cycleId: data.cycleId ?? undefined,
                    dayIndex: data.dayCurrent,
                  }}
                  onSubmit={handleSubmit}
                  revealMessage={revealMessage}
                  lockedFooterMessage={lockedFooterMessage}
                />
              </motion.div>
            ) : null}
          </div>

          {data.status !== "no_active_cycle" ? (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <PlayLeaderboard
                entries={data.leaderboardEntries}
                revealed={data.leaderboardRevealed}
              />
            </div>
          ) : null}
        </div>

        <MarketPulseInlineDisclaimer
          className="mt-8 sm:mt-10"
          surface="play"
          cycleId={data.cycleId ?? undefined}
        />
      </motion.div>
    </div>
  );
}
