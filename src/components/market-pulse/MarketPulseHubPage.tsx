"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Lock,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import CycleProgress from "@/components/market-pulse/CycleProgress";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import MarketPulseLogo from "@/components/market-pulse/MarketPulseLogo";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import {
  MarketPulseGlowBackground,
  MarketPulseStatusChip,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import type { MarketPulseHubPageData } from "@/lib/market-pulse/hub-data";
import {
  deriveHubLobbyStatus,
  deriveHubPrimaryCta,
  type HubLobbyStatus,
  type HubPrimaryCtaKind,
} from "@/lib/market-pulse/hub-lobby-state";
import {
  canAccessMarketPulsePlay,
  isBeforePublicLaunch,
} from "@/lib/market-pulse/launch-config";
import type { MarketPulseMessageKey } from "@/lib/i18n/messages/market-pulse-messages";
import type { SiteLocale } from "@/lib/i18n/locales";

type HubLeaderboardEntry = MarketPulseHubPageData["leaderboardEntries"][number];

const JOURNEY_STEP_KEYS = [
  "mp.hub.lobby.journey.read",
  "mp.hub.lobby.journey.decide",
  "mp.hub.lobby.journey.reveal",
  "mp.hub.lobby.journey.rank",
] as const;

const JOURNEY_ICONS = [BookOpen, Target, Sparkles, Trophy] as const;

function formatHubDate(iso: string, locale: SiteLocale, withTime = false): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

function statusLabelKey(status: HubLobbyStatus): MarketPulseMessageKey {
  switch (status) {
    case "pre_launch":
      return "mp.hub.lobby.status.preLaunch";
    case "open":
      return "mp.hub.lobby.status.open";
    case "reveal_pending":
      return "mp.hub.lobby.status.revealPending";
    case "revealed":
      return "mp.hub.lobby.status.revealed";
    case "closed":
    default:
      return "mp.hub.lobby.status.closed";
  }
}

function statusChipVariant(status: HubLobbyStatus) {
  switch (status) {
    case "pre_launch":
      return "preLaunch" as const;
    case "open":
      return "live" as const;
    case "reveal_pending":
      return "locked" as const;
    case "revealed":
      return "revealed" as const;
    case "closed":
    default:
      return "paused" as const;
  }
}

function primaryCtaLabelKey(kind: HubPrimaryCtaKind): MarketPulseMessageKey {
  switch (kind) {
    case "get_ready":
      return "mp.hub.lobby.cta.getReady";
    case "play":
      return "mp.hub.lobby.cta.playToday";
    case "sign_in":
      return "mp.hub.cta.signInPlay";
    case "view_reveal":
      return "mp.hub.lobby.cta.viewReveal";
    case "view_leaderboard":
      return "mp.hub.lobby.cta.viewLeaderboard";
    case "view_rules":
    default:
      return "mp.hub.lobby.cta.viewRules";
  }
}

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function HubPrimaryCtaButton({
  kind,
  href,
  disabled,
  lobbyStatus,
  cycleId,
}: Readonly<{
  kind: HubPrimaryCtaKind;
  href: string;
  disabled: boolean;
  lobbyStatus: HubLobbyStatus;
  cycleId: string | null;
}>) {
  const { t } = useTranslations();
  const label = t(primaryCtaLabelKey(kind));

  const trackClick = () => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.hub_cta_clicked, {
      cta: kind,
      status: lobbyStatus,
      route: href,
      surface: "hub",
      cycleId: cycleId ?? undefined,
    });
  };

  const className = mergeMpClasses(
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold shadow-lg sm:w-auto sm:min-w-[14rem] sm:px-8",
    MP_FOCUS_RING,
    disabled
      ? "cursor-not-allowed bg-emerald-400/60 text-zinc-950/80 shadow-emerald-900/20"
      : "bg-emerald-400 text-zinc-950 shadow-emerald-900/40 transition-colors hover:bg-emerald-300 active:bg-emerald-500",
  );

  if (disabled) {
    return (
      <button type="button" disabled className={className}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className} onClick={trackClick}>
      {label}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}

