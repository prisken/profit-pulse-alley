"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ChevronDown,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { MarketPulseLeaderboardPageData } from "@/lib/market-pulse/leaderboard-data";
import type { LeaderboardCycleOption } from "@/lib/market-pulse/leaderboard-cycle-select";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import MarketPulseLeaderboardMyScore from "@/components/market-pulse/MarketPulseLeaderboardMyScore";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  canAccessMarketPulsePlay,
  isBeforePublicLaunch,
} from "@/lib/market-pulse/launch-config";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

function formatPoints(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function formatCycleDate(value: string, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(value));
}

function formatRevealDate(value: string, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(value));
}

function rankStyles(rank: number): string {
  if (rank === 1) {
    return "bg-amber-500/20 text-amber-300 ring-amber-500/30";
  }
  if (rank === 2) {
    return "bg-zinc-400/15 text-zinc-200 ring-zinc-400/25";
  }
  if (rank === 3) {
    return "bg-orange-500/15 text-orange-300 ring-orange-500/25";
  }
  return "bg-zinc-800/80 text-zinc-400 ring-zinc-700/50";
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const { t } = useTranslations();
  const Icon = rank === 1 ? Trophy : rank <= 3 ? Medal : Award;

  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 sm:h-9 sm:w-9 sm:text-sm ${rankStyles(rank)}`}
      aria-label={t("mp.leaderboard.aria.rank").replace("{rank}", String(rank))}
    >
      {rank <= 3 ? (
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      ) : (
        <span className="tabular-nums">{rank}</span>
      )}
    </span>
  );
}

function LeaderboardRow({
  entry,
  index,
  showCardsPlayed,
}: Readonly<{
  entry: MarketPulseLeaderboardEntryRow;
  index: number;
  showCardsPlayed: boolean;
}>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const isTopThree = entry.rank <= 3;

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, x: -14, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 380, damping: 30, delay: index * 0.045 }
      }
      whileHover={reduceMotion ? undefined : { scale: 1.01, x: 3 }}
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3.5 ${
        isTopThree
          ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-zinc-900/40 shadow-lg shadow-emerald-950/10"
          : "border-zinc-800/80 bg-zinc-900/50"
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.image}
              alt=""
              className="hidden h-9 w-9 shrink-0 rounded-full border border-zinc-700 object-cover sm:block"
            />
          ) : (
            <div
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 sm:flex"
              aria-hidden="true"
            >
              {entry.playerName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span
              className={`block truncate text-sm font-medium sm:text-base ${
                isTopThree ? "text-white" : "text-zinc-200"
              }`}
            >
              {entry.playerName}
            </span>
            {showCardsPlayed && entry.cardsPlayed != null ? (
              <span className="mt-0.5 block text-[11px] text-zinc-500 sm:hidden">
                {entry.cardsPlayed === 1
                  ? t("mp.leaderboard.cardsPlayed").replace("{count}", String(entry.cardsPlayed))
                  : t("mp.leaderboard.cardsPlayedPlural").replace("{count}", String(entry.cardsPlayed))}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {showCardsPlayed && entry.cardsPlayed != null ? (
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("mp.leaderboard.col.cards")}
          </p>
          <p className="text-sm font-semibold tabular-nums text-zinc-300">
            {entry.cardsPlayed}
          </p>
        </div>
      ) : null}

      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {t("mp.leaderboard.col.points")}
        </p>
        <p
          className={`text-sm font-bold tabular-nums sm:text-lg ${
            isTopThree ? "text-emerald-300" : "text-emerald-400/90"
          }`}
        >
          {formatPoints(entry.score)}
        </p>
      </div>
    </motion.li>
  );
}

function CycleStatusBadge({
  cycle,
}: Readonly<{ cycle: LeaderboardCycleOption }>) {
  const { t } = useTranslations();

  if (cycle.labelKind === "current") {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
        {t("mp.leaderboard.status.current")}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
      {t("mp.leaderboard.status.archived")}
    </span>
  );
}

function CycleMeta({
  cycle,
}: Readonly<{ cycle: LeaderboardCycleOption }>) {
  const { t, locale } = useTranslations();

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-white sm:text-lg">{cycle.name}</h2>
        <CycleStatusBadge cycle={cycle} />
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
            cycle.isRevealed
              ? "bg-sky-500/10 text-sky-300 ring-sky-500/25"
              : "bg-amber-500/10 text-amber-200 ring-amber-500/25"
          }`}
        >
          {cycle.isRevealed
            ? t("mp.leaderboard.status.revealed")
            : t("mp.leaderboard.status.locked")}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-xs text-zinc-400 sm:text-sm">
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
          {t("mp.leaderboard.cycleDateRange")
            .replace("{start}", formatCycleDate(cycle.startsAtIso, locale))
            .replace("{end}", formatCycleDate(cycle.endsAtIso, locale))}
        </p>
        <p>
          {t("mp.leaderboard.revealDate").replace(
            "{date}",
            formatRevealDate(cycle.revealAtIso, locale),
          )}
        </p>
      </div>
    </div>
  );
}

