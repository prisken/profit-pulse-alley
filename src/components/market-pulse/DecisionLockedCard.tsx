"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  PARTICIPATION_POINTS,
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

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
  revealMessage,
  footerMessage,
  leaderboardHref = "/market-pulse/leaderboard",
  tomorrowHref = "/market-pulse/play",
  className = "",
}: DecisionLockedCardProps) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const tone = getSignalTone(decision);
  const isBullish = decision === "BULLISH";
  const accentBorder = isBullish ? "border-emerald-500" : "border-amber-500";
  const accentBg = isBullish ? "bg-emerald-500/10" : "bg-amber-500/10";
  const accentText = isBullish ? "text-emerald-300" : "text-amber-300";
  const resolvedRevealMessage =
    revealMessage ?? t("mp.play.reveal.default");
  const resolvedFooterMessage =
    footerMessage ?? t("mp.play.locked.footerShort");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.15 } : springIn}
      className={`relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-white/85 bg-black px-5 py-8 text-center shadow-xl shadow-black/40 sm:px-6 sm:py-9 ${className}`}
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0.15 } : { ...springIn, delay: 0.06 }}
        className="relative flex h-16 w-16 items-center justify-center"
      >
        {!reduceMotion ? (
          <motion.span
            className={`absolute inset-0 rounded-2xl ${accentBg}`}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 1.1, repeat: 2, repeatDelay: 0.2 }}
            aria-hidden="true"
          />
        ) : null}
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${accentBorder} ${accentBg} ${accentText}`}
        >
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.15 } : { delay: 0.12, ...springIn }}
      >
        <div
          className={`mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${accentBorder} ${accentBg} ${accentText}`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("mp.locked.badge")}
        </div>
        <p className="mt-3 text-lg font-semibold text-white sm:mt-4 sm:text-xl">
          {t("mp.locked.title")}
        </p>
        <p className="mt-1.5 text-sm text-zinc-300 sm:text-base">
          {t("mp.locked.chosePrefix")}{" "}
          <span className={`font-bold ${tone.textClass}`}>
            {t(decision === "BULLISH" ? "signal.bullish" : "signal.cautious")}
          </span>
        </p>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { delay: 0.22, type: "spring", stiffness: 400, damping: 22 }
          }
          className={`mt-4 text-sm font-semibold ${accentText}`}
        >
          {t("mp.locked.participationPoints").replace(
            "{points}",
            String(PARTICIPATION_POINTS),
          )}
        </motion.p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
          {resolvedRevealMessage}
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.15 } : { delay: 0.28, ...springIn }}
        className="relative mt-6 flex w-full max-w-sm flex-col gap-2.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-3"
      >
        <motion.div
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="flex-1"
        >
          <Link
            href={leaderboardHref}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/25 bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-900 ${focusRing}`}
          >
            {t("mp.locked.cta.leaderboard")}
          </Link>
        </motion.div>
        <motion.div
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="flex-1"
        >
          <Link
            href={tomorrowHref}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border-2 bg-black px-5 text-sm font-semibold transition-colors ${focusRing} ${
              isBullish
                ? "border-emerald-500 text-emerald-300 hover:bg-emerald-500/10"
                : "border-amber-500 text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            {resolvedFooterMessage}
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
