"use client";

import type {
  CycleReadinessCardStatus,
  CycleReadinessReport,
} from "@/lib/market-pulse/admin-cycle-readiness";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";

function overallStatusClass(status: CycleReadinessReport["overallStatus"]): string {
  return status === "ready"
    ? "bg-emerald-500/15 text-emerald-200"
    : "bg-amber-500/15 text-amber-200";
}

function cardStatusClass(status: CycleReadinessCardStatus): string {
  switch (status) {
    case "published":
      return "bg-sky-500/15 text-sky-200";
    case "ready":
      return "bg-emerald-500/15 text-emerald-200";
    case "conflict":
      return "bg-red-500/15 text-red-200";
    default:
      return "bg-amber-500/15 text-amber-200";
  }
}

function cardStatusKey(status: CycleReadinessCardStatus): MessageKey {
  switch (status) {
    case "published":
      return "auth.admin.mp.builder.readiness.cardPublished";
    case "ready":
      return "auth.admin.mp.builder.readiness.cardReady";
    case "conflict":
      return "auth.admin.mp.builder.readiness.cardConflict";
    default:
      return "auth.admin.mp.builder.readiness.cardDraftMissing";
  }
}

type Props = {
  report: CycleReadinessReport;
  onSelectCard?: (cardId: string) => void;
};

export default function MarketPulseCycleReadinessPanel({
  report,
  onSelectCard,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {t("auth.admin.mp.builder.readiness.title")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {t("auth.admin.mp.builder.readiness.help")}
          </p>
        </div>
        <span
          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${overallStatusClass(report.overallStatus)}`}
        >
          {report.overallStatus === "ready"
            ? t("auth.admin.mp.builder.readiness.statusReady")
            : t("auth.admin.mp.builder.readiness.statusNeedsAttention")}
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        {translateWith(locale, "auth.admin.mp.builder.readiness.issueCount", {
          count: report.issueCount,
        })}
      </p>

      {report.cycleIssues.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.readiness.cycleGroup")}
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
            {report.cycleIssues.map((issue) => (
              <li key={`${issue.code}-${issue.message}`} className="flex gap-2">
                <span className="text-zinc-600" aria-hidden>
                  •
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.cardIssues.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.readiness.cardsGroup")}
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
            {report.cardIssues.map((issue, index) => (
              <li
                key={`${issue.cardId ?? "card"}-${issue.message}-${index}`}
                className="flex gap-2"
              >
                <span className="text-zinc-600" aria-hidden>
                  •
                </span>
                <span>
                  {issue.dayIndex != null
                    ? translateWith(locale, "auth.admin.mp.builder.readiness.cardIssue", {
                        day: issue.dayIndex,
                        message: issue.message,
                      })
                    : issue.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.cards.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.readiness.cardRowsTitle")}
          </h4>
          <table className="mt-2 w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2 font-medium">{t("auth.admin.mp.builder.colDay")}</th>
                <th className="px-2 py-2 font-medium">{t("auth.admin.mp.builder.colHeadline")}</th>
                <th className="px-2 py-2 font-medium">
                  {t("auth.admin.mp.builder.readiness.colReadiness")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {report.cards.map((row) => (
                <tr key={row.cardId} className="hover:bg-zinc-900/40">
                  <td className="px-2 py-2 whitespace-nowrap text-zinc-300">
                    {translateWith(locale, "auth.admin.mp.cards.dayLabel", {
                      day: row.dayIndex,
                    })}
                  </td>
                  <td className="max-w-[220px] truncate px-2 py-2 text-zinc-200">
                    {onSelectCard ? (
                      <button
                        type="button"
                        className="truncate text-left text-emerald-400 underline-offset-4 hover:underline"
                        onClick={() => onSelectCard(row.cardId)}
                      >
                        {row.headline}
                      </button>
                    ) : (
                      row.headline
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${cardStatusClass(row.status)}`}
                    >
                      {t(cardStatusKey(row.status))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
