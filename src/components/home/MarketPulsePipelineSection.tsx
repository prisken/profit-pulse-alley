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
  MP_PULSE_LIVE_CHIP,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

type StepAccent = "pulse" | "sky" | "violet" | "amber";

const PIPELINE_STEPS = [
  {
    step: 1,
    icon: CreditCard,
    titleKey: "home.pipeline.step1.title" as const,
    bodyKey: "home.pipeline.step1.body" as const,
    accent: "pulse" as const,
  },
  {
    step: 2,
    icon: Lock,
    titleKey: "home.pipeline.step2.title" as const,
    bodyKey: "home.pipeline.step2.body" as const,
    accent: "sky" as const,
  },
  {
    step: 3,
    icon: Activity,
    titleKey: "home.pipeline.step3.title" as const,
    bodyKey: "home.pipeline.step3.body" as const,
    accent: "violet" as const,
  },
  {
    step: 4,
    icon: Trophy,
    titleKey: "home.pipeline.step4.title" as const,
    bodyKey: "home.pipeline.step4.body" as const,
    accent: "amber" as const,
  },
] as const;

const ACCENT_STYLES: Record<
  StepAccent,
  {
    card: string;
    glow: string;
    icon: string;
    index: string;
    bar: string;
  }
> = {
  pulse: {
    card: "border-mp-pulse/25 hover:border-mp-pulse/40",
    glow: "bg-mp-pulse/20",
    icon: "border-mp-pulse/35 bg-mp-pulse/15 text-mp-pulse shadow-[0_0_24px_rgba(0,230,118,0.18)]",
    index: "text-mp-pulse/20",
    bar: "from-mp-pulse via-mp-pulse/70 to-transparent",
  },
  sky: {
    card: "border-sky-400/20 hover:border-sky-400/35",
    glow: "bg-sky-400/15",
    icon: "border-sky-400/35 bg-sky-400/12 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.16)]",
    index: "text-sky-300/20",
    bar: "from-sky-400 via-sky-400/70 to-transparent",
  },
  violet: {
    card: "border-violet-400/20 hover:border-violet-400/35",
    glow: "bg-violet-400/15",
    icon: "border-violet-400/35 bg-violet-400/12 text-violet-300 shadow-[0_0_24px_rgba(167,139,250,0.16)]",
    index: "text-violet-300/20",
    bar: "from-violet-400 via-violet-400/70 to-transparent",
  },
  amber: {
    card: "border-amber-400/25 hover:border-amber-400/40",
    glow: "bg-amber-400/15",
    icon: "border-amber-400/40 bg-amber-400/12 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.18)]",
    index: "text-amber-300/25",
    bar: "from-amber-400 via-amber-400/70 to-transparent",
  },
};

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
    <div className="flex justify-center py-1 lg:hidden" aria-hidden="true">
      <div className="h-5 w-px bg-gradient-to-b from-mp-pulse/40 to-white/10" />
    </div>
  );
}

function PipelineStepCard({
  step,
  icon: Icon,
  title,
  body,
  accent,
}: Readonly<{
  step: number;
  icon: LucideIcon;
  title: string;
  body: string;
  accent: StepAccent;
}>) {
  const styles = ACCENT_STYLES[accent];
  const indexLabel = String(step).padStart(2, "0");

  return (
    <article
      className={mergeMpClasses(
        "group relative flex h-full flex-col overflow-hidden",
        MP_TERMINAL_PANEL,
        "bg-gradient-to-b from-white/[0.05] to-transparent p-4 transition-[border-color,box-shadow,transform] duration-300 sm:p-5",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] motion-reduce:transform-none motion-reduce:transition-none",
        styles.card,
      )}
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          styles.bar,
        )}
        aria-hidden="true"
      />
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          styles.glow,
          "opacity-70 motion-reduce:transition-none",
        )}
        aria-hidden="true"
      />
      <span
        className={mergeMpClasses(
          "pointer-events-none absolute -right-1 top-1 select-none text-5xl font-bold leading-none sm:text-6xl",
          MP_METRIC_TEXT,
          styles.index,
        )}
        aria-hidden="true"
      >
        {indexLabel}
      </span>

      <div className="relative">
        <div
          className={mergeMpClasses(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border sm:h-14 sm:w-14",
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
      </div>

      <h3 className="relative mt-4 text-xl font-bold tracking-tight text-white sm:mt-5 sm:text-2xl">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
        {body}
      </p>
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
            className="brand-display mt-3 text-balance text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.pipeline.title")}
          </h2>
        </header>

        <ol className="mt-5 list-none sm:mt-6 lg:mt-8 lg:flex lg:items-stretch lg:justify-between">
          {PIPELINE_STEPS.map(
            ({ step, icon, titleKey, bodyKey, accent }, index) => (
              <li
                key={step}
                className="flex flex-col lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center"
              >
                <PipelineStepCard
                  step={step}
                  icon={icon}
                  title={t(titleKey)}
                  body={t(bodyKey)}
                  accent={accent}
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
              "group relative flex overflow-hidden",
              MP_TERMINAL_PANEL,
              "border-amber-400/25 bg-gradient-to-b from-amber-400/[0.08] to-transparent p-4 transition-[border-color,box-shadow,transform] duration-300 sm:items-center sm:p-5",
              "hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] motion-reduce:transform-none motion-reduce:transition-none",
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400 via-amber-400/70 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-400/20 opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/12 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.18)] sm:h-14 sm:w-14">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </div>
              <div className="relative min-w-0">
                <p
                  className={mergeMpClasses(
                    "text-amber-200/90",
                    MP_TICKER_TEXT,
                  )}
                >
                  {t("home.pipeline.prize.heading")}
                </p>
                <p className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                  {t("home.pipeline.prize.body")}
                </p>
              </div>
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
