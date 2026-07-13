"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import MarketPulseGuidedCardEditor from "@/components/admin/MarketPulseGuidedCardEditor";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import type { GuidedCardStatus } from "@/lib/market-pulse/guided-card-status";
import { getGuidedCardStatus } from "@/lib/market-pulse/guided-card-status";
import { marketPulseGuidedLaunchPath } from "@/lib/market-pulse/admin-mp-navigation";
import { canShowGuidedLaunchHubLink } from "@/lib/market-pulse/guided-launch-readiness";
import type { GuidedCycleCardsPageData } from "@/lib/market-pulse/guided-cycle-cards-page-data";
import {
  filterGuidedCycleCardDashboardRows,
  getGuidedCardDashboard,
  type GuidedCardDashboardFilter,
  type GuidedCardDashboardFocusReason,
  type GuidedCardDashboardRow,
} from "@/lib/market-pulse/guided-card-dashboard";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const linkButtonClass = `inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`;

const filterChipClass = `inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${focusRing}`;

const DASHBOARD_FILTERS: GuidedCardDashboardFilter[] = [
  "all",
  "missing_content",
  "missing_ppa",
  "ready",
  "published",
  "signal",
  "rest",
];

const FILTER_LABEL_KEYS: Record<GuidedCardDashboardFilter, MessageKey> = {
  all: "auth.admin.mp.guidedCards.dashboard.filter.all",
  missing_content: "auth.admin.mp.guidedCards.dashboard.filter.missingContent",
  missing_ppa: "auth.admin.mp.guidedCards.dashboard.filter.missingPpa",
  ready: "auth.admin.mp.guidedCards.dashboard.filter.ready",
  published: "auth.admin.mp.guidedCards.dashboard.filter.published",
  signal: "auth.admin.mp.guidedCards.dashboard.filter.signal",
  rest: "auth.admin.mp.guidedCards.dashboard.filter.rest",
};

const FOCUS_REASON_KEYS: Record<GuidedCardDashboardFocusReason, MessageKey> = {
  missing_ppa: "auth.admin.mp.guidedCards.dashboard.focusReason.missingPpa",
  missing_content: "auth.admin.mp.guidedCards.dashboard.focusReason.missingContent",
  save_blocking: "auth.admin.mp.guidedCards.dashboard.focusReason.saveBlocking",
  unpublished_ready: "auth.admin.mp.guidedCards.dashboard.focusReason.unpublishedReady",
};

function statusClass(status: GuidedCardStatus): string {
  switch (status) {
    case "published":
      return "bg-sky-500/15 text-sky-200";
    case "ready":
      return "bg-emerald-500/15 text-emerald-200";
    case "missing_ppa":
      return "bg-amber-500/15 text-amber-200";
    default:
      return "bg-zinc-500/15 text-zinc-300";
  }
}

function filterChipStateClass(active: boolean): string {
  return active
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
}

function ReadinessBadges({
  row,
}: Readonly<{
  row: GuidedCardDashboardRow;
}>) {
  const { t, locale } = useTranslations();

  return (
    <div className="flex flex-wrap gap-1">
      {row.isPublished ? (
        <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-200">
          {t("auth.admin.mp.guidedCards.dashboard.badge.published")}
        </span>
      ) : null}
      {row.missingContentCount > 0 ? (
        <span className="rounded bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-300">
          {translateWith(
            locale,
            "auth.admin.mp.guidedCards.dashboard.badge.missingContentCount",
            { count: String(row.missingContentCount) },
          )}
        </span>
      ) : null}
      {row.cardType === "SIGNAL" && row.missingPpaCount > 0 ? (
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
          {t("auth.admin.mp.guidedCards.dashboard.badge.missingPpa")}
        </span>
      ) : null}
      {row.isSaveBlocking ? (
        <span className="rounded bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-200">
          {t("auth.admin.mp.guidedCards.dashboard.badge.saveBlocking")}
        </span>
      ) : null}
    </div>
  );
}

type Props = {
  initialData: GuidedCycleCardsPageData;
};

