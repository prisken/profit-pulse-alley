import { BrainCircuit, Swords, Trophy } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";

const CARD_CONFIG = [
  {
    icon: Swords,
    headingKey: "home.playLearnWin.daily.heading" as const,
    textKey: "home.playLearnWin.daily.text" as const,
    accent: "emerald",
  },
  {
    icon: BrainCircuit,
    headingKey: "home.playLearnWin.fireside.heading" as const,
    textKey: "home.playLearnWin.fireside.text" as const,
    accent: "amber",
  },
  {
    icon: Trophy,
    headingKey: "home.playLearnWin.prize.heading" as const,
    textKey: "home.playLearnWin.prize.text" as const,
    accent: "violet",
  },
] as const;

const accentStyles = {
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
} as const;

export default async function PlayLearnWinSection() {
  const { t } = await getServerTranslations();

  return (
    <section
      className="border-t border-white/10 bg-zinc-950 px-3 py-6 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="play-learn-win-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="play-learn-win-heading"
          className="text-center text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          {t("home.playLearnWin.heading")}
        </h2>

        <ul className="mt-4 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {CARD_CONFIG.map(({ icon: Icon, headingKey, textKey, accent }) => (
            <li key={headingKey}>
              <article className="flex h-full gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:flex-col sm:rounded-2xl sm:p-7">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-12 sm:w-12 sm:rounded-xl ${accentStyles[accent]}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white sm:mt-5 sm:text-xl">
                    {t(headingKey)}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-zinc-400 sm:mt-2 sm:text-base sm:leading-relaxed">
                    {t(textKey)}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
