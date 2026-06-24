"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

export type MarketPulseCountdownProps = {
  /** Target reveal or deadline — ISO string or Date. */
  targetDate: string | Date;
  /** Heading above the timer. */
  label?: string;
  /** Include seconds column (default false). */
  showSeconds?: boolean;
  variant?: "default" | "compact";
  className?: string;
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
};

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCountdownParts(
  targetDate: string | Date,
  nowMs: number = Date.now(),
): CountdownParts {
  const targetMs = new Date(targetDate).getTime();
  const totalMs = targetMs - nowMs;
  const isExpired = totalMs <= 0;
  const clamped = Math.max(0, totalMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs: clamped, isExpired };
}

function CountdownUnit({
  label,
  value,
  compact = false,
}: Readonly<{ label: string; value: number; compact?: boolean }>) {
  const reduceMotion = useReducedMotion() ?? false;
  const Wrapper = reduceMotion ? "div" : motion.div;
  const wrapperProps = reduceMotion ? {} : { layout: true as const };

  return (
    <Wrapper
      {...wrapperProps}
      className={
        compact
          ? "flex min-w-[2.75rem] flex-col items-center rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-1.5"
          : "flex min-w-[4rem] flex-col items-center rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 sm:min-w-[4.75rem] sm:py-3"
      }
    >
      <span
        className={
          compact
            ? "text-sm font-bold tabular-nums tracking-tight text-white"
            : "text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl"
        }
      >
        {padUnit(value)}
      </span>
      <span
        className={
          compact
            ? "mt-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-400"
            : "mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:text-[11px]"
        }
      >
        {label}
      </span>
    </Wrapper>
  );
}

export default function MarketPulseCountdown({
  targetDate,
  label = "Reveal in",
  showSeconds = false,
  variant = "default",
  className = "",
}: MarketPulseCountdownProps) {
  const isCompact = variant === "compact";
  const targetKey = useMemo(
    () => new Date(targetDate).toISOString(),
    [targetDate],
  );

  const [parts, setParts] = useState(() => getCountdownParts(targetKey));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(targetKey));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetKey]);

  if (parts.isExpired) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-sm">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Reveal window</span>
        </div>
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
          PPA Insight is ready — results are being revealed.
        </p>
      </div>
    );
  }

  const ariaLabel = showSeconds
    ? `${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, and ${parts.seconds} seconds remaining`
    : `${parts.days} days, ${parts.hours} hours, and ${parts.minutes} minutes remaining`;

  return (
    <div className={`${isCompact ? "space-y-2" : "space-y-3"} ${className}`}>
      <div
        className={`flex items-center gap-2 font-medium uppercase tracking-[0.18em] text-emerald-300/90 ${
          isCompact ? "text-[10px]" : "text-xs sm:text-sm"
        }`}
      >
        <Clock className={`shrink-0 ${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div
        className={`flex flex-wrap ${isCompact ? "gap-1.5" : "gap-2 sm:gap-3"}`}
        role="timer"
        aria-label={ariaLabel}
      >
        <CountdownUnit label="Days" value={parts.days} compact={isCompact} />
        <CountdownUnit label="Hours" value={parts.hours} compact={isCompact} />
        <CountdownUnit label="Mins" value={parts.minutes} compact={isCompact} />
        {showSeconds ? (
          <CountdownUnit label="Secs" value={parts.seconds} compact={isCompact} />
        ) : null}
      </div>
    </div>
  );
}
