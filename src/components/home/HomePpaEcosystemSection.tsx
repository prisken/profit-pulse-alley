import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HandHelping,
  LineChart,
  type LucideIcon,
} from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_FOCUS_RING,
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_TERMINAL_PANEL,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

type EcosystemAccent = "pulse" | "sky" | "violet";

const ECOSYSTEM_CARDS = [
  {
    id: "market-pulse",
    index: 1,
    icon: LineChart,
    accent: "pulse" as const,
    badgeKey: "home.ecosystem.marketPulse.badge" as const,
    titleKey: "home.ecosystem.marketPulse.title" as const,
    bodyKey: "home.ecosystem.marketPulse.body" as const,
    ctaKey: "home.ecosystem.marketPulse.cta" as const,
    ctaAriaKey: "home.ecosystem.marketPulse.ctaAria" as const,
    href: "/market-pulse/play",
  },
  {
    id: "events",
    index: 2,
    icon: CalendarDays,
    accent: "sky" as const,
    badgeKey: "home.ecosystem.events.badge" as const,
    titleKey: "home.ecosystem.events.title" as const,
    bodyKey: "home.ecosystem.events.body" as const,
    ctaKey: "home.ecosystem.events.cta" as const,
    ctaAriaKey: "home.ecosystem.events.ctaAria" as const,
    href: "/events",
  },
  {
    id: "matching-pulse",
    index: 3,
    icon: HandHelping,
    accent: "violet" as const,
    badgeKey: "home.ecosystem.matchingPulse.badge" as const,
    titleKey: "home.ecosystem.matchingPulse.title" as const,
    bodyKey: "home.ecosystem.matchingPulse.body" as const,
    ctaKey: "home.ecosystem.matchingPulse.cta" as const,
    ctaAriaKey: "home.ecosystem.matchingPulse.ctaAria" as const,
    href: "/matching-pulse",
  },
] as const;

const ACCENT_STYLES: Record<
  EcosystemAccent,
  {
    card: string;
    glow: string;
    icon: string;
    index: string;
    bar: string;
    cta: string;
    badge: string;
  }
> = {
  pulse: {
    card: "border-mp-pulse/25 hover:border-mp-pulse/40",
    glow: "bg-mp-pulse/20",
    icon: "border-mp-pulse/35 bg-mp-pulse/15 text-mp-pulse shadow-[0_0_24px_rgba(0,230,118,0.18)]",
    index: "text-mp-pulse/20",
    bar: "from-mp-pulse via-mp-pulse/70 to-transparent",
    cta: "text-mp-pulse hover:text-mp-pulse/80",
    badge:
      "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse",
  },
  sky: {
    card: "border-sky-400/20 hover:border-sky-400/35",
    glow: "bg-sky-400/15",
    icon: "border-sky-400/35 bg-sky-400/12 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.16)]",
    index: "text-sky-300/20",
    bar: "from-sky-400 via-sky-400/70 to-transparent",
    cta: "text-sky-300 hover:text-sky-200",
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
  violet: {
    card: "border-violet-400/20 hover:border-violet-400/35",
    glow: "bg-violet-400/15",
    icon: "border-violet-400/35 bg-violet-400/12 text-violet-300 shadow-[0_0_24px_rgba(167,139,250,0.16)]",
    index: "text-violet-300/20",
    bar: "from-violet-400 via-violet-400/70 to-transparent",
    cta: "text-violet-300 hover:text-violet-200",
    badge: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  },
};

function EcosystemCard({
  index,
  icon: Icon,
  badge,
  title,
  body,
  cta,
  ctaAria,
  href,
  accent,
}: Readonly<{
  index: number;
  icon: LucideIcon;
  badge: string;
  title: string;
  body: string;
  cta: string;
  ctaAria: string;
  href: string;
  accent: EcosystemAccent;
}>) {
  const styles = ACCENT_STYLES[accent];
  const indexLabel = String(index).padStart(2, "0");

  return (
    <li className="h-full">
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

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={mergeMpClasses(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border sm:h-14 sm:w-14",
              styles.icon,
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <span
            className={mergeMpClasses(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]",
              styles.badge,
            )}
          >
            {badge}
          </span>
        </div>

        <h3 className="relative mt-4 text-xl font-bold tracking-tight text-white sm:mt-5 sm:text-2xl">
          {title}
        </h3>
        <p className="relative mt-2 flex-1 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          {body}
        </p>

        <Link
          href={href}
          aria-label={ctaAria}
          className={mergeMpClasses(
            "relative mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold transition-colors",
            styles.cta,
            MP_FOCUS_RING,
          )}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>
    </li>
  );
}

export default async function HomePpaEcosystemSection() {
  const { t } = await getServerTranslations();

  return (
    <section
      className={MP_HOME_SECTION}
      aria-labelledby="home-ecosystem-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="home-ecosystem-heading"
            className="brand-display text-balance text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.ecosystem.title")}
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400 sm:mt-4 sm:text-[15px]">
            {t("home.ecosystem.body")}
          </p>
        </header>

        <ul
          className="mt-5 grid list-none gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:mt-8 lg:grid-cols-3"
          aria-label={t("home.ecosystem.listAria")}
        >
          {ECOSYSTEM_CARDS.map((card) => (
            <EcosystemCard
              key={card.id}
              index={card.index}
              icon={card.icon}
              accent={card.accent}
              badge={t(card.badgeKey)}
              title={t(card.titleKey)}
              body={t(card.bodyKey)}
              cta={t(card.ctaKey)}
              ctaAria={t(card.ctaAriaKey)}
              href={card.href}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
