import Link from "next/link";
import { ArrowRight, Brain, Lock, Sparkles } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_FOCUS_RING,
  MP_SURFACE_STYLES,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const LEARNING_TOPIC_KEYS = [
  "home.ppaInsight.comparison.topic1",
  "home.ppaInsight.comparison.topic2",
  "home.ppaInsight.comparison.topic3",
  "home.ppaInsight.comparison.topic4",
] as const;

export default async function MarketPulsePpaInsightSection() {
  const { t } = await getServerTranslations();

  return (
    <section
      className="relative overflow-hidden border-t border-sky-500/10 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 px-3 py-8 sm:px-6 sm:py-12 md:py-14"
      aria-labelledby="ppa-insight-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(56,189,248,0.08),transparent_55%),radial-gradient(ellipse_60%_40%_at_90%_80%,rgba(16,185,129,0.08),transparent_50%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
              <Brain className="h-3.5 w-3.5" aria-hidden="true" />
              {t("home.ppaInsight.badge")}
            </div>

            <h2
              id="ppa-insight-heading"
              className="mt-3 text-balance text-xl font-bold tracking-tight text-white sm:mt-4 sm:text-3xl"
            >
              {t("home.ppaInsight.title")}
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
              {t("home.ppaInsight.body")}
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap">
              <Link
                href="/market-pulse"
                aria-label={t("home.ppaInsight.cta.exploreAria")}
                className={mergeMpClasses(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 sm:px-6",
                  MP_FOCUS_RING,
                )}
              >
                {t("home.ppaInsight.cta.explore")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/market-pulse/rules"
                aria-label={t("home.ppaInsight.cta.rulesAria")}
                className={mergeMpClasses(
                  "inline-flex min-h-11 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-100 transition-colors hover:border-sky-400/40 hover:bg-sky-500/15 sm:px-6",
                  MP_FOCUS_RING,
                )}
              >
                {t("home.ppaInsight.cta.rules")}
              </Link>
            </div>
          </div>

          <div
            className={mergeMpClasses(
              MP_SURFACE_STYLES.outline,
              "border-sky-500/20 bg-zinc-950/70 p-4 sm:p-6",
            )}
            role="img"
            aria-label={t("home.ppaInsight.comparison.ariaLabel")}
          >
            <div className="flex items-center gap-2 text-sky-300/90">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm">
                {t("home.ppaInsight.comparison.label")}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80 sm:text-xs">
                  {t("home.ppaInsight.comparison.yourCallLabel")}
                </p>
                <p className="mt-1 text-base font-bold text-emerald-200 sm:text-lg">
                  {t("home.ppaInsight.comparison.yourCallValue")}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80 sm:text-xs">
                      {t("home.ppaInsight.comparison.ppaLabel")}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-100 sm:text-base">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                      {t("home.ppaInsight.comparison.ppaLocked")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    {t("home.ppaInsight.comparison.lockedBadge")}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 sm:text-xs">
                  {t("home.ppaInsight.comparison.learnLabel")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {LEARNING_TOPIC_KEYS.map((key) => (
                    <li key={key}>
                      <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-200">
                        {t(key)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="sr-only">{t("home.ppaInsight.comparison.srNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
