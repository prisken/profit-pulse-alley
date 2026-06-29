"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { getChallengeCountdown } from "@/lib/market-pulse/challenge-cycle";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import type { ChallengeCountdown } from "@/lib/market-pulse/types";

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
          : "flex min-w-[2.75rem] flex-col items-center rounded-lg border border-white/10 bg-zinc-950/60 px-1.5 py-1.5 sm:min-w-[4rem] sm:rounded-xl sm:px-3 sm:py-3"
      }
    >
      <span
        className={
          large
            ? "text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
            : "text-lg font-bold tabular-nums tracking-tight text-white sm:text-3xl"
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
  className = "",
}: Readonly<{ initial: ChallengeCountdown; large?: boolean; className?: string }>) {
  const { t, locale } = useTranslations();
  const [countdown, setCountdown] = useState(initial);
  const opensIn = isBeforePublicLaunch();

  useEffect(() => {
    const tick = () => setCountdown(getChallengeCountdown());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ariaLabel = t("home.countdown.ariaLabel")
    .replace("{days}", String(countdown.days))
    .replace("{hours}", String(countdown.hours))
    .replace("{minutes}", String(countdown.minutes))
    .replace("{seconds}", String(countdown.seconds));

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      <div
        className={`flex items-center justify-center gap-2 font-medium uppercase tracking-[0.16em] text-emerald-300/90 md:justify-start ${
          large ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
        }`}
      >
        <Clock
          className={`shrink-0 ${large ? "h-4 w-4" : "h-3.5 w-3.5"}`}
          aria-hidden="true"
        />
        <span>{opensIn ? t("home.countdown.opensIn") : t("home.countdown.cycleEndsIn")}</span>
      </div>
      <div
        className={`flex flex-wrap justify-center gap-1.5 sm:gap-2 md:justify-start ${
          large ? "sm:gap-3 md:gap-4" : ""
        }`}
        role="timer"
        aria-label={ariaLabel}
        lang={locale}
      >
        <CountdownUnit label={t("home.countdown.days")} value={countdown.days} large={large} />
        <CountdownUnit label={t("home.countdown.hours")} value={countdown.hours} large={large} />
        <CountdownUnit label={t("home.countdown.mins")} value={countdown.minutes} large={large} />
        <CountdownUnit label={t("home.countdown.secs")} value={countdown.seconds} large={large} />
      </div>
    </div>
  );
}
