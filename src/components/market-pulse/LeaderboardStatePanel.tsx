"use client";

import { Lock, Sparkles, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { mergeMpClasses } from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type LeaderboardStatePanelVariant =
  | "locked"
  | "no_scores"
  | "no_cycles"
  | "unavailable";

export type LeaderboardStatePanelProps = Readonly<{
  variant: LeaderboardStatePanelVariant;
  title: string;
  body: string;
  className?: string;
}>;

const variantStyles: Record<
  LeaderboardStatePanelVariant,
  { border: string; glow: string; iconWrap: string; Icon: typeof Lock }
> = {
  locked: {
    border: "border-amber-500/30",
    glow: "bg-amber-500/10",
    iconWrap: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    Icon: Lock,
  },
  no_scores: {
    border: "border-zinc-700/80",
    glow: "bg-zinc-800/30",
    iconWrap: "border-zinc-600 bg-zinc-900 text-zinc-400",
    Icon: Trophy,
  },
  no_cycles: {
    border: "border-zinc-700/80",
    glow: "bg-zinc-800/30",
    iconWrap: "border-zinc-600 bg-zinc-900 text-zinc-400",
    Icon: Sparkles,
  },
  unavailable: {
    border: "border-rose-500/25",
    glow: "bg-rose-500/5",
    iconWrap: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    Icon: Sparkles,
  },
};

export default function LeaderboardStatePanel({
  variant,
  title,
  body,
  className = "",
}: LeaderboardStatePanelProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.35, ease: MARKET_PULSE_EASE }}
      className={mergeMpClasses(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-black px-4 py-8 text-center shadow-xl sm:px-6 sm:py-10",
        styles.border,
        className,
      )}
      role="status"
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full blur-3xl",
          styles.glow,
        )}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className={mergeMpClasses(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border",
            styles.iconWrap,
          )}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white sm:text-xl">{title}</h3>
        {body ? (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            {body}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function LeaderboardLockedPreview() {
  return (
    <div
      className="mx-auto mt-6 max-w-sm space-y-2 opacity-60"
      aria-hidden="true"
    >
      {[1, 2, 3].map((rank) => (
        <div
          key={rank}
          className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-500">
            {rank}
          </span>
          <span className="h-3 flex-1 rounded bg-zinc-800/80" />
          <span className="inline-flex items-center gap-1 text-xs text-amber-400/80">
            <Lock className="h-3.5 w-3.5" />
          </span>
        </div>
      ))}
    </div>
  );
}
