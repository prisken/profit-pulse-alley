"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  Sparkles,
  Trophy,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import MarketPulseSwipeCard from "@/components/market-pulse/MarketPulseSwipeCard";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  formatRevealMessage,
  translateCyclePlayabilityIssue,
  translateMarketPulseError,
} from "@/lib/i18n/market-pulse-ui";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import type { MarketPulseDecision } from "@/lib/market-pulse/constants";
import type { MarketPulsePlayPageData } from "@/lib/market-pulse/play-data";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";
import { submitMarketPulseDecisionAction } from "@/lib/market-pulse/player-actions";
import type { MarketPulseSwipeSubmitResult } from "@/lib/market-pulse/types";

type PlayLeaderboardEntry = MarketPulsePlayPageData["leaderboardEntries"][number];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const pageEnter = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: MARKET_PULSE_EASE },
  },
};

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function PlayLeaderboard({
  entries,
  revealed,
  compact = false,
}: Readonly<{
  entries: PlayLeaderboardEntry[];
  revealed: boolean;
  compact?: boolean;
}>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <aside
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/20 ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
      aria-labelledby="play-leaderboard-heading"
    >
      <div className="flex items-center gap-2 text-emerald-300/90">
        <Trophy className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
        <h2
          id="play-leaderboard-heading"
          className={`font-semibold text-white ${compact ? "text-base" : "text-lg"}`}
        >
          {t("mp.play.leaderboard.title")}
        </h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {revealed
          ? t("mp.play.leaderboard.subtitleRevealed")
          : t("mp.play.leaderboard.subtitlePreReveal")}
      </p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          {t("mp.play.leaderboard.empty")}
        </p>
      ) : (
        <ol className={`mt-3 space-y-1.5 ${compact ? "" : "sm:mt-4 sm:space-y-2"}`}>
          {entries.slice(0, compact ? 5 : undefined).map((entry, index) => (
            <motion.li
              key={entry.userId}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduceMotion ? 0.15 : 0.35,
                delay: reduceMotion ? 0 : index * 0.05,
                ease: MARKET_PULSE_EASE,
              }}
              className="flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 transition-colors"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  entry.rank === 1
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                {entry.playerName}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-300">
                {formatScore(entry.score)}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function PreLaunchState({
  isAuthenticated,
  loginHref,
}: Readonly<{
  isAuthenticated: boolean;
  loginHref: string;
}>) {
  const { t } = useTranslations();

  return (
    <div className="space-y-5">
      <MarketPulseLaunchAnnouncement variant="compact" className="text-left" />

      {!isAuthenticated ? (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link
            href={loginHref}
            className={`inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
          >
            {t("mp.play.preLaunch.signIn")}
          </Link>
          <Link
            href="/market-pulse"
            className={`inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900 ${focusRing}`}
          >
            {t("mp.play.preLaunch.hub")}
          </Link>
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-400">
          {t("mp.play.preLaunch.signedIn")}
        </p>
      )}

      <div className="text-center">
        <Link
          href="/market-pulse"
          className={`inline-flex min-h-11 items-center text-sm font-medium text-emerald-300 underline-offset-4 hover:underline ${focusRing}`}
        >
          {t("mp.play.backToHub")}
        </Link>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: Readonly<{
  title: string;
  description: string;
  icon: typeof Sparkles;
}>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.4 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 px-5 py-10 text-center sm:px-6 sm:py-12"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-400 sm:h-14 sm:w-14">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white sm:mt-5 sm:text-xl">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      <Link
        href="/market-pulse"
        className={`mt-5 inline-flex min-h-11 items-center text-sm font-medium text-emerald-300 underline-offset-4 hover:underline ${focusRing}`}
      >
        {t("mp.play.backToHub")}
      </Link>
    </motion.div>
  );
}

function PlayChromeHeader({
  showCycleChrome,
  dayCurrent,
  dayTotal,
  challengeName,
  revealAtIso,
}: Readonly<{
  showCycleChrome: boolean;
  dayCurrent: number;
  dayTotal: number;
  challengeName: string;
  revealAtIso: string;
}>) {
  const { t } = useTranslations();

  return (
    <header className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/market-pulse"
          className={`inline-flex min-h-10 min-w-10 items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t("nav.backToPulse")}</span>
        </Link>

        {showCycleChrome ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 px-1">
            <span className="max-w-[9rem] truncate rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] text-zinc-400 sm:max-w-none sm:text-xs">
              {challengeName}
            </span>
            <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200 sm:text-xs">
              {t("mp.play.chrome.day")
                .replace("{current}", String(dayCurrent))
                .replace("{total}", String(dayTotal))}
            </span>
          </div>
        ) : (
          <span className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher variant="dark" className="shrink-0" />
          <Link
            href="/market-pulse/leaderboard"
            className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white sm:px-2 ${focusRing}`}
          >
            <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="hidden sm:inline">{t("nav.board")}</span>
          </Link>
        </div>
      </div>

      {showCycleChrome ? (
        <details className="group mx-auto max-w-6xl px-3 pb-2 lg:hidden">
          <summary
            className={`cursor-pointer list-none text-xs text-zinc-500 marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span className="group-open:hidden">{t("mp.play.chrome.showCycle")}</span>
            <span className="hidden group-open:inline">{t("mp.play.chrome.hideCycle")}</span>
          </summary>
          <div className="mt-2 grid gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
            <CycleProgress
              variant="compact"
              dayCurrent={dayCurrent}
              dayTotal={dayTotal}
            />
            <MarketPulseCountdown
              variant="compact"
              targetDate={revealAtIso}
            />
          </div>
        </details>
      ) : null}
    </header>
  );
}

export default function MarketPulsePlayExperience({
  data,
}: Readonly<{ data: MarketPulsePlayPageData }>) {
  const { t, locale } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/market-pulse/play")}`;

  const handleSubmit = useCallback(
    async (decision: MarketPulseDecision): Promise<MarketPulseSwipeSubmitResult> => {
      if (!data.card) {
        return { ok: false, error: t("mp.error.noCardAvailable") };
      }

      const result = await submitMarketPulseDecisionAction({
        cardId: data.card.id,
        decision,
      });

      if (!result.ok) {
        if (result.code === "ALREADY_SUBMITTED") {
          return { ok: true };
        }
        return { ok: false, error: result.error };
      }

      return { ok: true };
    },
    [data.card, t],
  );

  const revealMessage = formatRevealMessage(locale, data.revealAtLabel || null);
  const lockedFooterMessage = t("mp.play.locked.footer");

  const showCycleChrome =
    data.status !== "pre_launch" &&
    data.status !== "no_active_cycle" &&
    data.dayTotal > 0;

  const hasCard =
    Boolean(data.card) &&
    (data.status === "sign_in_required" ||
      data.status === "locked" ||
      data.status === "playable");

  const isCardFocusState =
    data.status === "playable" ||
    data.status === "sign_in_required" ||
    data.status === "locked";

  useEffect(() => {
    if (!data.card) {
      return;
    }

    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.card_viewed, {
      cardId: data.card.id,
      cycleId: data.cycleId ?? undefined,
      dayIndex: data.dayCurrent,
      surface: "play",
    });
  }, [data.card, data.cycleId, data.dayCurrent]);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-zinc-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <PlayChromeHeader
        showCycleChrome={showCycleChrome}
        dayCurrent={data.dayCurrent}
        dayTotal={data.dayTotal}
        challengeName={data.challengeName}
        revealAtIso={data.revealAtIso}
      />

      <motion.div
        className="relative mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col px-3 py-2 sm:px-6 sm:py-4"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={pageEnter}
      >
        {showCycleChrome ? (
          <div className="mb-4 hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 lg:block">
            <div className="flex items-center justify-between gap-6">
              <CycleProgress
                className="max-w-md flex-1"
                dayCurrent={data.dayCurrent}
                dayTotal={data.dayTotal}
              />
              <MarketPulseCountdown targetDate={data.revealAtIso} />
            </div>
          </div>
        ) : null}

        <div
          className={`flex min-h-0 flex-1 flex-col ${
            hasCard ? "lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-6" : ""
          }`}
        >
          <div
            className={`min-w-0 ${
              hasCard
                ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                : "overflow-y-auto"
            }`}
          >
            {data.status === "pre_launch" ? (
              <PreLaunchState
                isAuthenticated={data.isAuthenticated}
                loginHref={loginHref}
              />
            ) : null}

            {data.status === "no_active_cycle" ||
            data.status === "cycle_unavailable" ? (
              <EmptyState
                icon={CalendarClock}
                title={
                  data.status === "cycle_unavailable"
                    ? t("mp.play.status.cycleClosed")
                    : t("mp.play.status.noCycle")
                }
                description={
                  data.unavailableIssue
                    ? translateCyclePlayabilityIssue(locale, data.unavailableIssue)
                    : data.unavailableReason
                      ? translateMarketPulseError(locale, data.unavailableReason)
                      : t("mp.play.status.checkBack")
                }
              />
            ) : null}

            {data.status === "no_card_today" ? (
              <EmptyState
                icon={Sparkles}
                title={t("mp.play.status.noCardTitle")}
                description={t("mp.play.status.noCardBody")}
              />
            ) : null}

            {data.status === "sign_in_required" && data.card ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
                  <p className="text-xs leading-snug text-emerald-100 sm:text-sm">
                    {t("mp.play.signInBanner")}
                  </p>
                  <Link
                    href={loginHref}
                    className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-300 sm:text-sm ${focusRing}`}
                  >
                    {t("mp.play.preLaunch.signIn")}
                  </Link>
                </div>
                <MarketPulseSwipeCard
                  card={data.card}
                  disabled
                  className="min-h-0 flex-1"
                  analyticsContext={{
                    cycleId: data.cycleId ?? undefined,
                    dayIndex: data.dayCurrent,
                  }}
                  onSubmit={async () => ({
                    ok: false,
                    error: t("mp.error.signInRequired"),
                  })}
                  revealMessage={revealMessage}
                />
              </div>
            ) : null}

            {(data.status === "locked" || data.status === "playable") &&
            data.card ? (
              <motion.div
                key={data.card.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.4, ease: MARKET_PULSE_EASE }
                }
                className={`flex min-h-0 flex-1 flex-col ${
                  data.status === "locked" ? "overflow-y-auto" : "overflow-hidden"
                }`}
              >
                <MarketPulseSwipeCard
                  card={data.card}
                  className="min-h-0 flex-1"
                  initialDecision={data.lockedDecision}
                  analyticsContext={{
                    cycleId: data.cycleId ?? undefined,
                    dayIndex: data.dayCurrent,
                  }}
                  onSubmit={handleSubmit}
                  revealMessage={revealMessage}
                  lockedFooterMessage={lockedFooterMessage}
                />
              </motion.div>
            ) : null}
          </div>

          {data.status !== "pre_launch" && data.status !== "no_active_cycle" ? (
            <aside className="mt-3 hidden shrink-0 lg:sticky lg:top-3 lg:mt-0 lg:block lg:self-start">
              <PlayLeaderboard
                entries={data.leaderboardEntries}
                revealed={data.leaderboardRevealed}
              />
            </aside>
          ) : null}
        </div>

        {data.status !== "pre_launch" &&
        data.status !== "no_active_cycle" &&
        !isCardFocusState ? (
          <details className="mt-3 shrink-0 lg:hidden">
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-zinc-300 marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
              {t("mp.play.mobile.leaderboard")}
            </summary>
            <div className="mt-2 pb-2">
              <PlayLeaderboard
                compact
                entries={data.leaderboardEntries}
                revealed={data.leaderboardRevealed}
              />
            </div>
          </details>
        ) : null}

        {isCardFocusState ? (
          <details className="mt-2 shrink-0 lg:hidden">
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs text-zinc-500 marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              {t("mp.play.mobile.leaderboardLegal")}
            </summary>
            <div className="mt-2 space-y-3 pb-2">
              <PlayLeaderboard
                compact
                entries={data.leaderboardEntries}
                revealed={data.leaderboardRevealed}
              />
              <MarketPulseInlineDisclaimer
                surface="play"
                cycleId={data.cycleId ?? undefined}
              />
            </div>
          </details>
        ) : (
          <MarketPulseInlineDisclaimer
            className="mt-3 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden sm:mt-4"
            surface="play"
            cycleId={data.cycleId ?? undefined}
          />
        )}

        <MarketPulseInlineDisclaimer
          className="mt-4 hidden shrink-0 lg:block"
          surface="play"
          cycleId={data.cycleId ?? undefined}
        />
      </motion.div>
    </div>
  );
}