export default function MarketPulseGuidedCardsClient({ initialData }: Props) {
  const { t, locale } = useTranslations();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    initialData.checklist[0]?.id ?? null,
  );
  const [cards, setCards] = useState(initialData.cards);
  const [activeFilter, setActiveFilter] = useState<GuidedCardDashboardFilter>("all");

  const dashboard = useMemo(() => getGuidedCardDashboard(cards), [cards]);

  const dashboardRowById = useMemo(
    () => new Map(dashboard.cardRows.map((row) => [row.id, row])),
    [dashboard.cardRows],
  );

  const filteredDashboardRows = useMemo(
    () => filterGuidedCycleCardDashboardRows(dashboard.cardRows, activeFilter),
    [dashboard.cardRows, activeFilter],
  );

  const visibleRowIds = useMemo(
    () => new Set(filteredDashboardRows.map((row) => row.id)),
    [filteredDashboardRows],
  );

  const checklist = useMemo(() => {
    return initialData.checklist
      .map((row) => {
        const card = cards.find((item) => item.id === row.id);
        if (!card) {
          return row;
        }

        return {
          ...row,
          headline: card.headline,
          status: getGuidedCardStatus(card),
          isPublished: card.status === "PUBLISHED",
        };
      })
      .filter((row) => visibleRowIds.has(row.id));
  }, [cards, initialData.checklist, visibleRowIds]);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const handleCardUpdated = (updated: MarketPulseAdminCardRow) => {
    setCards((current) =>
      current.map((card) => (card.id === updated.id ? updated : card)),
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedCards.summary.title")}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.name")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{initialData.cycle.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.startDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{initialData.startDateHkt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.endDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{initialData.endDateHkt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.revealDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{initialData.revealDateHkt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.success.signalCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{initialData.signalCardCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.success.restCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{initialData.restCardCount}</dd>
          </div>
        </dl>
        {canShowGuidedLaunchHubLink(initialData.cycle.status) ? (
          <div className="mt-4">
            <Link
              href={marketPulseGuidedLaunchPath(initialData.cycle.id)}
              className={linkButtonClass}
            >
              {t("auth.admin.mp.guidedLaunch.entryButton")}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedCards.dashboard.title")}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.totalCards")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{dashboard.totalCards}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.signalRest")}
            </dt>
            <dd className="mt-1 text-zinc-200">
              {translateWith(locale, "auth.admin.mp.guidedCards.dashboard.signalRestValue", {
                signal: String(dashboard.signalCount),
                rest: String(dashboard.restCount),
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.ready")}
            </dt>
            <dd className="mt-1 text-zinc-200">{dashboard.readyCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.published")}
            </dt>
            <dd className="mt-1 text-zinc-200">{dashboard.publishedCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.missingContent")}
            </dt>
            <dd className="mt-1 text-zinc-200">{dashboard.missingContentCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.missingPpa")}
            </dt>
            <dd className="mt-1 text-zinc-200">{dashboard.missingPpaCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCards.dashboard.saveBlocking")}
            </dt>
            <dd className="mt-1 text-zinc-200">{dashboard.saveBlockingCount}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.guidedCards.dashboard.nextFocus")}
          </p>
          {dashboard.nextSuggestedFocus ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-zinc-200">
                {t(FOCUS_REASON_KEYS[dashboard.nextSuggestedFocus.reason])}
              </p>
              <button
                type="button"
                className={linkButtonClass}
                onClick={() => setSelectedCardId(dashboard.nextSuggestedFocus!.cardId)}
              >
                {t("auth.admin.mp.guidedCards.dashboard.focusButton")}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              {t("auth.admin.mp.guidedCards.dashboard.noFocus")}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-50">
            {t("auth.admin.mp.guidedCards.checklist.title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t("auth.admin.mp.guidedCards.checklist.help")}
          </p>

          {dashboard.totalCards > 0 ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`${filterChipClass} ${filterChipStateClass(activeFilter === filter)}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {t(FILTER_LABEL_KEYS[filter])}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                {translateWith(locale, "auth.admin.mp.guidedCards.dashboard.filteredCount", {
                  shown: String(filteredDashboardRows.length),
                  total: String(dashboard.totalCards),
                })}
              </p>
            </div>
          ) : null}

          {checklist.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
              {dashboard.totalCards === 0
                ? t("auth.admin.mp.guidedCards.checklist.empty")
                : t("auth.admin.mp.guidedCards.dashboard.filterEmpty")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">
                      {t("auth.admin.mp.guidedCards.checklist.colDay")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("auth.admin.mp.guidedCards.checklist.colDate")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("auth.admin.mp.guidedCards.checklist.colCard")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("auth.admin.mp.guidedCards.checklist.colType")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("auth.admin.mp.guidedCards.checklist.colStatus")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {checklist.map((row) => {
                    const selected = row.id === selectedCardId;
                    const statusKey = `auth.admin.mp.guidedCards.status.${row.status}` as const;
                    const dashboardRow = dashboardRowById.get(row.id);

                    return (
                      <tr key={row.id}>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            className={`w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-800/80 ${selected ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : ""} ${focusRing}`}
                            onClick={() => setSelectedCardId(row.id)}
                          >
                            <span className="font-medium text-zinc-100">{row.dayIndex}</span>
                            <span className="mt-1 block truncate text-xs text-zinc-500">
                              {row.headline}
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-400">{row.hktDate ?? "—"}</td>
                        <td className="px-3 py-2.5 text-zinc-300">
                          {row.cardNumber ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-300">{row.cardTypeLabel}</td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                            >
                              {t(statusKey)}
                            </span>
                            {dashboardRow ? <ReadinessBadges row={dashboardRow} /> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          {selectedCard ? (
            <MarketPulseGuidedCardEditor
              key={selectedCard.id}
              card={selectedCard}
              onCardUpdated={handleCardUpdated}
            />
          ) : (
            <p className="text-sm text-zinc-500">
              {t("auth.admin.mp.guidedCards.editor.selectCard")}
            </p>
          )}
        </section>
      </div>

      {canShowGuidedLaunchHubLink(initialData.cycle.status) ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={marketPulseGuidedLaunchPath(initialData.cycle.id)}
            className={linkButtonClass}
          >
            {t("auth.admin.mp.guidedLaunch.entryButton")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
