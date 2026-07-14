import Image from "next/image";
import { Layers, Shield, TrendingUp, type LucideIcon } from "lucide-react";

import { getExpertsShowcase } from "@/lib/home/proof-of-concept";
import { getServerTranslations } from "@/lib/i18n/server";
import { MP_HOME_SECTION, MP_PULSE_ACCENT_ICON, MP_TERMINAL_PANEL, mergeMpClasses } from "@/lib/market-pulse/visual-primitives";

const PILLARS = [
  {
    id: "offense",
    icon: TrendingUp,
    titleKey: "home.philosophy.pillar.offense.title" as const,
    bodyKey: "home.philosophy.pillar.offense.body" as const,
    accent: "emerald",
  },
  {
    id: "defense",
    icon: Shield,
    titleKey: "home.philosophy.pillar.defense.title" as const,
    bodyKey: "home.philosophy.pillar.defense.body" as const,
    accent: "amber",
  },
  {
    id: "compounding",
    icon: Layers,
    titleKey: "home.philosophy.pillar.compounding.title" as const,
    bodyKey: "home.philosophy.pillar.compounding.body" as const,
    accent: "sky",
  },
] as const;

const accentStyles = {
  emerald: MP_PULSE_ACCENT_ICON,
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-300",
} as const;

function PhilosophyPillar({
  icon: Icon,
  title,
  body,
  accent,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  body: string;
  accent: keyof typeof accentStyles;
}>) {
  return (
    <li>
      <article className={mergeMpClasses("flex h-full flex-col p-4 sm:p-5", MP_TERMINAL_PANEL)}>
        <div
          className={mergeMpClasses(
            "flex h-10 w-10 items-center justify-center rounded-lg border sm:h-11 sm:w-11 sm:rounded-xl",
            accentStyles[accent],
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-white sm:mt-4 sm:text-lg">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-mp-muted">{body}</p>
      </article>
    </li>
  );
}

export default async function PhilosophySection() {
  const { t, locale } = await getServerTranslations();
  const experts = getExpertsShowcase(locale);

  return (
    <section
      id="philosophy"
      className={MP_HOME_SECTION}
      aria-labelledby="philosophy-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <h2
            id="philosophy-heading"
            className="text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            {t("home.philosophy.heading")}
          </h2>
        </header>

        <ul className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {PILLARS.map(({ id, icon, titleKey, bodyKey, accent }) => (
            <PhilosophyPillar
              key={id}
              icon={icon}
              title={t(titleKey)}
              body={t(bodyKey)}
              accent={accent}
            />
          ))}
        </ul>

        <div className="mt-7 border-t border-white/10 pt-7 sm:mt-8 sm:pt-8">
          <h3 className="text-center text-base font-semibold tracking-tight text-white sm:text-xl">
            {t("home.philosophy.mindsHeading")}
          </h3>
          <ul className="mt-5 flex flex-wrap justify-center gap-6 sm:mt-6 sm:gap-10 md:gap-14">
            {experts.map((expert) => (
              <li key={expert.name} className="flex flex-col items-center text-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-amber-400/40 ring-2 ring-amber-500/10 sm:h-24 sm:w-24 sm:ring-4 md:h-28 md:w-28">
                  <Image
                    src={expert.headshotSrc}
                    alt={expert.name}
                    fill
                    className={`object-cover ${
                      expert.imageObjectPosition === "top"
                        ? "object-top"
                        : "object-center"
                    }`}
                    sizes="112px"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-white sm:text-base">
                  {expert.name}
                </p>
                <p className="mt-0.5 max-w-[12rem] text-[11px] leading-snug text-zinc-400 sm:max-w-[14rem] sm:text-sm">
                  {expert.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
