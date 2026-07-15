import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Lock,
  Ticket,
  Users,
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

type RewardAccent = "amber" | "pulse" | "sky";

const REWARD_CARDS = [
  {
    id: "prize",
    index: 1,
    icon: Ticket,
    titleKey: "home.rewards.prize.title" as const,
    bodyKey: "home.rewards.prize.body" as const,
    ctaKey: "home.rewards.prize.cta" as const,
    ctaAriaKey: "home.rewards.prize.ctaAria" as const,
    href: "/contest-rules",
    accent: "amber" as const,
  },
  {
    id: "events",
    index: 2,
    icon: Users,
    titleKey: "home.rewards.events.title" as const,
    bodyKey: "home.rewards.events.body" as const,
    ctaKey: "home.rewards.events.cta" as const,
    ctaAriaKey: "home.rewards.events.ctaAria" as const,
    href: "/events",
    accent: "pulse" as const,
  },
  {
    id: "ppa",
    index: 3,
    icon: Brain,
    titleKey: "home.rewards.ppa.title" as const,
    bodyKey: "home.rewards.ppa.body" as const,
    ctaKey: "home.rewards.ppa.cta" as const,
    ctaAriaKey: "home.rewards.ppa.ctaAria" as const,
    href: "/market-pulse/rules",
    accent: "sky" as const,
  },
] as const;

const ACCENT_STYLES: Record<
  RewardAccent,
  {
    card: string;
    glow: string;
    icon: string;
    index: string;
    bar: string;
    cta: string;
  }
> = {
  amber: {
    card: "border-amber-400/25 hover:border-amber-400/40",
    glow: "bg-amber-400/15",
    icon: "border-amber-400/40 bg-amber-400/12 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.18)]",
    index: "text-amber-300/25",
    bar: "from-amber-400 via-amber-400/70 to-transparent",
    cta: "text-amber-300 hover:text-amber-200",
  },
  pulse: {
    card: "border-mp-pulse/25 hover:border-mp-pulse/40",
    glow: "bg-mp-pulse/20",
    icon: "border-mp-pulse/35 bg-mp-pulse/15 text-mp-pulse shadow-[0_0_24px_rgba(0,230,118,0.18)]",
    index: "text-mp-pulse/20",
    bar: "from-mp-pulse via-mp-pulse/70 to-transparent",
    cta: "text-mp-pulse hover:text-mp-pulse/80",
  },
  sky: {
    card: "border-sky-400/20 hover:border-sky-400/35",
    glow: "bg-sky-400/15",
    icon: "border-sky-400/35 bg-sky-400/12 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.16)]",
    index: "text-sky-300/20",
    bar: "from-sky-400 via-sky-400/70 to-transparent",
    cta: "text-sky-300 hover:text-sky-200",
  },
};

function PrizeTicketSilhouette() {
  return (
    <svg
      viewBox="0 0 80 40"
      className="h-8 w-16 text-amber-300/55"
      aria-hidden="true"
    >
      <path
        d="M4 8h72a2 2 0 0 1 2 2v4a6 6 0 0 0 0 12v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a6 6 0 0 0 0-12V10a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M28 8v24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
    </svg>
  );
}

function RewardCard({
  index,
  icon: Icon,
  title,
  body,
  cta,
  ctaAria,
  href,
  accent,
  showTicketArt,
  lockedNote,
}: Readonly<{
  index: number;
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  ctaAria: string;
  href: string;
  accent: RewardAccent;
  showTicketArt?: boolean;
  lockedNote?: string;
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
          {showTicketArt ? (
            <div className="relative pt-1">
              <PrizeTicketSilhouette />
            </div>
          ) : null}
        </div>

        <h3 className="relative mt-4 text-xl font-bold tracking-tight text-white sm:mt-5 sm:text-2xl">
          {title}
        </h3>
        <p className="relative mt-2 flex-1 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          {body}
        </p>
        {lockedNote ? (
          <p className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {lockedNote}
          </p>
        ) : null}
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

export default async function HomeRewardsShowcase() {
  const { t } = await getServerTranslations();

  return (
    <section
      className={MP_HOME_SECTION}
      aria-labelledby="home-rewards-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="home-rewards-heading"
            className="text-balance text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.rewards.title")}
          </h2>
        </header>

        <ul className="mt-5 grid list-none gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:mt-8 lg:grid-cols-3">
          {REWARD_CARDS.map(
            ({
              id,
              index,
              icon,
              titleKey,
              bodyKey,
              ctaKey,
              ctaAriaKey,
              href,
              accent,
            }) => (
              <RewardCard
                key={id}
                index={index}
                icon={icon}
                title={t(titleKey)}
                body={t(bodyKey)}
                cta={t(ctaKey)}
                ctaAria={t(ctaAriaKey)}
                href={href}
                accent={accent}
                showTicketArt={id === "prize"}
                lockedNote={
                  id === "ppa" ? t("home.rewards.ppa.lockedNote") : undefined
                }
              />
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
