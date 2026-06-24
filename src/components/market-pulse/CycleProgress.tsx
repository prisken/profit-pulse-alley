"use client";

import { motion, useReducedMotion } from "framer-motion";

import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type CycleProgressProps = {
  dayCurrent: number;
  dayTotal: number;
  label?: string;
  showLabel?: boolean;
  variant?: "default" | "compact";
  className?: string;
};

export default function CycleProgress({
  dayCurrent,
  dayTotal,
  label,
  showLabel = true,
  variant = "default",
  className = "",
}: CycleProgressProps) {
  const isCompact = variant === "compact";
  const reduceMotion = useReducedMotion() ?? false;
  const safeTotal = Math.max(dayTotal, 1);
  const safeCurrent = Math.min(Math.max(dayCurrent, 0), safeTotal);
  const percent = Math.min(100, (safeCurrent / safeTotal) * 100);
  const displayLabel =
    label ?? `Day ${safeCurrent} of ${safeTotal}`;

  return (
    <div className={className}>
      {showLabel ? (
        <div
          className={`flex items-center justify-between gap-2 ${isCompact ? "text-[11px]" : "gap-3"}`}
        >
          {!isCompact ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Cycle progress
            </p>
          ) : null}
          <p
            className={`font-semibold text-emerald-200 ${isCompact ? "text-xs" : "text-sm"} ${isCompact ? "shrink-0" : ""}`}
          >
            {displayLabel}
          </p>
        </div>
      ) : null}

      <div
        className={`overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-zinc-700/50 ${showLabel ? (isCompact ? "mt-1.5" : "mt-2") : ""}`}
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={displayLabel}
      >
        <motion.div
          className={`relative overflow-hidden rounded-full ${isCompact ? "h-1.5" : "h-2 sm:h-2.5"}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={
            reduceMotion
              ? { duration: 0.2 }
              : { duration: 0.9, ease: MARKET_PULSE_EASE }
          }
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300" />
          {!reduceMotion ? (
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
              aria-hidden="true"
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
