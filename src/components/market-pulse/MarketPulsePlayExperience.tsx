"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  Lock,
  LogIn,
  PauseCircle,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import MarketPulseSwipeCard from "@/components/market-pulse/MarketPulseSwipeCard";
import PlayStatusCard from "@/components/market-pulse/PlayStatusCard";
import type { DecisionLockedCardContext } from "@/components/market-pulse/DecisionLockedCard";
import {
  MarketPulseGlowBackground,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
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
import type { SiteLocale } from "@/lib/i18n/locales";

type PlayLeaderboardEntry = MarketPulsePlayPageData["leaderboardEntries"][number];

const focusRing = MP_FOCUS_RING;

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

function formatHubDate(iso: string, locale: SiteLocale, withTime = false): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
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
          : t("mp.play.leaderboard.subtitleLocked")}
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
              {revealed ? (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-300">
                  {formatScore(entry.score)}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-300/90">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("mp.play.leaderboard.scoreLocked")}
                </span>
              )}
            </motion.li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function PlayNonPlayableState({
  data,
  loginHref,
  locale,
}: Readonly<{
  data: MarketPulsePlayPageData;
  loginHref: string;
  locale: SiteLocale;
}>) {
  const { t } = useTranslations();

  if (data.status === "pre_launch") {
    return (
      <div className="space-y-4">
        <PlayStatusCard
          icon={CalendarClock}
          accent="emerald"
          showSignalPreview
          title={t("mp.play.state.preLaunch.title")}
          body={t("mp.play.state.preLaunch.body")}
          detail={
            data.isAuthenticated ? t("mp.play.state.preLaunch.signedIn") : undefined
          }
          ctas={
            data.isAuthenticated
              ? [
                  {
                    label: t("mp.play.state.preLaunch.cta.hub"),
                    href: "/market-pulse",
                    variant: "primary",
                  },
                ]
              : [
                  {
                    label: t("mp.play.state.preLaunch.cta.hub"),
                    href: "/market-pulse",
                    variant: "secondary",
                  },
                  {
                    label: t("mp.play.state.preLaunch.cta.account"),
                    href: loginHref,
                    variant: "primary",
                  },
                ]
          }
        />
      </div>
    );
  }

  if (data.status === "sign_in_required" && data.card) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <PlayStatusCard
          icon={LogIn}
          accent="emerald"
          showSignalPreview
          title={t("mp.play.state.signIn.title")}
          body={t("mp.play.state.signIn.body")}
          ctas={[
            {
              label: t("mp.play.state.signIn.cta.signIn"),
              href: loginHref,
              variant: "primary",
            },
            {
              label: t("mp.play.state.signIn.cta.hub"),
              href: "/market-pulse",
              variant: "secondary",
            },
          ]}
        />
        <MarketPulseSwipeCard
          card={data.card}
          disabled
          className="min-h-0 shrink-0"
          analyticsContext={{
            cycleId: data.cycleId ?? undefined,
            dayIndex: data.dayCurrent,
          }}
          onSubmit={async () => ({
            ok: false,
            error: t("mp.error.signInRequired"),
          })}
          revealMessage={formatRevealMessage(locale, data.revealAtLabel || null)}
        />
      </div>
    );
  }

  if (data.status === "no_active_cycle") {
    return (
      <PlayStatusCard
        icon={CalendarClock}
        accent="zinc"
        title={t("mp.play.state.noCycle.title")}
        body={t("mp.play.state.noCycle.body")}
        ctas={[
          {
            label: t("mp.play.state.noCycle.cta.leaderboard"),
            href: "/market-pulse/leaderboard",
            variant: "primary",
          },
          {
            label: t("mp.play.state.noCycle.cta.hub"),
            href: "/market-pulse",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  if (data.status === "cycle_unavailable") {
    const detail = data.unavailableIssue
      ? translateCyclePlayabilityIssue(locale, data.unavailableIssue)
      : data.unavailableReason
        ? translateMarketPulseError(locale, data.unavailableReason)
        : undefined;

    return (
      <PlayStatusCard
        icon={PauseCircle}
        accent="amber"
        title={t("mp.play.state.cycleUnavailable.title")}
        body={t("mp.play.state.cycleUnavailable.body")}
        detail={detail}
        ctas={[
          {
            label: t("mp.play.state.cycleUnavailable.cta.leaderboard"),
            href: "/market-pulse/leaderboard",
            variant: "primary",
          },
          {
            label: t("mp.play.state.cycleUnavailable.cta.hub"),
            href: "/market-pulse",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  if (data.status === "runtime_closed") {
    return (
      <PlayStatusCard
        icon={Wrench}
        accent="zinc"
        title={t("mp.play.state.runtimeClosed.title")}
        body={t("mp.play.state.runtimeClosed.body")}
        ctas={[
          {
            label: t("mp.play.state.runtimeClosed.cta.leaderboard"),
            href: "/market-pulse/leaderboard",
            variant: "primary",
          },
          {
            label: t("mp.play.state.runtimeClosed.cta.hub"),
            href: "/market-pulse",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  if (data.status === "no_card_today") {
    return (
      <PlayStatusCard
        icon={Sparkles}
        accent="emerald"
        showSignalPreview
        title={t("mp.play.state.noCard.title")}
        body={t("mp.play.state.noCard.body")}
        ctas={[
          {
            label: t("mp.play.state.noCard.cta.leaderboard"),
            href: "/market-pulse/leaderboard",
            variant: "primary",
          },
          {
            label: t("mp.play.state.noCard.cta.hub"),
            href: "/market-pulse",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  return null;
}

function PlayStatusPanel({
  data,
  locale,
  compact = false,
}: Readonly<{
  data: Pick<
    MarketPulsePlayPageData,
    | "challengeName"
    | "prizeLabel"
    | "dayCurrent"
    | "dayTotal"
    | "revealAtIso"
    | "revealAtLabel"
    | "leaderboardRevealed"
  >;
  locale: SiteLocale;
  compact?: boolean;
}>) {
  const { t } = useTranslations();

  return (
    <section
      className={mergeMpClasses(
        "rounded-2xl border border-white/10 bg-zinc-950/70 shadow-xl shadow-black/20",
        compact ? "p-3" : "p-4 sm:p-5",
      )}
      aria-labelledby={compact ? "play-status-mobile-heading" : "play-status-heading"}
    >
      <h2
        id={compact ? "play-status-mobile-heading" : "play-status-heading"}
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs"
      >
        {t("mp.play.stage.statusHeading")}
      </h2>

      <div className="mt-3 space-y-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("mp.play.chrome.cycleName")}
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">{data.challengeName}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <CycleProgress
            variant="compact"
            dayCurrent={data.dayCurrent}
            dayTotal={data.dayTotal}
          />
        </div>

        {data.prizeLabel ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
              {t("mp.play.stage.prize")}
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-50">{data.prizeLabel}</p>
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("mp.play.stage.reveal")}
          </p>
          <MarketPulseCountdown variant="compact" targetDate={data.revealAtIso} />
          {data.revealAtLabel ? (
            <p className="mt-2 text-xs text-zinc-500">
              {t("mp.play.reveal.scheduled").replace("{date}", data.revealAtLabel)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              {formatHubDate(data.revealAtIso, locale, true)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <Trophy className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <p className="text-sm text-zinc-300">
            {data.leaderboardRevealed
              ? t("mp.play.stage.leaderboardLive")
              : t("mp.play.stage.leaderboardLocked")}
          </p>
        </div>
      </div>
    </section>
  );
}

function PlayChromeHeader({
  showCycleChrome,
  challengeName,
  dayCurrent,
  dayTotal,
  statusPanelData,
  locale,
}: Readonly<{
  showCycleChrome: boolean;
  challengeName: string;
  dayCurrent: number;
  dayTotal: number;
  statusPanelData: Pick<
    MarketPulsePlayPageData,
    | "challengeName"
    | "prizeLabel"
    | "dayCurrent"
    | "dayTotal"
    | "revealAtIso"
    | "revealAtLabel"
    | "leaderboardRevealed"
  >;
  locale: SiteLocale;
}>) {
  const { t } = useTranslations();

  return (
    <header className="shrink-0 overflow-x-clip border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm">
      {/* Mobile: compact centered logo + top-right controls (matches play page target layout) */}
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <Link
          href="/market-pulse"
          className={mergeMpClasses(
            "absolute left-0 top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex min-h-10 min-w-10 items-center justify-center text-zinc-400 transition-colors hover:text-white",
            focusRing,
          )}
          aria-label={t("nav.backToPulse")}
        >
          <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>

        <div className="mx-auto flex w-full max-w-[220px] items-center justify-center px-10">
          <Link
            href="/market-pulse"
            className={mergeMpClasses("block w-full", focusRing)}
            aria-label={t("nav.marketPulse")}
          >
            <MarketPulseLogo variant="play" />
          </Link>
        </div>

        <div className="absolute right-0 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher variant="dark" className="shrink-0" />
          <Link
            href="/market-pulse/leaderboard"
            className={mergeMpClasses(
              "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white",
              focusRing,
            )}
            aria-label={t("nav.board")}
          >
            <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          </Link>
        </div>

        {showCycleChrome ? (
          <div className="mt-2 flex flex-col items-center gap-1 px-10">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
              {t("mp.play.chrome.day")
                .replace("{current}", String(dayCurrent))
                .replace("{total}", String(dayTotal))}
            </span>
            <p className="max-w-[16rem] line-clamp-2 text-balance text-center text-[11px] font-medium leading-snug text-zinc-400">
              {challengeName}
            </p>
          </div>
        ) : null}
      </div>

      {/* Tablet/desktop: three-column chrome header */}
      <div className="mx-auto hidden max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:grid md:px-6">
        <Link
          href="/market-pulse"
          className={mergeMpClasses(
            "inline-flex min-h-10 items-center gap-1 justify-self-start text-sm text-zinc-400 transition-colors hover:text-white",
            focusRing,
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t("nav.backToPulse")}</span>
        </Link>

        <div className="flex min-w-0 max-w-[360px] flex-col items-center justify-center gap-1 justify-self-center">
          <div className="flex w-full items-center justify-center gap-2">
            <Link
              href="/market-pulse"
              className={mergeMpClasses(
                "inline-flex w-full max-w-[280px] shrink-0 items-center justify-center",
                focusRing,
              )}
              aria-label={t("nav.marketPulse")}
            >
              <MarketPulseLogo variant="header" className="w-full" />
            </Link>
            {showCycleChrome ? (
              <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                {t("mp.play.chrome.day")
                  .replace("{current}", String(dayCurrent))
                  .replace("{total}", String(dayTotal))}
              </span>
            ) : null}
          </div>
          {showCycleChrome ? (
            <p className="max-w-xs line-clamp-2 text-balance text-center text-xs font-medium leading-snug text-zinc-400">
              {challengeName}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 justify-self-end">
          <LanguageSwitcher variant="dark" className="shrink-0" />
          <Link
            href="/market-pulse/leaderboard"
            className={mergeMpClasses(
              "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white",
              focusRing,
            )}
          >
            <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>{t("nav.board")}</span>
          </Link>
        </div>
      </div>

      {showCycleChrome ? (
        <details className="group mx-auto max-w-6xl px-3 pb-2 lg:hidden">
          <summary
            className={mergeMpClasses(
              "cursor-pointer list-none text-xs text-zinc-500 marker:content-none [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            <span className="group-open:hidden">{t("mp.play.chrome.showCycle")}</span>
            <span className="hidden group-open:inline">{t("mp.play.chrome.hideCycle")}</span>
          </summary>
          <div className="mt-2 space-y-3">
            <PlayStatusPanel data={statusPanelData} locale={locale} compact />
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

  const lockedCycleContext: DecisionLockedCardContext = {
    dayCurrent: data.dayCurrent,
    dayTotal: data.dayTotal,
    challengeName: data.challengeName,
  };

  const showCycleChrome =
    data.status !== "pre_launch" &&
    data.status !== "no_active_cycle" &&
    data.status !== "cycle_unavailable" &&
    data.dayTotal > 0;

  const isNonPlayableStatus =
    data.status === "pre_launch" ||
    data.status === "no_active_cycle" ||
    data.status === "cycle_unavailable" ||
    data.status === "runtime_closed" ||
    data.status === "no_card_today" ||
    data.status === "sign_in_required";

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
    <MarketPulseGlowBackground
      accent="emerald"
      showGrid
      className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain"
    >
      <PlayChromeHeader
        showCycleChrome={showCycleChrome}
        challengeName={data.challengeName}
        dayCurrent={data.dayCurrent}
        dayTotal={data.dayTotal}
        statusPanelData={{
          challengeName: data.challengeName,
          prizeLabel: data.prizeLabel,
          dayCurrent: data.dayCurrent,
          dayTotal: data.dayTotal,
          revealAtIso: data.revealAtIso,
          revealAtLabel: data.revealAtLabel,
          leaderboardRevealed: data.leaderboardRevealed,
        }}
        locale={locale}
      />

      <motion.div
        className="relative mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={pageEnter}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col ${
            hasCard
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]"
              : ""
          }`}
        >
          <div
            className={`min-w-0 ${
              hasCard
                ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                : "overflow-y-auto"
            }`}
          >
            {isNonPlayableStatus ? (
              <PlayNonPlayableState
                data={data}
                loginHref={loginHref}
                locale={locale}
              />
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
                  lockedCycleContext={lockedCycleContext}
                />
              </motion.div>
            ) : null}
          </div>

          {data.status !== "pre_launch" &&
          data.status !== "no_active_cycle" &&
          data.status !== "cycle_unavailable" ? (
            <aside className="mt-3 hidden min-w-0 shrink-0 space-y-4 lg:sticky lg:top-3 lg:mt-0 lg:block lg:self-start">
              {showCycleChrome ? (
                <PlayStatusPanel data={{
                  challengeName: data.challengeName,
                  prizeLabel: data.prizeLabel,
                  dayCurrent: data.dayCurrent,
                  dayTotal: data.dayTotal,
                  revealAtIso: data.revealAtIso,
                  revealAtLabel: data.revealAtLabel,
                  leaderboardRevealed: data.leaderboardRevealed,
                }} locale={locale} />
              ) : null}
              <PlayLeaderboard
                entries={data.leaderboardEntries}
                revealed={data.leaderboardRevealed}
              />
            </aside>
          ) : null}
        </div>

        {data.status !== "pre_launch" &&
        data.status !== "no_active_cycle" &&
        data.status !== "cycle_unavailable" &&
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
            className="mt-3 shrink-0 lg:hidden sm:mt-4"
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
    </MarketPulseGlowBackground>
  );
}
