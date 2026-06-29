"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Lock, LogIn, UserRound } from "lucide-react";

import type { LeaderboardViewerScorePanel } from "@/lib/market-pulse/leaderboard-viewer-score";
import type { LeaderboardViewerCardBreakdown } from "@/lib/market-pulse/leaderboard-score-breakdown";
import {
  formatSignal,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import { useTranslations } from "@/components/providers/LocaleProvider";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

function formatPoints(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function StatItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-white sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function PanelShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { t } = useTranslations();

  return (
    <section
      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-zinc-900/40 p-4 sm:p-5"
      aria-labelledby="leaderboard-my-score-heading"
    >
      <h2
        id="leaderboard-my-score-heading"
        className="mb-3 flex items-center gap-2 text-base font-semibold text-white sm:text-lg"
      >
        <UserRound className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        {t("mp.leaderboard.myScore.title")}
      </h2>
      {children}
    </section>
  );
}

function MessageBody({
  message,
  action,
}: Readonly<{
  message: string;
  action?: ReactNode;
}>) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300 sm:text-base">{message}</p>
      {action}
    </div>
  );
}

function formatDecisionLabel(value: string): string {
  if (value === "BULLISH" || value === "CAUTIOUS") {
    return formatSignal(value as MarketPulseDecision);
  }
  return value;
}

function ScoreBreakdown({
  cards,
}: Readonly<{ cards: LeaderboardViewerCardBreakdown[] }>) {
  const { t } = useTranslations();

  if (cards.length === 0) {
    return null;
  }

  return (
    <details className="group mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-zinc-200 marker:content-none sm:px-4 [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        <span>{t("mp.leaderboard.myScore.breakdownToggle")}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="space-y-2 border-t border-zinc-800/80 px-3 py-3 sm:px-4">
        {cards.map((card) => (
          <li
            key={card.cardId}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">
                  {t("mp.leaderboard.myScore.breakdownDay").replace(
                    "{day}",
                    String(card.dayIndex + 1),
                  )}
                  <span className="ml-2 text-zinc-500">{card.ticker}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-200">
                  {card.headline}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-300">
                {t("mp.leaderboard.myScore.breakdownCardTotal").replace(
                  "{points}",
                  formatPoints(card.totalPoints),
                )}
              </p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t("mp.leaderboard.myScore.breakdownYourCall")}
                </p>
                <p className="font-medium text-zinc-200">
                  {formatDecisionLabel(card.userDecision)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t("mp.leaderboard.myScore.breakdownPpa")}
                </p>
                <p className="font-medium text-zinc-200">
                  {card.ppaSignal
                    ? formatDecisionLabel(card.ppaSignal)
                    : "—"}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t("mp.reveal.card.match")}
                </p>
                <p
                  className={`font-medium ${
                    card.isMatch ? "text-emerald-400" : "text-zinc-400"
                  }`}
                >
                  {card.isMatch
                    ? t("mp.leaderboard.myScore.breakdownMatch")
                    : t("mp.leaderboard.myScore.breakdownNoMatch")}
                </p>
              </div>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <li>
                {t("mp.leaderboard.myScore.breakdownParticipation").replace(
                  "{points}",
                  String(card.participationPoints),
                )}
              </li>
              {card.matchBonus > 0 ? (
                <li className="text-emerald-400/90">
                  {t("mp.leaderboard.myScore.breakdownMatchBonus").replace(
                    "{points}",
                    String(card.matchBonus),
                  )}
                </li>
              ) : null}
              {card.streakBonus > 0 ? (
                <li className="text-emerald-400/90">
                  {t("mp.leaderboard.myScore.breakdownStreakBonus").replace(
                    "{points}",
                    String(card.streakBonus),
                  )}
                </li>
              ) : null}
            </ul>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function MarketPulseLeaderboardMyScore({
  panel,
  cycleId,
}: Readonly<{
  panel: LeaderboardViewerScorePanel;
  cycleId?: string;
}>) {
  const { t } = useTranslations();

  const loginHref = cycleId
    ? `/login?callbackUrl=${encodeURIComponent(`/market-pulse/leaderboard?cycleId=${cycleId}`)}`
    : `/login?callbackUrl=${encodeURIComponent("/market-pulse/leaderboard")}`;

  if (panel.state === "no_cycle") {
    return null;
  }

  if (panel.state === "logged_out") {
    return (
      <PanelShell>
        <MessageBody
          message={t("mp.leaderboard.myScore.loggedOut")}
          action={
            <Link
              href={loginHref}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-400 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t("mp.play.preLaunch.signIn")}
            </Link>
          }
        />
      </PanelShell>
    );
  }

  if (panel.state === "locked_participating") {
    return (
      <PanelShell>
        <p className="mb-1 text-xs font-medium text-zinc-400 sm:text-sm">
          {panel.cycleName}
        </p>
        <MessageBody
          message={t("mp.leaderboard.myScore.lockedParticipating")}
          action={
            <p className="inline-flex items-center gap-1.5 text-xs text-amber-200/90 sm:text-sm">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("mp.leaderboard.myScore.lockedHint")}
            </p>
          }
        />
      </PanelShell>
    );
  }

  if (panel.state === "locked_no_participation") {
    return (
      <PanelShell>
        <p className="mb-1 text-xs font-medium text-zinc-400 sm:text-sm">
          {panel.cycleName}
        </p>
        <MessageBody message={t("mp.leaderboard.myScore.noParticipation")} />
      </PanelShell>
    );
  }

  if (panel.state === "revealed_no_score") {
    return (
      <PanelShell>
        <p className="mb-3 text-xs font-medium text-zinc-400 sm:text-sm">
          {panel.cycleName}
        </p>
        <MessageBody message={t("mp.leaderboard.myScore.noScore")} />
        {panel.decisionsSubmitted > 0 ? (
          <p className="mt-3 text-sm text-zinc-400">
            {t("mp.leaderboard.myScore.decisionsProgress")
              .replace("{submitted}", String(panel.decisionsSubmitted))
              .replace("{total}", String(panel.totalCards))}
          </p>
        ) : null}
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <p className="mb-3 text-xs font-medium text-zinc-400 sm:text-sm">
        {panel.cycleName}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatItem
          label={t("mp.leaderboard.myScore.total")}
          value={formatPoints(panel.totalScore)}
        />
        <StatItem
          label={t("mp.leaderboard.myScore.rank")}
          value={panel.rank != null ? `#${panel.rank}` : "—"}
        />
        <StatItem
          label={t("mp.leaderboard.myScore.participation")}
          value={
            panel.participationScore != null
              ? formatPoints(panel.participationScore)
              : t("mp.leaderboard.myScore.notAvailable")
          }
        />
        <StatItem
          label={t("mp.leaderboard.myScore.decisions")}
          value={`${panel.decisionsSubmitted}/${panel.totalCards}`}
        />
      </div>
      <ScoreBreakdown cards={panel.breakdown} />
    </PanelShell>
  );
}
