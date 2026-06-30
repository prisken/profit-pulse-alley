import Link from "next/link";
import {
  Archive,
  Gift,
  Medal,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
} from "@/lib/market-pulse/constants";
import {
  MP_FOCUS_RING,
  MP_SURFACE_STYLES,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const PILLARS = [
  {
    icon: Trophy,
    titleKey: "home.cycleLoop.pillar1.title" as const,
    bodyKey: "home.cycleLoop.pillar1.body" as const,
    accent: "emerald",
  },
  {
    icon: Users,
    titleKey: "home.cycleLoop.pillar2.title" as const,
    bodyKey: "home.cycleLoop.pillar2.body" as const,
    accent: "sky",
  },
  {
    icon: Gift,
    titleKey: "home.cycleLoop.pillar3.title" as const,
    bodyKey: "home.cycleLoop.pillar3.body" as const,
    accent: "amber",
  },
] as const;

const PREVIEW_ROW_KEYS = [
  "home.cycleLoop.preview.player1",
  "home.cycleLoop.preview.player2",
  "home.cycleLoop.preview.player3",
] as const;

const pillarIconStyles = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
} as const;

function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30";
  }
  if (rank === 2) {
    return "bg-zinc-400/15 text-zinc-200 ring-1 ring-zinc-400/25";
  }
  return "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25";
}

function PillarCard({
  icon: Icon,
  title,
  body,
  accent,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  body: string;
  accent: keyof typeof pillarIconStyles;
}>) {
  return (
    <li>
      <article className="flex h-full gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-col sm:rounded-2xl sm:p-5">
        <div
          className={mergeMpClasses(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-11 sm:w-11 sm:rounded-xl",
            pillarIconStyles[accent],
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white sm:mt-3 sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:mt-1.5 sm:text-sm">
            {body}
          </p>
        </div>
      </article>
    </li>
  );
}

function ScoringChip({ label }: Readonly<{ label: string }>) {
  return (
    <li>
      <span className="inline-flex rounded-full border border-white/15 bg-zinc-950/60 px-3 py-1.5 text-xs font-semibold text-zinc-200">
        {label}
      </span>
    </li>
  );
}

export default async function MarketPulseCycleLoopSection() {
  const { t } = await getServerTranslations();

  const scoringChips = [
    t("home.cycleLoop.scoring.participation").replace(
      "{points}",
      String(PARTICIPATION_POINTS),
    ),
    t("home.cycleLoop.scoring.match").replace(
      "{points}",
      String(MATCH_BONUS_POINTS),
    ),
    t("home.cycleLoop.scoring.streak").replace(
      "{points}",
      String(STREAK_BONUS_POINTS),
    ),
  ];

  return (
    <section
      className="border-t border-white/10 bg-zinc-950 px-3 py-8 sm:px-6 sm:py-12 md:py-14"
      aria-labelledby="cycle-loop-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={mergeMpClasses(
            MP_SURFACE_STYLES.elevated,
            "p-4 sm:p-6 md:p-8 lg:p-10",
          )}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                {t("home.cycleLoop.badge")}
              </div>

              <h2
                id="cycle-loop-heading"
                className="mt-3 text-balance text-xl font-bold tracking-tight text-white sm:mt-4 sm:text-3xl"
              >
                {t("home.cycleLoop.title")}
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
                {t("home.cycleLoop.subtitle")}
              </p>

              <ul className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                {PILLARS.map(({ icon, titleKey, bodyKey, accent }) => (
                  <PillarCard
                    key={titleKey}
                    icon={icon}
                    title={t(titleKey)}
                    body={t(bodyKey)}
                    accent={accent}
                  />
                ))}
              </ul>

              <div className="mt-5 sm:mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs">
                  {t("home.cycleLoop.scoring.heading")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {scoringChips.map((label) => (
                    <ScoringChip key={label} label={label} />
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {t("home.cycleLoop.scoring.note")}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap">
                <Link
                  href="/market-pulse/leaderboard"
                  aria-label={t("home.cycleLoop.link.leaderboardAria")}
                  className={mergeMpClasses(
                    "inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 sm:px-6",
                    MP_FOCUS_RING,
                  )}
                >
                  {t("home.cycleLoop.link.leaderboard")}
                </Link>
                <Link
                  href="/contest-rules"
                  aria-label={t("home.cycleLoop.link.rulesAria")}
                  className={mergeMpClasses(
                    "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/10 sm:px-6",
                    MP_FOCUS_RING,
                  )}
                >
                  {t("home.cycleLoop.link.rules")}
                </Link>
              </div>
            </div>

            <aside
              className="flex flex-col gap-4"
              aria-labelledby="cycle-loop-preview-heading"
            >
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl shadow-black/20 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-300/90">
                    <Trophy className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                    <h3
                      id="cycle-loop-preview-heading"
                      className="text-sm font-semibold text-white sm:text-base"
                    >
                      {t("home.cycleLoop.preview.heading")}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t("home.cycleLoop.preview.label")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {t("home.cycleLoop.preview.subtitle")}
                </p>

                <ol
                  className="mt-4 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50"
                  aria-label={t("home.cycleLoop.preview.ariaLabel")}
                >
                  {PREVIEW_ROW_KEYS.map((nameKey, index) => {
                    const rank = index + 1;
                    const RankIcon = rank === 1 ? Trophy : Medal;

                    return (
                      <li
                        key={nameKey}
                        className="flex items-center gap-3 px-3 py-3 sm:px-4"
                      >
                        <span
                          className={mergeMpClasses(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9",
                            rankBadgeClass(rank),
                          )}
                          aria-hidden="true"
                        >
                          {rank <= 2 ? (
                            <RankIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          ) : (
                            rank
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
                          {t(nameKey)}
                        </span>
                        <span
                          className="shrink-0 text-sm font-semibold tabular-nums text-zinc-600"
                          aria-hidden="true"
                        >
                          {t("home.cycleLoop.preview.scoreHidden")}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300">
                    <Gift className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80 sm:text-xs">
                      {t("home.cycleLoop.prize.heading")}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-amber-50 sm:text-base">
                      {t("home.cycleLoop.prize.body")}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
