"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { getHomeHeroCountdown } from "@/lib/market-pulse/challenge-cycle";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import {
  MP_METRIC_TEXT,
  MP_PULSE_TEXT_SOFT,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
} from "@/lib/market-pulse/visual-primitives";
import type { ChallengeCountdown } from "@/lib/market-pulse/types";

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div
      className={`flex min-w-[2.75rem] flex-col items-center px-1.5 py-1.5 sm:min-w-[3.5rem] sm:px-2.5 sm:py-2.5 md:min-w-[4.25rem] md:px-3 md:py-3 ${MP_TERMINAL_PANEL}`}
    >
      <span
        className={`text-lg font-bold text-white sm:text-2xl md:text-3xl ${MP_METRIC_TEXT}`}
      >
        {padUnit(value)}
      </span>
      <span
        className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider text-mp-muted sm:text-[11px] ${MP_TICKER_TEXT}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function ChallengeCountdown({
  initial,
  className = "",
}: Readonly<{ initial: ChallengeCountdown; className?: string }>) {
  const { t, locale } = useTranslations();
  const [countdown, setCountdown] = useState(initial);
  const opensIn = isBeforePublicLaunch();

  useEffect(() => {
    const tick = () => setCountdown(getHomeHeroCountdown());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ariaTemplate = opensIn
    ? t("home.countdown.ariaOpensIn")
    : t("home.countdown.ariaCycleEndsIn");
  const ariaLabel = ariaTemplate
    .replace("{days}", String(countdown.days))
    .replace("{hours}", String(countdown.hours))
    .replace("{minutes}", String(countdown.minutes))
    .replace("{seconds}", String(countdown.seconds));

  return (
    <div className={`space-y-2 sm:space-y-2.5 ${className}`}>
      <div className={`flex items-center gap-2 ${MP_TICKER_TEXT} ${MP_PULSE_TEXT_SOFT}`}>
        <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
        <span>{opensIn ? t("home.countdown.opensIn") : t("home.countdown.cycleEndsIn")}</span>
      </div>
      <div
        className="flex flex-wrap gap-1.5 sm:gap-2"
        role="timer"
        aria-label={ariaLabel}
        lang={locale}
      >
        <CountdownUnit label={t("home.countdown.days")} value={countdown.days} />
        <CountdownUnit label={t("home.countdown.hours")} value={countdown.hours} />
        <CountdownUnit label={t("home.countdown.mins")} value={countdown.minutes} />
        <CountdownUnit label={t("home.countdown.secs")} value={countdown.seconds} />
      </div>
    </div>
  );
}
