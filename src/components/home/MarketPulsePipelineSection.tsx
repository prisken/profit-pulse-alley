import Link from "next/link";
import {
  Activity,
  CreditCard,
  Gift,
  Lock,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_FOCUS_RING,
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_PULSE_ACCENT_ICON,
  MP_PULSE_LIVE_CHIP,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const PIPELINE_STEPS = [
  {
    step: 1,
    icon: CreditCard,
    titleKey: "home.pipeline.step1.title" as const,
    bodyKey: "home.pipeline.step1.body" as const,
    primary: true,
  },
  {
    step: 2,
    icon: Lock,
    titleKey: "home.pipeline.step2.title" as const,
    bodyKey: "home.pipeline.step2.body" as const,
    primary: false,
  },
  {
    step: 3,
    icon: Activity,
    titleKey: "home.pipeline.step3.title" as const,
    bodyKey: "home.pipeline.step3.body" as const,
    primary: false,
  },
  {
    step: 4,
    icon: Trophy,
    titleKey: "home.pipeline.step4.title" as const,
    bodyKey: "home.pipeline.step4.body" as const,
    primary: false,
  },
] as const;

function PipelineConnector({
  orientation,
}: Readonly<{ orientation: "horizontal" | "vertical" }>) {
  if (orientation === "horizontal") {
    return (
      <div
        className="hidden shrink-0 items-center px-1 lg:flex"
        aria-hidden="true"
      >
        <div className="h-px w-6 bg-gradient-to-r from-mp-pulse/50 via-mp-pulse/25 to-white/10 xl:w-10" />
        <div className="mx-0.5 h-1.5 w-1.5 rounded-full bg-mp-pulse/70" />
        <div className="h-px w-6 bg-gradient-to-r from-white/10 via-mp-pulse/20 to-mp-pulse/40 xl:w-10" />
      </div>
    );
  }

  return (
    <div
      className="flex justify-center py-1 lg:hidden"
      aria-hidden="true"
    >
      <div className="h-5 w-px bg-gradient-to-b from-mp-pulse/40 to-white/10" />
    </div>
  );
}

function PipelineStepCard({
  step,
  icon: Icon,
  title,
  body,
  stepLabel,
  primary,
}: Readonly<{
  step: number;
  icon: LucideIcon;
  title: string;
  body: string;
  stepLabel: string;
  primary: boolean;
}>) {
  return (
    <article
      className={mergeMpClasses(
        "flex h-full flex-col",
        MP_TERMINAL_PANEL,
        "p-4 sm:p-5",
        primary && "border-mp-pulse/20 shadow-[0_0_24px_rgba(0,230,118,0.06)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={mergeMpClasses(
            "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold",
            MP_METRIC_TEXT,
            primary
              ? "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse"
              : "border-white/10 bg-white/[0.04] text-zinc-400",
          )}
          aria-hidden="true"
        >
          {String(step).padStart(2, "0")}
        </span>
        <div
          className={mergeMpClasses(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            primary
              ? MP_PULSE_ACCENT_ICON
              : "border-white/10 bg-mp-obsidian-elevated text-zinc-300",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className={`mt-3 text-mp-muted ${MP_TICKER_TEXT}`}>{stepLabel}</p>
      <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-mp-muted">{body}</p>
    </article>
  );
}

export default async function MarketPulsePipelineSection() {
  const { t } = await getServerTranslations();

  return (
    <section
      className={MP_HOME_SECTION}
      aria-labelledby="market-pulse-pipeline-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <div
            className={mergeMpClasses(
              "mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1",
              MP_PULSE_LIVE_CHIP,
              MP_TICKER_TEXT,
            )}
          >
            {t("home.pipeline.badge")}
          </div>
          <h2
            id="market-pulse-pipeline-heading"
            className="mt-3 text-balance text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.pipeline.title")}
          </h2>
        </header>

        <ol className="mt-5 list-none sm:mt-6 lg:mt-8 lg:flex lg:items-stretch lg:justify-between">
          {PIPELINE_STEPS.map(
            ({ step, icon, titleKey, bodyKey, primary }, index) => (
              <li
                key={step}
                className="flex flex-col lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center"
              >
                <PipelineStepCard
                  step={step}
                  icon={icon}
                  title={t(titleKey)}
                  body={t(bodyKey)}
                  stepLabel={t("home.pipeline.stepLabel").replace(
                    "{step}",
                    String(step),
                  )}
                  primary={primary}
                />
                {index < PIPELINE_STEPS.length - 1 ? (
                  <PipelineConnector orientation="vertical" />
                ) : null}
                {index < PIPELINE_STEPS.length - 1 ? (
                  <PipelineConnector orientation="horizontal" />
                ) : null}
              </li>
            ),
          )}
        </ol>

        <div className="mx-auto mt-5 max-w-xl sm:mt-6">
          <div
            className={mergeMpClasses(
              MP_TERMINAL_PANEL,
              "flex items-start gap-3 border-amber-500/20 bg-amber-500/[0.06] p-4 sm:items-center sm:p-5",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300">
              <Gift className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`text-amber-200/80 ${MP_TICKER_TEXT}`}>
                {t("home.pipeline.prize.heading")}
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-amber-50 sm:text-base">
                {t("home.pipeline.prize.body")}
              </p>
            </div>
          </div>
        </div>

        <nav
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:mt-6"
          aria-label={t("home.pipeline.footerNavAria")}
        >
          <Link
            href="/market-pulse/leaderboard"
            aria-label={t("home.pipeline.link.leaderboardAria")}
            className={mergeMpClasses(
              "font-semibold text-mp-pulse transition-colors hover:text-mp-pulse/80",
              MP_FOCUS_RING,
            )}
          >
            {t("home.pipeline.link.leaderboard")}
          </Link>
          <Link
            href="/contest-rules"
            aria-label={t("home.pipeline.link.rulesAria")}
            className={mergeMpClasses(
              "font-semibold text-zinc-400 transition-colors hover:text-zinc-200",
              MP_FOCUS_RING,
            )}
          >
            {t("home.pipeline.link.rules")}
          </Link>
        </nav>
      </div>
    </section>
  );
}
