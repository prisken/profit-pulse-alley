"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";

import type {
  MarketPulseLeaderboardPageData,
  MarketPulseLeaderboardTab,
  MarketPulseLeaderboardTabData,
} from "@/lib/market-pulse/leaderboard-data";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const tabs: Array<{ id: MarketPulseLeaderboardTab; label: string }> = [
  { id: "current", label: "Current Challenge" },
  { id: "monthly", label: "Monthly" },
  { id: "all-time", label: "All-Time" },
];

function formatPoints(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function rankStyles(rank: number): string {
  if (rank === 1) {
    return "bg-amber-500/20 text-amber-300 ring-amber-500/30";
  }
  if (rank === 2) {
    return "bg-zinc-400/15 text-zinc-200 ring-zinc-400/25";
  }
  if (rank === 3) {
    return "bg-orange-500/15 text-orange-300 ring-orange-500/25";
  }
  return "bg-zinc-800/80 text-zinc-400 ring-zinc-700/50";
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const Icon = rank === 1 ? Trophy : rank <= 3 ? Medal : Award;

  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${rankStyles(rank)}`}
      aria-label={`Rank ${rank}`}
    >
      {rank <= 3 ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <span className="tabular-nums">{rank}</span>
      )}
    </span>
  );
}

function LeaderboardRow({
  entry,
  index,
  showCardsPlayed,
}: Readonly<{
  entry: MarketPulseLeaderboardEntryRow;
  index: number;
  showCardsPlayed: boolean;
}>) {
  const reduceMotion = useReducedMotion() ?? false;
  const isTopThree = entry.rank <= 3;

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, x: -14, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 380, damping: 30, delay: index * 0.045 }
      }
      whileHover={reduceMotion ? undefined : { scale: 1.01, x: 3 }}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5 ${
        isTopThree
          ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-zinc-900/40 shadow-lg shadow-emerald-950/10"
          : "border-zinc-800/80 bg-zinc-900/50"
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {entry.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.image}
            alt=""
            className="hidden h-9 w-9 shrink-0 rounded-full border border-zinc-700 object-cover sm:block"
          />
        ) : (
          <div
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 sm:flex"
            aria-hidden="true"
          >
            {entry.playerName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span
          className={`min-w-0 truncate font-medium ${
            isTopThree ? "text-white" : "text-zinc-200"
          }`}
        >
          {entry.playerName}
        </span>
      </div>

      {showCardsPlayed && entry.cardsPlayed != null ? (
        <div className="hidden text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Cards
          </p>
          <p className="text-sm font-semibold tabular-nums text-zinc-300">
            {entry.cardsPlayed}
          </p>
        </div>
      ) : null}

      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
          Points
        </p>
        <p
          className={`text-base font-bold tabular-nums sm:text-lg ${
            isTopThree ? "text-emerald-300" : "text-emerald-400/90"
          }`}
        >
          {formatPoints(entry.score)}
        </p>
      </div>
    </motion.li>
  );
}

function TabPanel({
  tab,
  data,
}: Readonly<{
  tab: MarketPulseLeaderboardTab;
  data: MarketPulseLeaderboardTabData;
}>) {
  const showCardsPlayed = data.entries.some((entry) => entry.cardsPlayed != null);
  const isCurrent = tab === "current";

  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {isCurrent && data.cycleName ? (
        <p className="text-sm text-zinc-400">
          <span className="font-medium text-zinc-200">{data.cycleName}</span>
          {data.isRevealed ? " — final scores" : " — participation standings"}
        </p>
      ) : null}

      {isCurrent && !data.isRevealed ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Final match bonuses unlock after PPA Insight reveal.
        </p>
      ) : null}

      {data.entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center">
          <Sparkles
            className="mx-auto h-8 w-8 text-zinc-600"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-zinc-300">
            No scores yet
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Play today&apos;s card to claim the first spot.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[auto_1fr_auto_auto] gap-4 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid">
            <span>Rank</span>
            <span>Player</span>
            {showCardsPlayed ? <span className="text-right">Cards</span> : <span />}
            <span className="text-right">Points</span>
          </div>
          <ul className="space-y-2 sm:space-y-2.5">
            <AnimatePresence mode="popLayout">
              {data.entries.map((entry, index) => (
                <LeaderboardRow
                  key={`${tab}-${entry.userId}`}
                  entry={entry}
                  index={index}
                  showCardsPlayed={showCardsPlayed}
                />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </motion.div>
  );
}

export default function MarketPulseLeaderboard({
  data,
}: Readonly<{ data: MarketPulseLeaderboardPageData }>) {
  const [activeTab, setActiveTab] =
    useState<MarketPulseLeaderboardTab>("current");

  const activeData = useMemo(() => {
    switch (activeTab) {
      case "monthly":
        return data.monthly;
      case "all-time":
        return data.allTime;
      default:
        return data.current;
    }
  }, [activeTab, data]);

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.leaderboard_viewed, {
      tab: activeTab,
      cycleId: activeData.cycleId ?? undefined,
      surface: "leaderboard",
    });
  }, [activeTab, activeData.cycleId]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/market-pulse"
              className={`mb-3 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Market Pulse
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <Trophy className="h-7 w-7 text-amber-400" aria-hidden="true" />
              Leaderboard
            </h1>
          </div>
          <Link
            href="/market-pulse/play"
            className={`inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
          >
            Play Today&apos;s Card
          </Link>
        </header>

        <div
          className="mb-6 flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1"
          role="tablist"
          aria-label="Leaderboard views"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${focusRing} ${
                  selected ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {selected ? (
                  <motion.span
                    layoutId="leaderboard-tab-highlight"
                    className="absolute inset-0 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <section aria-live="polite">
          <AnimatePresence mode="wait">
            <TabPanel key={activeTab} tab={activeTab} data={activeData} />
          </AnimatePresence>
        </section>

        <MarketPulseInlineDisclaimer
          className="mt-8"
          surface="leaderboard"
          cycleId={activeData.cycleId ?? undefined}
        />
      </div>
    </div>
  );
}
