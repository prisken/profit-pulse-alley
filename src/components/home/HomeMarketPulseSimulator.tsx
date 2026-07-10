"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import {
  MP_FOCUS_RING,
  MP_FOCUS_RING_AMBER,
  MP_METRIC_TEXT,
  MP_PRIMARY_BTN,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

type SimulatorStance = "bullish" | "cautious" | null;

function SimulatorTrendline({ gradientId }: Readonly<{ gradientId: string }>) {
  return (
    <svg
      viewBox="0 0 120 32"
      className="h-8 w-full text-mp-pulse/80 motion-reduce:opacity-90"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 26 L18 22 L34 24 L50 16 L66 18 L82 10 L98 12 L120 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M0 26 L18 22 L34 24 L50 16 L66 18 L82 10 L98 12 L120 4 L120 32 L0 32 Z`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

export default function HomeMarketPulseSimulator() {
  const { t } = useTranslations();
  const feedbackId = useId();
  const trendGradientId = useId();
  const [stance, setStance] = useState<SimulatorStance>(null);
  const preLaunch = isBeforePublicLaunch();
  const playHref = preLaunch ? "/market-pulse" : "/market-pulse/play";
  const playAria = preLaunch
    ? t("home.hero.ctaEnterAria")
    : t("home.hero.simulator.ctaPlayRealAria");

  const metricChips = [
    t("home.hero.simulator.chip.market"),
    t("home.hero.simulator.chip.cycle"),
    t("home.hero.simulator.chip.time"),
  ] as const;

  return (
    <div
      className="relative w-full min-w-0 max-w-md justify-self-center lg:max-w-none lg:justify-self-end"
      data-mp-simulator="true"
    >
      <div
        className={mergeMpClasses(
          "rounded-xl border border-white/[0.1] bg-mp-obsidian-panel p-4 shadow-[0_0_0_1px_rgba(0,230,118,0.06),0_12px_40px_rgba(0,0,0,0.45)] sm:rounded-2xl sm:p-5",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        )}
        role="region"
        aria-label={t("home.hero.simulator.ariaLabel")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={mergeMpClasses(MP_TICKER_TEXT, "text-mp-pulse/90")}>
            {t("home.hero.simulator.title")}
          </p>
          <span
            className={mergeMpClasses(
              MP_TICKER_TEXT,
              "rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-zinc-300",
            )}
          >
            {t("home.hero.simulator.badgeDemo")}
          </span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t("home.hero.simulator.metricsAria")}>
          {metricChips.map((chip) => (
            <li key={chip}>
              <span
                className={mergeMpClasses(
                  MP_TICKER_TEXT,
                  "inline-flex rounded-md border border-white/[0.08] bg-mp-obsidian-elevated px-2 py-1 text-zinc-400",
                )}
              >
                {chip}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5">
          <p
            className={mergeMpClasses(
              MP_TICKER_TEXT,
              "text-[9px] text-zinc-500 sm:text-[10px]",
            )}
          >
            {t("home.hero.simulator.sampleLabel")}
          </p>
          <p className="mt-1.5 text-balance text-sm font-semibold leading-snug text-white sm:text-[0.95rem]">
            {t("home.hero.simulator.headline")}
          </p>
          <div className="mt-3" aria-hidden="true">
            <SimulatorTrendline gradientId={trendGradientId} />
          </div>
          <p className={mergeMpClasses(MP_METRIC_TEXT, "mt-1 text-[10px] text-zinc-500")}>
            {t("home.hero.simulator.chartCaption")}
          </p>
        </div>

        <p
          id={`${feedbackId}-label`}
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500"
        >
          {t("home.hero.simulator.stanceLabel")}
        </p>

        <div
          role="group"
          aria-labelledby={`${feedbackId}-label`}
          className="mt-2 grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            onClick={() => setStance("bullish")}
            aria-pressed={stance === "bullish"}
            className={mergeMpClasses(
              "inline-flex min-h-11 items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors sm:min-h-12 sm:text-base",
              stance === "bullish"
                ? "border-mp-pulse bg-mp-pulse/15 text-mp-pulse shadow-[0_0_20px_rgba(0,230,118,0.15)]"
                : "border-white/10 bg-black/50 text-zinc-100 hover:border-mp-pulse/40 hover:bg-mp-pulse/5",
              MP_FOCUS_RING,
            )}
          >
            {t("signal.bullish")}
          </button>
          <button
            type="button"
            onClick={() => setStance("cautious")}
            aria-pressed={stance === "cautious"}
            className={mergeMpClasses(
              "inline-flex min-h-11 items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors sm:min-h-12 sm:text-base",
              stance === "cautious"
                ? "border-amber-400/80 bg-amber-500/15 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                : "border-white/10 bg-black/50 text-zinc-100 hover:border-amber-400/40 hover:bg-amber-500/5",
              MP_FOCUS_RING_AMBER,
            )}
          >
            {t("signal.cautious")}
          </button>
        </div>

        {stance ? (
          <p
            id={feedbackId}
            role="status"
            aria-live="polite"
            className={mergeMpClasses(
              "mt-3 rounded-lg border px-3 py-2.5 text-xs leading-relaxed sm:text-sm",
              stance === "bullish"
                ? "border-mp-pulse/25 bg-mp-pulse/10 text-emerald-50"
                : "border-amber-500/25 bg-amber-500/10 text-amber-50",
            )}
          >
            {t("home.hero.simulator.feedbackLocked")}
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {t("home.hero.simulator.hint")}
          </p>
        )}

        <Link
          href={playHref}
          aria-label={playAria}
          className={mergeMpClasses(
            MP_PRIMARY_BTN,
            "mt-4 min-h-11 w-full px-4 py-2.5 text-sm sm:min-h-12 sm:text-base",
            MP_FOCUS_RING,
          )}
        >
          {t("home.hero.simulator.ctaPlayReal")}
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </Link>

        <p className="mt-2 text-center text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
          {t("home.hero.simulator.disclaimer")}
        </p>
      </div>
    </div>
  );
}
