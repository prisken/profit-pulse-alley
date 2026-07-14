"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  ADMIN_MARKET_PULSE_GUIDED_CYCLE_PATH,
  MARKET_PULSE_PUBLIC_PATHS,
  marketPulseCycleBuilderPath,
  marketPulseGuidedCardsPath,
  marketPulseGuidedLaunchPath,
} from "@/lib/market-pulse/admin-mp-navigation";
import type { MarketPulseAdminDashboardData } from "@/lib/market-pulse/admin-data";
import {
  findContinueWorkflowTarget,
  getHubCycleActionLinks,
  getMarketPulseCycleNextAction,
  groupCardsByCycleId,
  type MarketPulseCycleNextAction,
  type MarketPulseCycleNextActionEmphasis,
} from "@/lib/market-pulse/admin-cycle-next-action";
import type {
  GuidedCardDashboardFocusReason,
  GuidedHubProgressSummary,
} from "@/lib/market-pulse/guided-card-dashboard";
import { evaluateRevealReadiness } from "@/lib/market-pulse/admin-reveal-status";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";
import RemoveMarketPulseCycleButton from "@/components/admin/RemoveMarketPulseCycleButton";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

const primaryButtonClass = `inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt).toLocaleDateString(undefined, { dateStyle: "medium" });
  const end = new Date(endsAt).toLocaleDateString(undefined, { dateStyle: "medium" });
  return `${start} – ${end}`;
}

function cycleStatusClass(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-500/15 text-emerald-200";
    case "REVEALED":
      return "bg-sky-500/15 text-sky-200";
    case "CLOSED":
      return "bg-amber-500/15 text-amber-200";
    default:
      return "bg-zinc-500/15 text-zinc-300";
  }
}

function nextActionBadgeClass(emphasis: MarketPulseCycleNextActionEmphasis): string {
  switch (emphasis) {
    case "primary":
      return "bg-emerald-500/15 text-emerald-200";
    case "secondary":
      return "bg-zinc-500/15 text-zinc-300";
    default:
      return "bg-zinc-700/40 text-zinc-400";
  }
}

function actionButtonClass(emphasis: MarketPulseCycleNextActionEmphasis): string {
  return emphasis === "primary" ? primaryButtonClass : buttonClass;
}

const HUB_FOCUS_REASON_KEYS: Record<GuidedCardDashboardFocusReason, MessageKey> = {
  missing_ppa: "auth.admin.mp.guidedCards.dashboard.focusReason.missingPpa",
  missing_content: "auth.admin.mp.guidedCards.dashboard.focusReason.missingContent",
  save_blocking: "auth.admin.mp.guidedCards.dashboard.focusReason.saveBlocking",
  unpublished_ready: "auth.admin.mp.guidedCards.dashboard.focusReason.unpublishedReady",
};

function GuidedHubProgressSummaryBlock({
  progress,
}: Readonly<{ progress: GuidedHubProgressSummary }>) {
  const { t, locale } = useTranslations();

  return (
    <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {t("auth.admin.mp.hub.guidedProgress.title")}
      </p>
      <dl className="mt-1.5 space-y-0.5 text-xs text-zinc-400">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            {translateWith(locale, "auth.admin.mp.hub.guidedProgress.readyTotal", {
              ready: String(progress.readyCount),
              total: String(progress.totalCards),
            })}
          </span>
          <span>
            {t("auth.admin.mp.hub.guidedProgress.published")}: {progress.publishedCount}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            {t("auth.admin.mp.hub.guidedProgress.missingContent")}:{" "}
            {progress.missingContentCount}
          </span>
          <span>
            {t("auth.admin.mp.hub.guidedProgress.missingPpa")}: {progress.missingPpaCount}
          </span>
          <span>
            {t("auth.admin.mp.hub.guidedProgress.saveBlocking")}: {progress.saveBlockingCount}
          </span>
        </div>
        {progress.nextSuggestedFocusReason ? (
          <div className="pt-0.5 text-zinc-500">
            {t("auth.admin.mp.guidedCards.dashboard.nextFocus")}:{" "}
            {t(HUB_FOCUS_REASON_KEYS[progress.nextSuggestedFocusReason])}
          </div>
        ) : null}
      </dl>
    </div>
  );
}

type Props = {
  cycles: MarketPulseAdminDashboardData["cycles"];
  cards: MarketPulseAdminDashboardData["cards"];
  activeCycleId: string | null;
  runtimeStatus: MarketPulseGameRuntimeStatus;
  disabled?: boolean;
  onQuickCreateNextCycle: () => void;
  onEditCycle: (cycleId: string) => void;
  onScrollToReveal: () => void;
  onRefresh?: () => void;
};

function CycleNextActionSection({
  nextAction,
  cycleId,
  cycleStatus,
}: {
  nextAction: MarketPulseCycleNextAction;
  cycleId: string;
  cycleStatus: MarketPulseAdminDashboardData["cycles"][number]["status"];
}) {
  const { t } = useTranslations();
  const links = getHubCycleActionLinks(nextAction, cycleId, cycleStatus);

  return (
    <div className="space-y-2">
      <div>
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${nextActionBadgeClass(nextAction.emphasis)}`}
        >
          {t(nextAction.labelKey)}
        </span>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          {t(nextAction.descriptionKey)}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {links.primaryHref && links.primaryLabelKey ? (
          <Link
            href={links.primaryHref}
            className={actionButtonClass(links.primaryEmphasis ?? nextAction.emphasis)}
          >
            {t(links.primaryLabelKey)}
          </Link>
        ) : null}
        {links.secondaryLinks.map((link) => (
          <Link key={link.href} href={link.href} className={buttonClass}>
            {t(link.labelKey)}
          </Link>
        ))}
        {links.showFillGuidedCards ? (
          <Link href={marketPulseGuidedCardsPath(cycleId)} className={buttonClass}>
            {t("auth.admin.mp.guidedCards.entryButton")}
          </Link>
        ) : null}
        {links.showReviewAndLaunch ? (
          <Link href={marketPulseGuidedLaunchPath(cycleId)} className={buttonClass}>
            {t("auth.admin.mp.guidedLaunch.entryButton")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function MarketPulseCyclesHub({
  cycles,
  cards,
  activeCycleId,
  runtimeStatus,
  disabled = false,
  onQuickCreateNextCycle,
  onEditCycle,
  onScrollToReveal,
  onRefresh,
}: Readonly<Props>) {
  const { t } = useTranslations();

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  const cardsByCycleId = useMemo(() => groupCardsByCycleId(cards), [cards]);

  const continueWorkflow = useMemo(
    () =>
      findContinueWorkflowTarget({
        cycles: sortedCycles,
        cardsByCycleId,
        activeCycleId,
        runtimeStatus,
      }),
    [sortedCycles, cardsByCycleId, activeCycleId, runtimeStatus],
  );

  return (
    <section id="cycles-hub" className="scroll-mt-36 space-y-4 lg:scroll-mt-44">
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-zinc-950 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">
          {t("auth.admin.mp.hub.workflow.title")}
        </p>
        <ol className="mt-3 space-y-1 text-sm text-zinc-300">
          <li>{t("auth.admin.mp.hub.workflow.step1")}</li>
          <li>{t("auth.admin.mp.hub.workflow.step2")}</li>
          <li>{t("auth.admin.mp.hub.workflow.step3")}</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={ADMIN_MARKET_PULSE_GUIDED_CYCLE_PATH} className={primaryButtonClass}>
            {t("auth.admin.mp.guidedCycle.entryButton")}
          </Link>
          {continueWorkflow ? (
            <Link href={continueWorkflow.href} className={buttonClass}>
              {t("auth.admin.mp.hub.workflow.continue")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {t("auth.admin.mp.nav.fastBuilder")}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{t("auth.admin.mp.nav.advancedHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={disabled}
            onClick={onQuickCreateNextCycle}
          >
            {t("auth.admin.mp.quickCreate.button")}
          </button>
          {sortedCycles[0] ? (
            <Link href={marketPulseCycleBuilderPath(sortedCycles[0].id)} className={buttonClass}>
              {t("auth.admin.mp.nav.openLatestBuilder")}
            </Link>
          ) : null}
        </div>
      </div>

      {sortedCycles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
          {t("auth.admin.mp.noCycles")}
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colCycle")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colDates")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colCards")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colStatus")}</th>
                  <th className="px-3 py-2.5 font-medium">
                    {t("auth.admin.mp.hub.nextAction.column")}
                  </th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedCycles.map((cycle) => {
                  const revealReadiness = evaluateRevealReadiness(cycle, cards);
                  const builderPath = marketPulseCycleBuilderPath(cycle.id);
                  const cycleCards = cardsByCycleId.get(cycle.id) ?? [];
                  const nextAction = getMarketPulseCycleNextAction({
                    cycleId: cycle.id,
                    cycleStatus: cycle.status,
                    cards: cycleCards,
                    activeCycleId,
                    runtimeStatus,
                  });

                  return (
                    <tr key={cycle.id} className="hover:bg-zinc-900/40">
                      <td className="px-3 py-3">
                        <div className="font-medium text-zinc-100">{cycle.name}</div>
                        {cycle.isActive ? (
                          <span className="mt-1 inline-block rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-200">
                            {t("auth.admin.mp.active")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-400">
                        {formatDateRange(cycle.startsAt, cycle.endsAt)}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{cycle.cardCount}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${cycleStatusClass(cycle.status)}`}
                        >
                          {cycle.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <CycleNextActionSection
                          nextAction={nextAction}
                          cycleId={cycle.id}
                          cycleStatus={cycle.status}
                        />
                        {cycle.guidedProgress ? (
                          <GuidedHubProgressSummaryBlock progress={cycle.guidedProgress} />
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => onEditCycle(cycle.id)}
                          >
                            {t("auth.admin.mp.nav.editCycle")}
                          </button>
                          <Link href={builderPath} className={buttonClass}>
                            {t("auth.admin.mp.nav.validateInBuilder")}
                          </Link>
                          {cycle.status === "REVEALED" ? (
                            <Link
                              href={MARKET_PULSE_PUBLIC_PATHS.reveal}
                              className={buttonClass}
                            >
                              {t("auth.admin.mp.nav.publicReveal")}
                            </Link>
                          ) : revealReadiness.canReveal ? (
                            <button
                              type="button"
                              className={buttonClass}
                              onClick={onScrollToReveal}
                            >
                              {t("auth.admin.mp.nav.revealScoring")}
                            </button>
                          ) : null}
                          <Link
                            href={MARKET_PULSE_PUBLIC_PATHS.leaderboard}
                            className={buttonClass}
                          >
                            {t("auth.admin.mp.nav.leaderboard")}
                          </Link>
                          <RemoveMarketPulseCycleButton
                            cycleId={cycle.id}
                            eligibility={{
                              status: cycle.status,
                              isActive: cycle.isActive,
                              decisionCount: cycle.decisionCount,
                              scoreCount: cycle.scoreCount,
                              scoreEventCount: cycle.scoreEventCount,
                              prizeClaimCount: cycle.prizeClaimCount,
                            }}
                            disabled={disabled}
                            onSuccess={onRefresh}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {sortedCycles.map((cycle) => {
              const revealReadiness = evaluateRevealReadiness(cycle, cards);
              const cycleCards = cardsByCycleId.get(cycle.id) ?? [];
              const nextAction = getMarketPulseCycleNextAction({
                cycleId: cycle.id,
                cycleStatus: cycle.status,
                cards: cycleCards,
                activeCycleId,
                runtimeStatus,
              });

              return (
                <li
                  key={cycle.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-100">{cycle.name}</p>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${cycleStatusClass(cycle.status)}`}
                    >
                      {cycle.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDateRange(cycle.startsAt, cycle.endsAt)} · {cycle.cardCount}{" "}
                    {t("auth.admin.mp.nav.cardsShort")}
                  </p>
                  <div className="mt-3">
                    <CycleNextActionSection
                      nextAction={nextAction}
                      cycleId={cycle.id}
                      cycleStatus={cycle.status}
                    />
                    {cycle.guidedProgress ? (
                      <GuidedHubProgressSummaryBlock progress={cycle.guidedProgress} />
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => onEditCycle(cycle.id)}
                    >
                      {t("auth.admin.mp.nav.editCycle")}
                    </button>
                    <Link href={MARKET_PULSE_PUBLIC_PATHS.leaderboard} className={buttonClass}>
                      {t("auth.admin.mp.nav.leaderboard")}
                    </Link>
                    {revealReadiness.canReveal ? (
                      <button type="button" className={buttonClass} onClick={onScrollToReveal}>
                        {t("auth.admin.mp.nav.revealScoring")}
                      </button>
                    ) : null}
                    <RemoveMarketPulseCycleButton
                      cycleId={cycle.id}
                      eligibility={{
                        status: cycle.status,
                        isActive: cycle.isActive,
                        decisionCount: cycle.decisionCount,
                        scoreCount: cycle.scoreCount,
                        scoreEventCount: cycle.scoreEventCount,
                        prizeClaimCount: cycle.prizeClaimCount,
                      }}
                      disabled={disabled}
                      onSuccess={onRefresh}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
