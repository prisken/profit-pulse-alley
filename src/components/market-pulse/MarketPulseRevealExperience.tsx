"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
}: Readonly<{
  label: string;
  value: string;
  sub?: string;
  index: number;
}>) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center shadow-lg shadow-black/20 sm:p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
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
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-900/90 to-zinc-950 shadow-xl shadow-black/25 ${
        card.isMatch
          ? "border-emerald-500/25"
          : "border-zinc-800"
      }`}
    >
      <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Day {card.dayIndex + 1}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {card.companyName}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              {card.headline}
            </p>
          </div>
          <div
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              card.isMatch
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700"
            }`}
          >
            {card.isMatch ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {card.isMatch ? "Match" : "No match"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Your call
            </p>
            <p className={`mt-1 font-semibold ${userTone.textClass}`}>
              {formatSignal(card.userDecision as MarketPulseDecision)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              PPA Insight signal
            </p>
            <p className={`mt-1 font-semibold ${ppaTone.textClass}`}>
              {formatSignal(card.ppaSignal as MarketPulseDecision)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Score breakdown
          </p>
          <ul className="mt-2 space-y-1.5">
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
          <p className="mt-3 border-t border-zinc-800 pt-3 text-sm font-bold tabular-nums text-emerald-300">
            {formatPoints(card.totalPoints)} pts
          </p>
        </div>
      </div>

      {card.ppaInsight ? (
        <div className="border-t border-zinc-800/80 bg-emerald-500/5 px-4 py-4 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">
            PPA Insight
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {card.ppaInsight}
          </p>
        </div>
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <PageShell cycleId={data.results?.cycleId}>
          <PendingState data={data} />
        </PageShell>
      </div>
    );
  }

  if (!data.isAuthenticated || !data.results) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(16,185,129,0.16),transparent_55%)]"
        aria-hidden="true"
      />
      <PageShell cycleId={results.cycleId}>
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 px-6 py-10 text-center shadow-2xl shadow-emerald-950/20 sm:px-10 sm:py-12"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_50%)]"
            aria-hidden="true"
          />
          <Trophy
            className="relative mx-auto h-12 w-12 text-amber-400"
            aria-hidden="true"
          />
          <p className="relative mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Results ceremony
          </p>
          <h1 className="relative mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Challenge complete
          </h1>
          <p className="relative mt-2 text-lg text-zinc-300">{results.cycleName}</p>
        </motion.header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            index={0}
            label="Final score"
            value={formatPoints(results.totalPoints)}
          />
          <StatCard
            index={1}
            label="Final rank"
            value={results.rank != null ? `#${results.rank}` : "—"}
          />
          <StatCard
            index={2}
            label="Matches"
            value={`${results.matchesCount}/${results.totalPlayed}`}
            sub="cards played"
          />
          <StatCard
            index={3}
            label="Best streak"
            value={String(results.bestStreak)}
            sub="consecutive matches"
          />
        </div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-10"
          aria-labelledby="reveal-cards-heading"
        >
          <h2
            id="reveal-cards-heading"
            className="text-xl font-semibold text-white sm:text-2xl"
          >
            Your challenge breakdown
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            PPA Insight signals and scoring for every card you played.
          </p>
          <div className="mt-6 space-y-4">
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
    >
      <Link
        href="/market-pulse/leaderboard"
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
      >
        View Final Leaderboard
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={onReportClick}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 ${focusRing}`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {reportRequested ? "Report coming soon" : "Download PPA Report"}
      </button>
      <Link
        href="/market-pulse/play"
        className={`inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 ${focusRing}`}
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
    <div className="relative mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
      <Link
        href="/market-pulse"
        className={`mb-6 inline-flex text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`}
      >
        ← Market Pulse
      </Link>
      {children}
      <MarketPulseInlineDisclaimer
        className="mt-10"
        surface="reveal"
        cycleId={cycleId}
      />
    </div>
  );
}
