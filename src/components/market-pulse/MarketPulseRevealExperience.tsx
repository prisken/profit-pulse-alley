"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import {
  PARTICIPATION_POINTS,
  MATCH_BONUS_POINTS,
  STREAK_BONUS_POINTS,
  formatSignal,
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import type {
  MarketPulseRevealCardRow,
  MarketPulseRevealPageData,
} from "@/lib/market-pulse/types";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: MARKET_PULSE_EASE },
  }),
};

function formatPoints(value: number): string {
  return new Intl.NumberFormat("en-HK").format(value);
}

function StatCard({
  label,
  value,
  sub,
  index,
  compact = false,
}: Readonly<{
  label: string;
  value: string;
  sub?: string;
  index: number;
  compact?: boolean;
}>) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 text-center shadow-lg shadow-black/20 sm:rounded-2xl ${
        compact ? "p-3 sm:p-5" : "p-4 sm:p-5"
      }`}
    >
      <p
        className={`font-semibold uppercase tracking-[0.14em] text-zinc-500 ${
          compact ? "text-[10px]" : "text-xs tracking-[0.16em]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 font-bold tabular-nums text-white sm:mt-2 ${
          compact ? "text-xl sm:text-3xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className={`mt-0.5 text-zinc-500 ${compact ? "text-[10px]" : "text-xs"}`}>
          {sub}
        </p>
      ) : null}
    </motion.div>
  );
}

