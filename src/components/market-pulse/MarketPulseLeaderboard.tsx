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
import LeaderboardStatePanel, {
  LeaderboardLockedPreview,
} from "@/components/market-pulse/LeaderboardStatePanel";
import {
  MarketPulseGlowBackground,
  MarketPulseStatusChip,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  canAccessMarketPulsePlay,
  shouldShowMarketPulsePreLaunchUi,
} from "@/lib/market-pulse/launch-config";
import { useTranslations } from "@/components/providers/LocaleProvider";

const focusRing = MP_FOCUS_RING;

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
    return "bg-amber-500/25 text-amber-200 ring-amber-400/40 shadow-sm shadow-amber-900/30";
  }
  if (rank === 2) {
    return "bg-zinc-400/20 text-zinc-100 ring-zinc-300/30";
  }
  if (rank === 3) {
    return "bg-orange-500/20 text-orange-200 ring-orange-400/30";
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
        entry.rank === 1
          ? "border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-emerald-500/5 to-zinc-900/40 shadow-lg shadow-amber-950/15"
          : isTopThree
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

function CycleStatusChips({
  cycle,
}: Readonly<{ cycle: LeaderboardCycleOption }>) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarketPulseStatusChip
        variant={cycle.labelKind === "current" ? "live" : "archived"}
        label={
          cycle.labelKind === "current"
            ? t("mp.leaderboard.status.current")
            : t("mp.leaderboard.status.archived")
        }
        showPulse={cycle.labelKind === "current" && !cycle.isRevealed}
      />
      <MarketPulseStatusChip
        variant={cycle.isRevealed ? "revealed" : "locked"}
        label={
          cycle.isRevealed
            ? t("mp.leaderboard.status.revealed")
            : t("mp.leaderboard.status.locked")
        }
      />
    </div>
  );
}

function CycleMeta({
  cycle,
}: Readonly<{ cycle: LeaderboardCycleOption }>) {
  const { t, locale } = useTranslations();

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-xl shadow-black/20 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white sm:text-2xl">{cycle.name}</h2>
          <CycleStatusChips cycle={cycle} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("mp.play.chrome.cycleName")}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-200">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            {t("mp.leaderboard.cycleDateRange")
              .replace("{start}", formatCycleDate(cycle.startsAtIso, locale))
              .replace("{end}", formatCycleDate(cycle.endsAtIso, locale))}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("mp.play.stage.reveal")}
          </p>
          <p className="mt-1 text-sm text-zinc-200">
            {formatRevealDate(cycle.revealAtIso, locale)}
          </p>
        </div>
      </div>
    </section>
  );
}

