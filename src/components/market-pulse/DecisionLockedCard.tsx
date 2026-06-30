"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, CheckCircle2, ChevronRight, Lock, Trophy } from "lucide-react";

import CycleProgress from "@/components/market-pulse/CycleProgress";
import {
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  PARTICIPATION_POINTS,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import { shouldShowLockedCycleProgress } from "@/lib/market-pulse/locked-state-display";

const springIn = { type: "spring" as const, stiffness: 320, damping: 28 };

export type DecisionLockedCardContext = {
  dayCurrent?: number;
  dayTotal?: number;
  challengeName?: string;
};

export type DecisionLockedCardProps = {
  decision: MarketPulseDecision;
  revealMessage?: string;
  cycleContext?: DecisionLockedCardContext;
  className?: string;
};

export default function DecisionLockedCard({
  decision,
  revealMessage,
  cycleContext,
  className = "",
}: DecisionLockedCardProps) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const isBullish = decision === "BULLISH";
  const choiceLabel = t(isBullish ? "signal.bullish" : "signal.cautious");
  const accentBorder = isBullish ? "border-emerald-500/50" : "border-amber-500/50";
  const accentBg = isBullish ? "bg-emerald-500/10" : "bg-amber-500/10";
  const accentText = isBullish ? "text-emerald-300" : "text-amber-300";
  const accentGlow = isBullish ? "shadow-emerald-900/20" : "shadow-amber-900/20";
  const resolvedRevealMessage =
    revealMessage ?? t("mp.play.reveal.default");
  const showCycleProgress = shouldShowLockedCycleProgress(
    cycleContext?.dayCurrent ?? 0,
    cycleContext?.dayTotal ?? 0,
  );

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.15 } : springIn}
      className={mergeMpClasses(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-950 via-black to-black px-4 py-5 text-center shadow-xl sm:px-5 sm:py-6",
        accentBorder,
        accentGlow,
        className,
      )}
      aria-labelledby="locked-call-heading"
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full blur-3xl",
          isBullish ? "bg-emerald-500/15" : "bg-amber-500/10",
        )}
        aria-hidden="true"
      />

      <div className="relative">
        <motion.div
          initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduceMotion ? { duration: 0.15 } : { ...springIn, delay: 0.05 }}
          className="mx-auto flex h-14 w-14 items-center justify-center"
        >
          {!reduceMotion ? (
            <motion.span
              className={mergeMpClasses("absolute inset-0 rounded-2xl", accentBg)}
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.1, repeat: 2, repeatDelay: 0.2 }}
              aria-hidden="true"
            />
          ) : null}
          <div
            className={mergeMpClasses(
              "relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 sm:h-14 sm:w-14",
              accentBorder,
              accentBg,
              accentText,
            )}
          >
            <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
        </motion.div>

        <div
          className={mergeMpClasses(
            "mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs",
            accentBorder,
            accentBg,
            accentText,
          )}
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("mp.locked.badge")}
        </div>

        <h2
          id="locked-call-heading"
          className="mt-3 text-base font-semibold text-white sm:text-lg"
        >
          {t("mp.locked.chosePrefix")}{" "}
          <span className={accentText}>{choiceLabel}</span>
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
          {t("mp.locked.participationSaved")}
        </p>

        <p className={mergeMpClasses("mt-2 text-xs font-semibold sm:text-sm", accentText)}>
          {t("mp.locked.participationCredit").replace(
            "{points}",
            String(PARTICIPATION_POINTS),
          )}
        </p>

        {showCycleProgress ? (
          <div className="mx-auto mt-4 max-w-xs rounded-xl border border-white/10 bg-zinc-950/70 p-3 text-left">
            {cycleContext?.challengeName ? (
              <p className="mb-2 truncate text-xs font-medium text-zinc-400">
                {cycleContext.challengeName}
              </p>
            ) : null}
            <CycleProgress
              variant="compact"
              dayCurrent={cycleContext!.dayCurrent!}
              dayTotal={cycleContext!.dayTotal!}
            />
          </div>
        ) : null}

        <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-zinc-500 sm:text-sm">
          {resolvedRevealMessage}
        </p>

        <p className="mt-3 text-sm font-medium text-zinc-300">
          {t("mp.locked.nextSignal")}
        </p>
      </div>

      <nav
        className="relative mt-5 flex w-full flex-col gap-2 sm:mt-6"
        aria-label={t("mp.locked.cta.groupLabel")}
      >
        <Link
          href="/market-pulse/leaderboard"
          className={mergeMpClasses(
            "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10",
            MP_FOCUS_RING,
          )}
        >
          <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          {t("mp.locked.cta.leaderboard")}
          <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
        </Link>
        <Link
          href="/market-pulse"
          className={mergeMpClasses(
            "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
            MP_FOCUS_RING,
            isBullish
              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
              : "border-amber-500/70 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15",
          )}
        >
          {t("mp.locked.cta.hub")}
        </Link>
        <Link
          href="/market-pulse/rules"
          className={mergeMpClasses(
            "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-white",
            MP_FOCUS_RING,
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("mp.locked.cta.rules")}
        </Link>
      </nav>
    </motion.article>
  );
}
