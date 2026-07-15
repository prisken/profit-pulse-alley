"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import {
  MP_FOCUS_RING,
  MP_METRIC_TEXT,
  MP_PRIMARY_BTN,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

type SimulatorStance = "bullish" | "cautious" | null;

const SAMPLE_CARD_IMAGE = "/images/simulator-sample-signal.jpg";

function SimulatorTrendline({ gradientId }: Readonly<{ gradientId: string }>) {
  return (
    <svg
      viewBox="0 0 120 32"
      className="h-7 w-full text-mp-pulse/80 motion-reduce:opacity-90"
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
      className="relative w-full min-w-0 max-w-md justify-self-center pt-3 lg:max-w-none lg:justify-self-end"
      data-mp-simulator="true"
    >
      {/* Spotlight — lifts the stack off the dark hero */}
      <div
        className="pointer-events-none absolute -inset-10 -z-10 sm:-inset-16"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(0,230,118,0.55),rgba(0,230,118,0.22)_40%,rgba(0,230,118,0.08)_58%,transparent_75%)] blur-3xl" />
        <div className="absolute inset-[6%] bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.35),rgba(0,230,118,0.2)_40%,transparent_62%)] blur-2xl" />
        <div className="absolute inset-[22%] bg-[radial-gradient(circle_at_50%_42%,rgba(0,230,118,0.45),transparent_55%)] blur-xl" />
      </div>

      {/* Back cards — decorative stack only */}
      <div
        className="pointer-events-none absolute inset-x-3 top-0 bottom-8 rounded-2xl border border-white/[0.06] bg-mp-obsidian-elevated opacity-60 shadow-lg shadow-black/40 sm:inset-x-4"
        style={{ transform: "rotate(-2.5deg) translateY(2px)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-1.5 top-1 bottom-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-mp-obsidian-panel opacity-80 shadow-xl shadow-black/45 sm:inset-x-2"
        style={{ transform: "rotate(1.75deg) translateY(1px)" }}
        aria-hidden="true"
      />

      <div
        className={mergeMpClasses(
          "group relative overflow-hidden",
          MP_TERMINAL_PANEL,
          "border-mp-pulse/25 bg-gradient-to-b from-white/[0.06] via-mp-obsidian-panel to-mp-obsidian-panel p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)] sm:rounded-2xl sm:p-5",
          "transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-mp-pulse/40 hover:shadow-[0_22px_56px_rgba(0,0,0,0.6)] motion-reduce:transform-none motion-reduce:transition-none",
        )}
        role="region"
        aria-label={t("home.hero.simulator.ariaLabel")}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-mp-pulse via-mp-pulse/70 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-mp-pulse/20 opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <p className={mergeMpClasses(MP_TICKER_TEXT, "text-mp-pulse/90")}>
            {t("home.hero.simulator.title")}
          </p>
          <span
            className={mergeMpClasses(
              MP_TICKER_TEXT,
              "rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300 backdrop-blur-sm",
            )}
          >
            {t("home.hero.simulator.badgeDemo")}
          </span>
        </div>

        <ul
          className="relative mt-3 flex flex-wrap gap-1.5"
          aria-label={t("home.hero.simulator.metricsAria")}
        >
          {metricChips.map((chip) => (
            <li key={chip}>
              <span
                className={mergeMpClasses(
                  MP_TICKER_TEXT,
                  "inline-flex rounded-md border border-white/[0.08] bg-black/30 px-2 py-1 text-zinc-400",
                )}
              >
                {chip}
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mt-3 overflow-hidden rounded-xl border border-white/[0.1] bg-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-video">
            <Image
              src={SAMPLE_CARD_IMAGE}
              alt={t("home.hero.simulator.imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 22rem"
              priority={false}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10"
              aria-hidden="true"
            />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-mp-pulse/30 bg-black/50 px-2 py-0.5 font-mono text-[10px] font-bold text-mp-pulse backdrop-blur-sm sm:text-[11px]">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                {t("home.hero.simulator.sampleTicker")}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p
                className={mergeMpClasses(
                  MP_TICKER_TEXT,
                  "text-[9px] text-zinc-300/80 sm:text-[10px]",
                )}
              >
                {t("home.hero.simulator.sampleLabel")}
              </p>
              <p className="mt-1 text-balance text-sm font-semibold leading-snug text-white sm:text-[0.95rem]">
                {t("home.hero.simulator.headline")}
              </p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] bg-black/35 px-3 py-2.5">
            <div aria-hidden="true">
              <SimulatorTrendline gradientId={trendGradientId} />
            </div>
            <p
              className={mergeMpClasses(
                MP_METRIC_TEXT,
                "mt-1 text-[10px] text-zinc-500",
              )}
            >
              {t("home.hero.simulator.chartCaption")}
            </p>
          </div>
        </div>

        <p
          id={`${feedbackId}-label`}
          className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500"
        >
          {t("home.hero.simulator.stanceLabel")}
        </p>

        <div
          role="group"
          aria-labelledby={`${feedbackId}-label`}
          className="relative mt-2 grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            onClick={() => setStance("bullish")}
            aria-pressed={stance === "bullish"}
            className={mergeMpClasses(
              "inline-flex min-h-11 items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors sm:min-h-12 sm:text-base",
              stance === "bullish"
                ? "border-mp-pulse bg-mp-pulse/15 text-mp-pulse shadow-[0_0_20px_rgba(0,230,118,0.15)]"
                : "border-mp-pulse/70 bg-black/50 text-zinc-100 hover:border-mp-pulse hover:bg-mp-pulse/5",
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
              "inline-flex min-h-11 items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-mp-obsidian sm:min-h-12 sm:text-base",
              stance === "cautious"
                ? "border-red-500 bg-red-500/15 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.18)]"
                : "border-red-500/70 bg-black/50 text-zinc-100 hover:border-red-500 hover:bg-red-500/5",
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
              "relative mt-3 rounded-lg border px-3 py-2.5 text-xs leading-relaxed sm:text-sm",
              stance === "bullish"
                ? "border-mp-pulse/25 bg-mp-pulse/10 text-emerald-50"
                : "border-red-500/25 bg-red-500/10 text-red-50",
            )}
          >
            {t("home.hero.simulator.feedbackLocked")}
          </p>
        ) : (
          <p className="relative mt-3 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {t("home.hero.simulator.hint")}
          </p>
        )}

        <Link
          href={playHref}
          aria-label={playAria}
          className={mergeMpClasses(
            MP_PRIMARY_BTN,
            "relative mt-4 min-h-11 w-full px-4 py-2.5 text-sm sm:min-h-12 sm:text-base",
            MP_FOCUS_RING,
          )}
        >
          {t("home.hero.simulator.ctaPlayReal")}
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
