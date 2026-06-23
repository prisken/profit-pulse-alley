"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

import {
  PARTICIPATION_POINTS,
  SIGNAL_LABELS,
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const springIn = { type: "spring" as const, stiffness: 320, damping: 28 };

export type DecisionLockedCardProps = {
  decision: MarketPulseDecision;
  revealMessage?: string;
  footerMessage?: string;
  leaderboardHref?: string;
  tomorrowHref?: string;
  className?: string;
};

export default function DecisionLockedCard({
  decision,
  revealMessage = "PPA Insight reveals at the end of this challenge.",
  footerMessage = "Come back tomorrow",
  leaderboardHref = "/market-pulse/leaderboard",
  tomorrowHref = "/market-pulse/play",
  className = "",
}: DecisionLockedCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const tone = getSignalTone(decision);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.15 } : springIn}
      className={`relative flex min-h-[22rem] flex-col items-center justify-center overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-950 px-6 py-10 text-center shadow-2xl shadow-emerald-950/20 ${className}`}
    >
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_55%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        />
      ) : null}

      <motion.div
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0.15 } : { ...springIn, delay: 0.06 }}
        className="relative flex h-16 w-16 items-center justify-center"
      >
        {!reduceMotion ? (
          <>
            <motion.span
              className="absolute inset-0 rounded-2xl bg-emerald-500/25"
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.1, repeat: 2, repeatDelay: 0.2 }}
              aria-hidden="true"
            />
            <motion.span
              className="absolute -inset-2 rounded-3xl border border-emerald-400/30"
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              aria-hidden="true"
            />
          </>
        ) : null}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-950/30">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.15 } : { delay: 0.12, ...springIn }}
      >
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Locked in
        </div>
        <p className="mt-4 text-xl font-semibold text-white">Your decision is locked.</p>
        <p className="mt-2 text-base text-zinc-300">
          You chose:{" "}
          <span className={`font-bold ${tone.textClass}`}>
            {SIGNAL_LABELS[decision]}
          </span>
        </p>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0.15 } : { delay: 0.22, type: "spring", stiffness: 400, damping: 22 }}
          className="mt-4 text-sm font-semibold text-emerald-300"
        >
          +{PARTICIPATION_POINTS} participation points
        </motion.p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
          {revealMessage}
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.15 } : { delay: 0.28, ...springIn }}
        className="relative mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="flex-1">
          <Link
            href={leaderboardHref}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 ${focusRing}`}
          >
            View Leaderboard
          </Link>
        </motion.div>
        <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="flex-1">
          <Link
            href={tomorrowHref}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-500/15 px-5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/25 ${focusRing}`}
          >
            {footerMessage}
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
