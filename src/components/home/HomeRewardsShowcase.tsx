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
  MP_PULSE_ACCENT_ICON,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const REWARD_CARDS = [
  {
    id: "prize",
    icon: Ticket,
    titleKey: "home.rewards.prize.title" as const,
    bodyKey: "home.rewards.prize.body" as const,
    ctaKey: "home.rewards.prize.cta" as const,
    ctaAriaKey: "home.rewards.prize.ctaAria" as const,
    href: "/contest-rules",
    accent: "amber",
  },
  {
    id: "events",
    icon: Users,
    titleKey: "home.rewards.events.title" as const,
    bodyKey: "home.rewards.events.body" as const,
    ctaKey: "home.rewards.events.cta" as const,
    ctaAriaKey: "home.rewards.events.ctaAria" as const,
    href: "/events",
    accent: "pulse",
  },
  {
    id: "ppa",
    icon: Brain,
    titleKey: "home.rewards.ppa.title" as const,
    bodyKey: "home.rewards.ppa.body" as const,
    ctaKey: "home.rewards.ppa.cta" as const,
    ctaAriaKey: "home.rewards.ppa.ctaAria" as const,
    href: "/market-pulse/rules",
    accent: "sky",
  },
] as const;

const iconStyles = {
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  pulse: MP_PULSE_ACCENT_ICON,
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
} as const;

function PrizeTicketSilhouette() {
  return (
    <svg
      viewBox="0 0 80 40"
      className="h-8 w-16 text-amber-300/50"
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
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  ctaAria: string;
  href: string;
  accent: keyof typeof iconStyles;
  showTicketArt?: boolean;
  lockedNote?: string;
}>) {
  return (
    <li className="h-full">
      <article
        className={mergeMpClasses(
          "flex h-full flex-col",
          MP_TERMINAL_PANEL,
          "p-4 sm:p-5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={mergeMpClasses(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              iconStyles[accent],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {showTicketArt ? <PrizeTicketSilhouette /> : null}
        </div>
        <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">
          {title}
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-mp-muted">
          {body}
        </p>
        {lockedNote ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {lockedNote}
          </p>
        ) : null}
        <Link
          href={href}
          aria-label={ctaAria}
          className={mergeMpClasses(
            "mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-mp-pulse transition-colors hover:text-mp-pulse/80",
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
          <p className={mergeMpClasses(MP_TICKER_TEXT, "text-zinc-500")}>
            {t("home.rewards.eyebrow")}
          </p>
          <h2
            id="home-rewards-heading"
            className="mt-2 text-balance text-xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {t("home.rewards.title")}
          </h2>
          <p className="mt-2 text-pretty text-sm text-mp-muted sm:text-base">
            {t("home.rewards.subtitle")}
          </p>
        </header>

        <ul className="mt-6 grid list-none gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {REWARD_CARDS.map(
            ({
              id,
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
                icon={icon}
                title={t(titleKey)}
                body={t(bodyKey)}
                cta={t(ctaKey)}
                ctaAria={t(ctaAriaKey)}
                href={href}
                accent={accent}
                showTicketArt={id === "prize"}
                lockedNote={id === "ppa" ? t("home.rewards.ppa.lockedNote") : undefined}
              />
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
