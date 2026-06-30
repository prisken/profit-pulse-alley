import { BookOpen, Lock, Sparkles, type LucideIcon } from "lucide-react";

import HowItWorksCtaLink from "@/components/home/HowItWorksCtaLink";
import { getServerTranslations } from "@/lib/i18n/server";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import {
  MP_SURFACE_STYLES,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const STEPS = [
  {
    step: 1,
    icon: BookOpen,
    titleKey: "home.howItWorks.step1.title" as const,
    bodyKey: "home.howItWorks.step1.body" as const,
    accent: "emerald",
  },
  {
    step: 2,
    icon: Lock,
    titleKey: "home.howItWorks.step2.title" as const,
    bodyKey: "home.howItWorks.step2.body" as const,
    accent: "amber",
  },
  {
    step: 3,
    icon: Sparkles,
    titleKey: "home.howItWorks.step3.title" as const,
    bodyKey: "home.howItWorks.step3.body" as const,
    accent: "sky",
  },
] as const;

const iconStyles = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
} as const;

const stepBadgeStyles = {
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-200",
} as const;

function StepCard({
  step,
  icon: Icon,
  title,
  body,
  stepLabel,
  accent,
}: Readonly<{
  step: number;
  icon: LucideIcon;
  title: string;
  body: string;
  stepLabel: string;
  accent: keyof typeof iconStyles;
}>) {
  return (
    <li>
      <article
        className={mergeMpClasses(
          "flex h-full flex-col",
          MP_SURFACE_STYLES.glass,
          "p-4 sm:p-6",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <span
            className={mergeMpClasses(
              "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[11px] font-bold tabular-nums",
              stepBadgeStyles[accent],
            )}
            aria-hidden="true"
          >
            {String(step).padStart(2, "0")}
          </span>
          <div
            className={mergeMpClasses(
              "flex h-10 w-10 items-center justify-center rounded-xl border sm:h-11 sm:w-11",
              iconStyles[accent],
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs">
          {stepLabel}
        </p>
        <h3 className="mt-1 text-base font-semibold text-white sm:mt-1.5 sm:text-xl">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400 sm:mt-2">
          {body}
        </p>
      </article>
    </li>
  );
}

export default async function MarketPulseHowItWorksSection() {
  const { t } = await getServerTranslations();
  const preLaunch = isBeforePublicLaunch();
  const ctaHref = preLaunch ? "/market-pulse" : "/market-pulse/play";
  const ctaLabel = preLaunch
    ? t("home.howItWorks.ctaTry")
    : t("home.howItWorks.ctaPlayToday");
  const ctaAria = preLaunch
    ? t("home.howItWorks.ctaTryAria")
    : t("home.howItWorks.ctaPlayTodayAria");
  const ctaStatus = preLaunch ? "pre_launch" : "live";

  return (
    <section
      className="border-t border-white/10 bg-zinc-950 px-3 py-8 sm:px-6 sm:py-12 md:py-14"
      aria-labelledby="how-market-pulse-works-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="how-market-pulse-works-heading"
            className="text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.howItWorks.title")}
          </h2>
        </header>

        <ol className="mt-6 grid list-none gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3">
          {STEPS.map(({ step, icon, titleKey, bodyKey, accent }) => (
            <StepCard
              key={step}
              step={step}
              icon={icon}
              title={t(titleKey)}
              body={t(bodyKey)}
              stepLabel={t("home.howItWorks.stepLabel").replace(
                "{step}",
                String(step),
              )}
              accent={accent}
            />
          ))}
        </ol>

        <div className="mt-6 flex justify-center sm:mt-10">
          <HowItWorksCtaLink
            href={ctaHref}
            label={ctaLabel}
            ariaLabel={ctaAria}
            status={ctaStatus}
          />
        </div>
      </div>
    </section>
  );
}
