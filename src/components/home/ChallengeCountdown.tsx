"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import {
  getChallengeCountdown,
  type ChallengeCountdown,
} from "@/lib/game-challenge-cycle";

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({
  label,
  value,
  large,
}: Readonly<{ label: string; value: number; large?: boolean }>) {
  return (
    <div
      className={
        large
          ? "flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-white/15 bg-zinc-950/70 px-3 py-3 sm:min-w-[5.5rem] sm:px-4 sm:py-4 md:min-w-[6.5rem] md:py-5"
          : "flex min-w-[3.25rem] flex-col items-center rounded-xl border border-white/10 bg-zinc-950/60 px-2 py-2.5 sm:min-w-[4rem] sm:px-3 sm:py-3"
      }
    >
      <span
        className={
          large
            ? "text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
            : "text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl"
        }
      >
        {padUnit(value)}
      </span>
      <span
        className={
          large
            ? "mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 sm:text-xs"
            : "mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:text-[11px]"
        }
      >
        {label}
      </span>
    </div>
  );
}

export default function ChallengeCountdown({
  initial,
  large = false,
}: Readonly<{ initial: ChallengeCountdown; large?: boolean }>) {
  const [countdown, setCountdown] = useState(initial);

  useEffect(() => {
    const tick = () => setCountdown(getChallengeCountdown());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className={`flex items-center gap-2 font-medium uppercase tracking-[0.18em] text-emerald-300/90 ${large ? "text-xs sm:text-sm" : "text-xs"}`}
      >
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Cycle ends in</span>
      </div>
      <div
        className="flex flex-wrap justify-center gap-2 sm:justify-start sm:gap-3 md:gap-4"
        role="timer"
        aria-live="polite"
        aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds remaining in this Market Pulse cycle`}
      >
        <CountdownUnit label="Days" value={countdown.days} large={large} />
        <CountdownUnit label="Hours" value={countdown.hours} large={large} />
        <CountdownUnit label="Mins" value={countdown.minutes} large={large} />
        <CountdownUnit label="Secs" value={countdown.seconds} large={large} />
      </div>
    </div>
  );
}