function StateMessage({
  message,
}: Readonly<{ message: string }>) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-12 text-center sm:px-6 sm:py-14">
      <Sparkles className="mx-auto h-8 w-8 text-zinc-600" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-zinc-300">{message}</p>
    </div>
  );
}

function LeaderboardPanel({
  entries,
}: Readonly<{ entries: MarketPulseLeaderboardEntryRow[] }>) {
  const showCardsPlayed = entries.some((entry) => entry.cardsPlayed != null);

  return (
    <ul className="space-y-2 sm:space-y-2.5">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            index={index}
            showCardsPlayed={showCardsPlayed}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

export default function MarketPulseLeaderboard({
  data,
}: Readonly<{ data: MarketPulseLeaderboardPageData }>) {
  const { t } = useTranslations();
  const router = useRouter();
  const { data: session, status } = useSession();
  const showPreLaunchMarketing = isBeforePublicLaunch();
  const adminRole =
    status === "authenticated" ? session?.user?.role : undefined;
  const playBlocked = !canAccessMarketPulsePlay(adminRole);
  const { cycles, selectedCycle, entries, viewState, viewerScore } = data;

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.leaderboard_viewed, {
      cycleId: selectedCycle?.id,
      status: viewState,
      surface: "leaderboard",
    });
  }, [selectedCycle?.id, viewState]);

  function handleCycleChange(nextCycleId: string) {
    const params = new URLSearchParams();
    params.set("cycleId", nextCycleId);
    router.push(`/market-pulse/leaderboard?${params.toString()}`);
  }

  const stateMessage =
    viewState === "locked"
      ? t("mp.leaderboard.state.locked")
      : viewState === "no_scores"
        ? t("mp.leaderboard.state.noScores")
        : viewState === "no_cycles"
          ? t("mp.leaderboard.state.noCycles")
          : viewState === "unavailable"
            ? t("mp.leaderboard.state.unavailable")
            : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-3xl px-3 py-6 sm:px-6 sm:py-12">
        <header className="mb-5 space-y-4 sm:mb-6">
          <Link
            href="/market-pulse"
            className={`inline-flex min-h-11 items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("nav.marketPulse")}
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <Trophy className="h-6 w-6 shrink-0 text-amber-400 sm:h-7 sm:w-7" aria-hidden="true" />
              {t("nav.leaderboard")}
            </h1>
            <Link
              href="/market-pulse/play"
              className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-bold transition-colors sm:w-auto ${focusRing} ${
                playBlocked
                  ? "cursor-not-allowed bg-emerald-400/50 text-zinc-950/70"
                  : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
              }`}
              aria-disabled={playBlocked}
              onClick={playBlocked ? (event) => event.preventDefault() : undefined}
            >
              {playBlocked ? t("mp.hub.cta.opens") : t("mp.hub.cta.playToday")}
            </Link>
          </div>
        </header>

        {showPreLaunchMarketing ? (
          <MarketPulseLaunchAnnouncement className="mb-5 sm:mb-6" variant="compact" />
        ) : null}

        <p className="mb-4 text-xs text-zinc-400 sm:mb-5 sm:text-sm">
          {t("mp.leaderboard.cycleResetNotice")}
        </p>

        {cycles.length > 0 ? (
          <div className="mb-4 sm:mb-5">
            <label
              htmlFor="leaderboard-cycle-select"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              {t("mp.leaderboard.cycleSelector.label")}
            </label>
            <div className="relative">
              <select
                id="leaderboard-cycle-select"
                value={selectedCycle?.id ?? ""}
                onChange={(event) => handleCycleChange(event.target.value)}
                aria-label={t("mp.leaderboard.cycleSelector.aria")}
                className={`w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/80 py-3 pl-4 pr-10 text-sm font-medium text-white ${focusRing}`}
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                    {cycle.labelKind === "current"
                      ? ` (${t("mp.leaderboard.status.current")})`
                      : ` (${t("mp.leaderboard.status.archived")})`}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : null}

        {selectedCycle ? <CycleMeta cycle={selectedCycle} /> : null}

        <div className="mt-5 sm:mt-6">
          <MarketPulseLeaderboardMyScore
            panel={viewerScore}
            cycleId={selectedCycle?.id}
          />
        </div>

        <section className="mt-5 space-y-3 sm:mt-6 sm:space-y-4" aria-live="polite">
          {stateMessage ? <StateMessage message={stateMessage} /> : null}
          {viewState === "ready" ? <LeaderboardPanel entries={entries} /> : null}
        </section>

        <MarketPulseInlineDisclaimer
          className="mt-6 sm:mt-8"
          surface="leaderboard"
          cycleId={selectedCycle?.id}
        />
      </div>
    </div>
  );
}