function ScoreLine({
  label,
  points,
  highlight,
}: Readonly<{
  label: string;
  points: number;
  highlight?: boolean;
}>) {
  if (points <= 0) {
    return null;
  }
  return (
    <li
      className={`flex items-center justify-between text-sm ${
        highlight ? "font-semibold text-emerald-300" : "text-zinc-400"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">+{points}</span>
    </li>
  );
}

function RevealCardItem({
  card,
  index,
}: Readonly<{ card: MarketPulseRevealCardRow; index: number }>) {
  const userTone = getSignalTone(card.userDecision as MarketPulseDecision);
  const ppaTone = getSignalTone(card.ppaSignal as MarketPulseDecision);

  return (
    <motion.article
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={`overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-900/90 to-zinc-950 shadow-xl shadow-black/25 sm:rounded-2xl ${
        card.isMatch
          ? "border-emerald-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="border-b border-zinc-800/80 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
                Day {card.dayIndex + 1}
              </p>
              <div
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs ${
                  card.isMatch
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700"
                }`}
              >
                {card.isMatch ? (
                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                ) : (
                  <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                )}
                {card.isMatch ? "Match" : "No match"}
              </div>
            </div>
            <h3 className="mt-1 truncate text-base font-semibold text-white sm:text-lg">
              {card.companyName}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:mt-1 sm:text-sm">
              {card.headline}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-3">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2 sm:border-0 sm:bg-transparent sm:p-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              Your call
            </p>
            <p className={`mt-0.5 text-sm font-semibold sm:mt-1 ${userTone.textClass}`}>
              {formatSignal(card.userDecision as MarketPulseDecision)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2 sm:border-0 sm:bg-transparent sm:p-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              PPA signal
            </p>
            <p className={`mt-0.5 text-sm font-semibold sm:mt-1 ${ppaTone.textClass}`}>
              {formatSignal(card.ppaSignal as MarketPulseDecision)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 sm:rounded-xl sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
            Score
          </p>
          <ul className="mt-1.5 space-y-1 sm:mt-2 sm:space-y-1.5">
            <ScoreLine
              label={`+${PARTICIPATION_POINTS} participation`}
              points={card.participationPoints}
            />
            <ScoreLine
              label={`+${MATCH_BONUS_POINTS} match bonus`}
              points={card.matchBonus}
              highlight
            />
            <ScoreLine
              label={`+${STREAK_BONUS_POINTS} streak bonus`}
              points={card.streakBonus}
              highlight
            />
          </ul>
          <p className="mt-2 border-t border-zinc-800 pt-2 text-sm font-bold tabular-nums text-emerald-300 sm:mt-3 sm:pt-3">
            {formatPoints(card.totalPoints)} pts
          </p>
        </div>
      </div>

      {card.ppaInsight ? (
        <details className="group border-t border-zinc-800/80 bg-emerald-500/5">
          <summary
            className={`cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 marker:content-none sm:px-5 sm:py-3 sm:text-[11px] [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span className="group-open:hidden">Show PPA Insight</span>
            <span className="hidden group-open:inline">Hide PPA Insight</span>
          </summary>
          <div className="border-t border-emerald-500/10 px-3 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-3">
            <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
              {card.ppaInsight}
            </p>
          </div>
        </details>
      ) : null}
    </motion.article>
  );
}

function PendingState({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/50 px-6 py-12 text-center shadow-2xl shadow-black/30"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-400">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl">
        PPA Insights have not been revealed yet.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {data.pendingCycle
          ? `The ${data.pendingCycle.name} reveal is still ahead. Check back when the countdown ends.`
          : "There is no revealed challenge to review right now."}
      </p>
      {data.pendingCycle ? (
        <div className="mt-8 text-left">
          <MarketPulseCountdown
            targetDate={data.pendingCycle.revealAtIso}
            label="Reveal in"
          />
        </div>
      ) : null}
      <Link
        href="/market-pulse/play"
        className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
      >
        Play Today&apos;s Card
      </Link>
    </motion.div>
  );
}

function GuestRevealedState() {
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/market-pulse/reveal")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-950 px-6 py-10 text-center"
    >
      <Trophy className="mx-auto h-10 w-10 text-amber-400" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-white">Challenge complete</h2>
      <p className="mt-3 text-sm text-zinc-400">
        PPA Insights are live. Sign in to see your personal results ceremony.
      </p>
      <Link
        href={loginHref}
        className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-bold text-zinc-950 ${focusRing}`}
      >
        Sign in to view your results
      </Link>
    </motion.div>
  );
}

export default function MarketPulseRevealExperience({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  const [reportRequested, setReportRequested] = useState(false);

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.reveal_viewed, {
      status: data.status,
      cycleId: data.results?.cycleId,
      surface: "reveal",
    });
  }, [data.results?.cycleId, data.status]);

  const handleReportClick = () => {
    setReportRequested(true);
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.report_downloaded, {
      cycleId: data.results?.cycleId,
      surface: "reveal",
    });
  };

  if (data.status === "pending") {
    return (
      <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
        <PageShell cycleId={data.results?.cycleId}>
          <PendingState data={data} />
        </PageShell>
      </div>
    );
  }

  if (!data.isAuthenticated || !data.results) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
        <PageShell cycleId={data.results?.cycleId}>
          <GuestRevealedState />
          <CtaBar
            reportRequested={reportRequested}
            onReportClick={handleReportClick}
          />
        </PageShell>
      </div>
    );
  }

  const { results } = data;

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(16,185,129,0.16),transparent_55%)]"
        aria-hidden="true"
      />
      <PageShell cycleId={results.cycleId}>
        <div className="flex flex-col">
          <div className="order-1 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4 lg:order-2">
            <StatCard
              index={0}
              compact
              label="Final score"
              value={formatPoints(results.totalPoints)}
            />
            <StatCard
              index={1}
              compact
              label="Final rank"
              value={results.rank != null ? `#${results.rank}` : "—"}
            />
            <StatCard
              index={2}
              compact
              label="Matches"
              value={`${results.matchesCount}/${results.totalPlayed}`}
              sub="cards played"
            />
            <StatCard
              index={3}
              compact
              label="Best streak"
              value={String(results.bestStreak)}
              sub="consecutive matches"
            />
          </div>

          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative order-2 mt-4 overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 px-4 py-6 text-center shadow-2xl shadow-emerald-950/20 sm:mt-8 sm:rounded-3xl sm:px-10 sm:py-12 lg:order-1 lg:mt-0"
          >
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_50%)]"
              aria-hidden="true"
            />
            <Trophy
              className="relative mx-auto h-10 w-10 text-amber-400 sm:h-12 sm:w-12"
              aria-hidden="true"
            />
            <p className="relative mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90 sm:mt-4 sm:text-xs sm:tracking-[0.2em]">
              Results ceremony
            </p>
            <h1 className="relative mt-1.5 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">
              Challenge complete
            </h1>
            <p className="relative mt-1.5 text-base text-zinc-300 sm:mt-2 sm:text-lg">
              {results.cycleName}
            </p>
          </motion.header>
        </div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 sm:mt-10"
          aria-labelledby="reveal-cards-heading"
        >
          <h2
            id="reveal-cards-heading"
            className="text-lg font-semibold text-white sm:text-2xl"
          >
            Your challenge breakdown
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            PPA Insight signals and scoring for every card you played.
          </p>
          <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
            {results.cards.map((card, index) => (
              <RevealCardItem key={card.cardId} card={card} index={index} />
            ))}
          </div>
        </motion.section>

        <CtaBar
          reportRequested={reportRequested}
          onReportClick={handleReportClick}
        />
      </PageShell>
    </div>
  );
}

function CtaBar({
  reportRequested,
  onReportClick,
}: Readonly<{
  reportRequested: boolean;
  onReportClick: () => void;
}>) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: 0.4 }}
      className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3"
    >
      <Link
        href="/market-pulse/leaderboard"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 sm:w-auto ${focusRing}`}
      >
        View Final Leaderboard
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={onReportClick}
        aria-live="polite"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 sm:w-auto ${focusRing}`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {reportRequested ? "Report coming soon" : "Download PPA Report"}
      </button>
      <Link
        href="/market-pulse/play"
        className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 sm:w-auto ${focusRing}`}
      >
        Join next challenge
      </Link>
    </motion.div>
  );
}

function PageShell({
  children,
  cycleId,
}: Readonly<{ children: React.ReactNode; cycleId?: string }>) {
  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col px-3 py-6 sm:px-6 sm:py-12">
      <Link
        href="/market-pulse"
        className={`mb-4 inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-white sm:mb-6 ${focusRing}`}
      >
        ← Market Pulse
      </Link>
      {children}
      <MarketPulseInlineDisclaimer
        className="mt-8 sm:mt-10"
        surface="reveal"
        cycleId={cycleId}
      />
    </div>
  );
}