function LeaderboardStandings({
  viewState,
  entries,
  stateMessage,
  lockedTitle,
  lockedBody,
}: Readonly<{
  viewState: MarketPulseLeaderboardPageData["viewState"];
  entries: MarketPulseLeaderboardEntryRow[];
  stateMessage: string | null;
  lockedTitle: string;
  lockedBody: string;
}>) {
  if (viewState === "locked") {
    return (
      <div>
        <LeaderboardStatePanel
          variant="locked"
          title={lockedTitle}
          body={lockedBody}
        />
        <LeaderboardLockedPreview />
      </div>
    );
  }

  if (stateMessage) {
    const variant =
      viewState === "no_scores"
        ? "no_scores"
        : viewState === "no_cycles"
          ? "no_cycles"
          : "unavailable";
    return (
      <LeaderboardStatePanel
        variant={variant}
        title={stateMessage}
        body=""
      />
    );
  }

  if (viewState === "ready") {
    return <LeaderboardPanel entries={entries} />;
  }

  return null;
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
  const showPreLaunchMarketing = shouldShowMarketPulsePreLaunchUi();
  const adminRole =
    status === "authenticated" ? session?.user?.role : undefined;
  const playBlocked = !canAccessMarketPulsePlay(adminRole);
  const { cycles, selectedCycle, entries, viewState, viewerScore } = data;

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.leaderboard_viewed, {
      cycleId: selectedCycle?.id,
      status: viewState,
      surface: "leaderboard",
      route: "/market-pulse/leaderboard",
    });
  }, [selectedCycle?.id, viewState]);

  function handleCycleChange(nextCycleId: string) {
    const params = new URLSearchParams();
    params.set("cycleId", nextCycleId);
    router.push(`/market-pulse/leaderboard?${params.toString()}`);
  }

  const stateMessage =
    viewState === "no_scores"
      ? t("mp.leaderboard.state.noScores")
      : viewState === "no_cycles"
        ? t("mp.leaderboard.state.noCycles")
        : viewState === "unavailable"
          ? t("mp.leaderboard.state.unavailable")
          : null;

  const lockedTitle = t("mp.leaderboard.state.lockedTitle");
  const lockedBody = t("mp.leaderboard.state.lockedBody");

  return (
    <MarketPulseGlowBackground accent="emerald" showGrid className="min-h-screen">
      <div className="relative mx-auto w-full max-w-5xl px-3 py-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <header className="mb-5 space-y-4 sm:mb-6">
          <Link
            href="/market-pulse"
            className={mergeMpClasses(
              "inline-flex min-h-11 items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white",
              focusRing,
            )}
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
              className={mergeMpClasses(
                "inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-bold transition-colors sm:w-auto",
                focusRing,
                playBlocked
                  ? "cursor-not-allowed bg-emerald-400/50 text-zinc-950/70"
                  : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
              )}
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

        <div className="mb-4 space-y-1 rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3 sm:mb-5">
          <p className="text-sm font-medium text-zinc-200">
            {t("mp.leaderboard.header.freshRace")}
          </p>
          <p className="text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {t("mp.leaderboard.header.archiveNote")}
          </p>
        </div>

        {cycles.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:mb-5">
            <label
              htmlFor="leaderboard-cycle-select"
              className="block text-sm font-semibold text-white"
            >
              {t("mp.leaderboard.cycleSelector.label")}
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              {t("mp.leaderboard.cycleSelector.hint")}
            </p>
            <div className="relative mt-3">
              <select
                id="leaderboard-cycle-select"
                value={selectedCycle?.id ?? ""}
                onChange={(event) => handleCycleChange(event.target.value)}
                aria-label={t("mp.leaderboard.cycleSelector.aria")}
                className={mergeMpClasses(
                  "w-full appearance-none rounded-xl border border-emerald-500/25 bg-zinc-950/90 py-3.5 pl-4 pr-10 text-sm font-semibold text-white shadow-inner",
                  focusRing,
                )}
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                    {cycle.labelKind === "current"
                      ? ` · ${t("mp.leaderboard.cycleSelector.currentBadge")}`
                      : ` · ${t("mp.leaderboard.cycleSelector.archivedBadge")}`}
                    {cycle.isRevealed
                      ? ` · ${t("mp.leaderboard.status.revealed")}`
                      : ` · ${t("mp.leaderboard.status.locked")}`}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400/80"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : null}

        {selectedCycle ? (
          <div className="mb-5 sm:mb-6">
            <CycleMeta cycle={selectedCycle} />
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
          <div className="order-2 min-w-0 lg:order-1">
            <section aria-live="polite" aria-label={t("nav.leaderboard")}>
              <LeaderboardStandings
                viewState={viewState}
                entries={entries}
                stateMessage={stateMessage}
                lockedTitle={lockedTitle}
                lockedBody={lockedBody}
              />
            </section>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-[calc(3.75rem+env(safe-area-inset-top,0px)+0.75rem)] lg:max-h-[calc(100dvh-5rem-env(safe-area-inset-top,0px))] lg:overflow-y-auto">
            <MarketPulseLeaderboardMyScore
              panel={viewerScore}
              cycleId={selectedCycle?.id}
            />
          </aside>
        </div>

        <MarketPulseInlineDisclaimer
          className="mt-6 sm:mt-8"
          surface="leaderboard"
          cycleId={selectedCycle?.id}
        />
      </div>
    </MarketPulseGlowBackground>
  );
}
