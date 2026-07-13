"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { invokeAdminAction, type AdminActionResult } from "@/lib/admin/action-result";
import { launchGuidedMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";
import {
  ADMIN_MARKET_PULSE_PATH,
  marketPulseGuidedCardsPath,
  MARKET_PULSE_PUBLIC_PATHS,
} from "@/lib/market-pulse/admin-mp-navigation";
import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";
import type { GuidedCardStatus } from "@/lib/market-pulse/guided-card-status";
import type { GuidedCycleLaunchPageData } from "@/lib/market-pulse/guided-cycle-launch-page-data";
import type { GuidedLaunchPreviewCardRow } from "@/lib/market-pulse/guided-launch-preview";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const primaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const secondaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`;

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

function formatSignalIdentity(row: GuidedLaunchPreviewCardRow): string {
  if (row.cardType !== "SIGNAL") {
    return "—";
  }

  const company = row.companyName?.trim() || "—";
  const ticker = row.ticker?.trim() || "—";
  return `${company} (${ticker})`;
}

type Props = {
  initialData: GuidedCycleLaunchPageData;
};

export default function MarketPulseGuidedLaunchClient({ initialData }: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isLaunching, setIsLaunching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { preview } = data;
  const canLaunch = preview.launchAllowed && !data.alreadyLaunched;
  const launchDisabled = !canLaunch || isLaunching;

  const handleLaunch = async () => {
    setIsLaunching(true);
    setMessage(null);
    setError(null);

    const succeeded = await invokeAdminAction(
      (() =>
        launchGuidedMarketPulseCycleAction(data.cycle.id)) as () => Promise<AdminActionResult>,
      {
        onSuccess: (successMessage, _warning, success) => {
          const launchData = success?.data as
            | { alreadyLaunched?: boolean; publishedCount?: number }
            | undefined;
          if (launchData?.alreadyLaunched) {
            setData((current) => ({ ...current, alreadyLaunched: true }));
            setMessage(t("auth.admin.mp.guidedLaunch.alreadyLaunched"));
          } else {
            const publishedCount = launchData?.publishedCount;
            setMessage(
              publishedCount != null
                ? translateWith(
                    locale,
                    "auth.admin.mp.guidedLaunch.postLaunch.launchCompleted",
                    { count: String(publishedCount) },
                  )
                : successMessage,
            );
            setData((current) => ({ ...current, alreadyLaunched: true }));
          }
          setConfirmOpen(false);
          router.refresh();
        },
        onError: (actionError) => {
          setError(actionError);
        },
      },
    );

    if (!succeeded) {
      setError((current) => current ?? t("auth.admin.mp.guidedLaunch.launchFailed"));
    }

    setIsLaunching(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedLaunch.summary.title")}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.name")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{data.cycle.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.summary.cycleStatus")}
            </dt>
            <dd className="mt-1 text-zinc-200">{data.cycle.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.summary.runtimeStatus")}
            </dt>
            <dd className="mt-1 text-zinc-200">{data.runtimeStatus}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.summary.activeCycle")}
            </dt>
            <dd className="mt-1 text-zinc-200">
              {data.isActiveCycle
                ? t("auth.admin.mp.guidedLaunch.summary.activeYes")
                : t("auth.admin.mp.guidedLaunch.summary.activeNo")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.startDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{data.startDateHkt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.endDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{data.endDateHkt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.revealDate")}
            </dt>
            <dd className="mt-1 text-zinc-200">{data.revealDateHkt}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedLaunch.preview.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {t("auth.admin.mp.guidedLaunch.preview.help")}
        </p>

        {data.alreadyLaunched ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
            <h3 className="text-sm font-semibold text-emerald-100">
              {t("auth.admin.mp.guidedLaunch.postLaunch.title")}
            </h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-emerald-200/70">
                  {t("auth.admin.mp.guidedLaunch.preview.cycleStatus")}
                </dt>
                <dd className="mt-1 font-medium text-emerald-50">{data.cycle.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-emerald-200/70">
                  {t("auth.admin.mp.guidedLaunch.postLaunch.activePin")}
                </dt>
                <dd className="mt-1 font-medium text-emerald-50">
                  {data.isActiveCycle
                    ? t("auth.admin.mp.guidedLaunch.summary.activeYes")
                    : t("auth.admin.mp.guidedLaunch.summary.activeNo")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-emerald-200/70">
                  {t("auth.admin.mp.guidedLaunch.summary.runtimeStatus")}
                </dt>
                <dd className="mt-1 font-medium text-emerald-50">{data.runtimeStatus}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-emerald-200/70">
                  {t("auth.admin.mp.guidedLaunch.postLaunch.publishedTotal")}
                </dt>
                <dd className="mt-1 font-medium text-emerald-50">
                  {translateWith(locale, "auth.admin.mp.guidedLaunch.postLaunch.publishedTotalValue", {
                    published: String(preview.publishedCount),
                    total: String(preview.totalCards),
                  })}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={MARKET_PULSE_PUBLIC_PATHS.play} className={secondaryButtonClass}>
                {t("auth.admin.mp.guidedLaunch.postLaunch.openPlay")}
              </Link>
              <Link href={ADMIN_MARKET_PULSE_PATH} className={secondaryButtonClass}>
                {t("auth.admin.mp.guidedLaunch.postLaunch.returnToHub")}
              </Link>
              <Link
                href={marketPulseCycleBuilderPath(data.cycle.id)}
                className={secondaryButtonClass}
              >
                {t("auth.admin.mp.guidedLaunch.postLaunch.openBuilder")}
              </Link>
            </div>
          </div>
        ) : null}

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.cycleStatus")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.cycleStatus}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.totalCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.totalCards}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.signalCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.signalCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.restCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.restCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.readyCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.readyCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.publishedCards")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.publishedCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.missingContent")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.missingContentCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.missingPpa")}
            </dt>
            <dd className="mt-1 text-zinc-200">{preview.missingPpaCount}</dd>
          </div>
        </dl>

        {data.alreadyLaunched ? null : (
          <>
            {!canLaunch && preview.blockingReasons.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-medium text-amber-100">
                  {t("auth.admin.mp.guidedLaunch.preview.blockingReasons")}
                </p>
                <p className="mt-2 text-sm text-amber-100/90">
                  {t("auth.admin.mp.guidedLaunch.preview.launchBlockedHelp")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                  {preview.blockingReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {canLaunch ? (
              <p className="mt-4 text-sm text-zinc-400">
                {t("auth.admin.mp.guidedLaunch.preview.serverRecheckHelp")}
              </p>
            ) : null}
          </>
        )}

        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        {!data.alreadyLaunched ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={launchDisabled}
              onClick={() => setConfirmOpen(true)}
            >
              {isLaunching
                ? t("auth.admin.mp.guidedLaunch.launching")
                : t("auth.admin.mp.guidedLaunch.preview.reviewLaunchSummary")}
            </button>
            <Link href={marketPulseGuidedCardsPath(data.cycle.id)} className={secondaryButtonClass}>
              {t("auth.admin.mp.guidedLaunch.editCards")}
            </Link>
            <Link href={MARKET_PULSE_PUBLIC_PATHS.play} className={secondaryButtonClass}>
              {t("auth.admin.mp.guidedLaunch.openPlay")}
            </Link>
          </div>
        ) : null}

        {preview.cardRows.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
            {t("auth.admin.mp.guidedCards.checklist.empty")}
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedCards.checklist.colType")}</th>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedLaunch.preview.colHeadline")}</th>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedLaunch.preview.colCompanyTicker")}</th>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedCards.checklist.colStatus")}</th>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedLaunch.preview.ppaApproved")}</th>
                  <th className="px-3 py-2">{t("auth.admin.mp.guidedLaunch.preview.published")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {preview.cardRows.map((card) => {
                  const statusKey =
                    `auth.admin.mp.guidedCards.status.${card.status}` as const;

                  return (
                    <tr key={card.id} className="hover:bg-zinc-900/40">
                      <td className="px-3 py-2 text-zinc-300">
                        {card.cardType === "SIGNAL"
                          ? t("auth.admin.mp.guidedCards.editor.signalTitle")
                          : t("auth.admin.mp.guidedCards.editor.restTitle")}
                      </td>
                      <td className="px-3 py-2 text-zinc-200">{card.headline || "—"}</td>
                      <td className="px-3 py-2 text-zinc-400">{formatSignalIdentity(card)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(card.status)}`}
                        >
                          {t(statusKey)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-300">
                        {card.isPpaApproved === null
                          ? "—"
                          : card.isPpaApproved
                            ? t("auth.admin.mp.guidedLaunch.preview.yes")
                            : t("auth.admin.mp.guidedLaunch.preview.no")}
                      </td>
                      <td className="px-3 py-2 text-zinc-300">
                        {card.isPublished
                          ? t("auth.admin.mp.guidedLaunch.preview.yes")
                          : t("auth.admin.mp.guidedLaunch.preview.no")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminConfirmDialog
        open={confirmOpen && !data.alreadyLaunched}
        title={t("auth.admin.mp.guidedLaunch.preview.confirmTitle")}
        description={
          <div className="space-y-3">
            <p>
              {translateWith(locale, "auth.admin.mp.guidedLaunch.preview.confirmCycle", {
                name: data.cycle.name,
                id: data.cycle.id,
              })}
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">{t("auth.admin.mp.guidedLaunch.preview.totalCards")}</dt>
                <dd className="font-medium text-zinc-200">{preview.totalCards}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{t("auth.admin.mp.guidedLaunch.preview.signalCards")}</dt>
                <dd className="font-medium text-zinc-200">{preview.signalCount}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{t("auth.admin.mp.guidedLaunch.preview.restCards")}</dt>
                <dd className="font-medium text-zinc-200">{preview.restCount}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{t("auth.admin.mp.guidedLaunch.preview.readyCards")}</dt>
                <dd className="font-medium text-zinc-200">{preview.readyCount}</dd>
              </div>
            </dl>
            <p>{t("auth.admin.mp.guidedLaunch.preview.confirmLaunchEffect")}</p>
            <p className="text-xs text-zinc-500">
              {t("auth.admin.mp.guidedLaunch.preview.serverRecheckHelp")}
            </p>
          </div>
        }
        confirmLabel={t("auth.admin.mp.guidedLaunch.preview.confirmLaunch")}
        cancelLabel={t("auth.admin.users.cancel")}
        pendingLabel={t("auth.admin.mp.guidedLaunch.launching")}
        isPending={isLaunching}
        onConfirm={handleLaunch}
        onCancel={() => {
          if (!isLaunching) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}
