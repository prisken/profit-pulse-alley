import Image from "next/image";
import { Layers, Shield, TrendingUp, type LucideIcon } from "lucide-react";

import { getExpertsShowcase } from "@/lib/home/proof-of-concept";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_TERMINAL_PANEL,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

type PillarAccent = "pulse" | "amber" | "sky";

const PILLARS = [
  {
    id: "offense",
    index: 1,
    icon: TrendingUp,
    titleKey: "home.philosophy.pillar.offense.title" as const,
    bodyKey: "home.philosophy.pillar.offense.body" as const,
    accent: "pulse" as const,
  },
  {
    id: "defense",
    index: 2,
    icon: Shield,
    titleKey: "home.philosophy.pillar.defense.title" as const,
    bodyKey: "home.philosophy.pillar.defense.body" as const,
    accent: "amber" as const,
  },
  {
    id: "compounding",
    index: 3,
    icon: Layers,
    titleKey: "home.philosophy.pillar.compounding.title" as const,
    bodyKey: "home.philosophy.pillar.compounding.body" as const,
    accent: "sky" as const,
  },
] as const;

const ACCENT_STYLES: Record<
  PillarAccent,
  {
    card: string;
    glow: string;
    icon: string;
    iconInner: string;
    bar: string;
    index: string;
  }
> = {
  pulse: {
    card: "border-mp-pulse/25 hover:border-mp-pulse/40",
    glow: "bg-mp-pulse/25",
    icon: "border-mp-pulse/40 bg-mp-pulse/15 text-mp-pulse shadow-[0_0_36px_rgba(0,230,118,0.28)]",
    iconInner: "from-mp-pulse/20 to-transparent",
    bar: "from-mp-pulse via-mp-pulse/70 to-transparent",
    index: "text-mp-pulse/20",
  },
  amber: {
    card: "border-amber-400/25 hover:border-amber-400/40",
    glow: "bg-amber-400/20",
    icon: "border-amber-400/45 bg-amber-400/12 text-amber-300 shadow-[0_0_36px_rgba(251,191,36,0.28)]",
    iconInner: "from-amber-400/20 to-transparent",
    bar: "from-amber-400 via-amber-400/70 to-transparent",
    index: "text-amber-300/25",
  },
  sky: {
    card: "border-sky-400/20 hover:border-sky-400/35",
    glow: "bg-sky-400/20",
    icon: "border-sky-400/40 bg-sky-400/12 text-sky-300 shadow-[0_0_36px_rgba(56,189,248,0.24)]",
    iconInner: "from-sky-400/20 to-transparent",
    bar: "from-sky-400 via-sky-400/70 to-transparent",
    index: "text-sky-300/20",
  },
};

function PhilosophyPillar({
  index,
  icon: Icon,
  title,
  body,
  accent,
}: Readonly<{
  index: number;
  icon: LucideIcon;
  title: string;
  body: string;
  accent: PillarAccent;
}>) {
  const styles = ACCENT_STYLES[accent];
  const indexLabel = String(index).padStart(2, "0");

  return (
    <li className="h-full">
      <article
        className={mergeMpClasses(
          "group relative flex h-full flex-col items-center overflow-hidden text-center",
          MP_TERMINAL_PANEL,
          "bg-gradient-to-b from-white/[0.05] to-transparent px-4 pb-5 pt-6 transition-[border-color,box-shadow,transform] duration-300 sm:px-5 sm:pb-6 sm:pt-8",
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
            "pointer-events-none absolute left-1/2 top-4 h-36 w-36 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100",
            styles.glow,
            "opacity-70 motion-reduce:transition-none",
          )}
          aria-hidden="true"
        />
        <span
          className={mergeMpClasses(
            "pointer-events-none absolute right-2 top-2 select-none text-4xl font-bold leading-none sm:text-5xl",
            MP_METRIC_TEXT,
            styles.index,
          )}
          aria-hidden="true"
        >
          {indexLabel}
        </span>

        <div
          className={mergeMpClasses(
            "relative flex h-20 w-20 items-center justify-center rounded-[1.35rem] border sm:h-24 sm:w-24 sm:rounded-[1.5rem]",
            styles.icon,
          )}
        >
          <div
            className={mergeMpClasses(
              "pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b",
              styles.iconInner,
            )}
            aria-hidden="true"
          />
          <Icon
            className="relative h-10 w-10 sm:h-12 sm:w-12"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>

        <h3 className="relative mt-5 text-lg font-bold tracking-tight text-white sm:mt-6 sm:text-xl">
          {title}
        </h3>
        <p className="relative mt-2 max-w-[16rem] text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          {body}
        </p>
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

        <ul className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:gap-5">
          {PILLARS.map(({ id, index, icon, titleKey, bodyKey, accent }) => (
            <PhilosophyPillar
              key={id}
              index={index}
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