function HubPlayerJourneyStrip() {
  const { t } = useTranslations();

  return (
    <section
      className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5"
      aria-labelledby="hub-journey-heading"
    >
      <h2
        id="hub-journey-heading"
        className="text-sm font-semibold text-white sm:text-base"
      >
        {t("mp.hub.lobby.journey.heading")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
        {t("mp.hub.lobby.journey.subtitle")}
      </p>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {JOURNEY_STEP_KEYS.map((key, index) => {
          const Icon = JOURNEY_ICONS[index]!;
          return (
            <li key={key}>
              <div className="flex h-full flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center sm:px-3">
                <Icon
                  className="h-4 w-4 text-emerald-400/90 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <span className="mt-2 break-words text-center text-[11px] font-semibold text-zinc-200 sm:text-xs">
                  {t(key)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function HubCycleStatusPanel({
  data,
  locale,
  lobbyStatus,
}: Readonly<{
  data: MarketPulseHubPageData;
  locale: SiteLocale;
  lobbyStatus: HubLobbyStatus;
}>) {
  const { t } = useTranslations();
  const showCycleDetails = data.hasDatabaseCycle || lobbyStatus === "pre_launch";

  if (!showCycleDetails) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-white">
          {t("mp.hub.lobby.noCycle.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {t("mp.hub.lobby.noCycle.body")}
        </p>
      </section>
    );
  }

  const leaderboardStateLabel = data.leaderboardRevealed
    ? t("mp.hub.lobby.cycle.leaderboardLive")
    : t("mp.hub.lobby.cycle.leaderboardLocked");

  return (
    <section
      className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:p-5"
      aria-labelledby="hub-cycle-status-heading"
    >
      <h2
        id="hub-cycle-status-heading"
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs"
      >
        {t("mp.hub.lobby.cycle.panelHeading")}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {t("mp.hub.lobby.cycle.dates")}
          </p>
          <p className="mt-1.5 text-sm font-medium text-zinc-100">
            {t("mp.hub.lobby.cycle.dateRange")
              .replace("{start}", formatHubDate(data.startsAtIso, locale))
              .replace("{end}", formatHubDate(data.endsAtIso, locale))}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <CycleProgress
            variant="compact"
            dayCurrent={data.dayCurrent}
            dayTotal={data.dayTotal}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 sm:col-span-2">
          <MarketPulseCountdown variant="compact" targetDate={data.revealAtIso} />
          <p className="mt-2 text-xs text-zinc-500">
            {t("mp.hub.lobby.cycle.revealAt").replace(
              "{date}",
              formatHubDate(data.revealAtIso, locale, true),
            )}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
            {t("mp.prize.heading")}
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-50">
            {data.prizeLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/50 p-3 sm:col-span-2">
          <Trophy className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <p className="text-sm text-zinc-300">{leaderboardStateLabel}</p>
        </div>
      </div>
    </section>
  );
}

function HubLeaderboardPreview({
  entries,
  revealed,
}: Readonly<{
  entries: HubLeaderboardEntry[];
  revealed: boolean;
}>) {
  const { t } = useTranslations();

  const showLockedState = !revealed;
  const hasEntries = entries.length > 0;

  return (
    <section
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl shadow-black/20 sm:p-5"
      aria-labelledby="hub-leaderboard-preview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300/90">
            <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h2
              id="hub-leaderboard-preview-heading"
              className="text-lg font-semibold text-white"
            >
              {t("nav.leaderboard")}
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            {revealed
              ? t("mp.hub.leaderboard.subtitleRevealed")
              : t("mp.hub.lobby.leaderboard.subtitleLocked")}
          </p>
        </div>
        <Link
          href="/market-pulse/leaderboard"
          className={mergeMpClasses(
            "inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-300 underline-offset-4 hover:underline",
            MP_FOCUS_RING,
          )}
        >
          {t("mp.hub.leaderboard.full")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {showLockedState && !hasEntries ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-amber-300/80" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-zinc-200">
            {t("mp.hub.lobby.leaderboard.lockedTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            {t("mp.hub.lobby.leaderboard.lockedBody")}
          </p>
        </div>
      ) : null}

      {showLockedState && hasEntries ? (
        <ol className="mt-4 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className="flex items-center gap-3 px-3 py-3 sm:px-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                {entry.playerName}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-300/90">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {t("mp.hub.lobby.leaderboard.scoreLocked")}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {!showLockedState && !hasEntries ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-zinc-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-zinc-300">
            {t("mp.hub.leaderboard.emptyTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t("mp.hub.leaderboard.emptyBody")}</p>
        </div>
      ) : null}

      {!showLockedState && hasEntries ? (
        <ol className="mt-4 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className="flex items-center gap-3 px-3 py-3 sm:px-4"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  entry.rank === 1
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-zinc-800 text-zinc-300"
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
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function HubPrizeCallout({ prizeLabel }: Readonly<{ prizeLabel: string }>) {
  const { t } = useTranslations();

  return (
    <aside className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80 sm:text-xs">
        {t("mp.hub.lobby.prize.heading")}
      </p>
      <p className="mt-2 text-sm font-semibold leading-snug text-amber-50 sm:text-base">
        {prizeLabel}
      </p>
      <Link
        href="/contest-rules"
        className={mergeMpClasses(
          "mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-amber-200 underline-offset-4 hover:underline",
          MP_FOCUS_RING,
        )}
      >
        {t("mp.hub.lobby.prize.rulesLink")}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </aside>
  );
}

export default function MarketPulseHubPage({
  data,
}: Readonly<{ data: MarketPulseHubPageData }>) {
  const { t, locale } = useTranslations();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const showPreLaunchMarketing = isBeforePublicLaunch();
  const adminRole =
    status === "authenticated" ? session?.user?.role : undefined;
  const playBlocked = !canAccessMarketPulsePlay(adminRole);
  const lobbyStatus = deriveHubLobbyStatus(data, playBlocked);
  const primaryCta = deriveHubPrimaryCta(lobbyStatus, {
    isAuthenticated,
    runtimeOpen: data.runtimeOpen,
  });

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.market_pulse_viewed, {
      cycleId: data.cycleId ?? undefined,
      surface: "hub",
    });
  }, [data.cycleId]);

  return (
    <MarketPulseGlowBackground accent="emerald" showGrid className="min-h-screen">
      <main className="mx-auto w-full max-w-5xl px-3 py-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 lg:py-12">
        {showPreLaunchMarketing ? (
          <MarketPulseLaunchAnnouncement className="mb-4 sm:mb-6" variant="compact" />
        ) : null}

        <header
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900/95 to-zinc-950 p-4 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-6 md:p-8"
          aria-labelledby="market-pulse-title"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <MarketPulseStatusChip
                variant={statusChipVariant(lobbyStatus)}
                label={t(statusLabelKey(lobbyStatus))}
                showPulse={lobbyStatus === "open"}
                className="motion-reduce:[&_span]:animate-none"
              />

              <h1 id="market-pulse-title" className="mt-4">
                <MarketPulseLogo variant="hero" priority />
              </h1>

              <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                {data.challengeName}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                {t("mp.hub.taglineLong")}
              </p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <HubPrimaryCtaButton
                  kind={primaryCta.kind}
                  href={primaryCta.href}
                  disabled={primaryCta.disabled}
                  lobbyStatus={lobbyStatus}
                  cycleId={data.cycleId}
                />
                <Link
                  href="/market-pulse/leaderboard"
                  className={mergeMpClasses(
                    "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 sm:w-auto",
                    MP_FOCUS_RING,
                  )}
                >
                  {t("mp.hub.lobby.secondary.leaderboard")}
                </Link>
                <Link
                  href="/market-pulse/rules"
                  className={mergeMpClasses(
                    "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-200 sm:w-auto",
                    MP_FOCUS_RING,
                  )}
                >
                  {t("mp.hub.lobby.secondary.rules")}
                </Link>
              </div>

              {!isAuthenticated && !isLoading && lobbyStatus === "open" ? (
                <p className="mt-3 text-sm text-zinc-500">
                  {t("mp.hub.cta.newHere")}{" "}
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent("/market-pulse/play")}`}
                    className="font-medium text-emerald-300 underline-offset-4 hover:underline"
                  >
                    {t("mp.hub.cta.createAccount")}
                  </Link>
                </p>
              ) : null}

              {playBlocked && isAuthenticated && !isLoading ? (
                <p className="mt-3 text-sm text-zinc-400">
                  {t("mp.play.preLaunch.signedIn")}
                </p>
              ) : null}
            </div>

            <div className="w-full shrink-0 lg:max-w-xs">
              <HubPrizeCallout prizeLabel={data.prizeLabel} />
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6 sm:mt-8">
          <HubPlayerJourneyStrip />
          <HubCycleStatusPanel
            data={data}
            locale={locale}
            lobbyStatus={lobbyStatus}
          />
          <HubLeaderboardPreview
            entries={data.leaderboardEntries}
            revealed={data.leaderboardRevealed}
          />
        </div>

        <MarketPulseInlineDisclaimer
          className="mt-6 sm:mt-8"
          surface="hub"
          cycleId={data.cycleId ?? undefined}
        />
      </main>
    </MarketPulseGlowBackground>
  );
}
