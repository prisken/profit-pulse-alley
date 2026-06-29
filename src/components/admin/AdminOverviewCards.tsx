"use client";

import Link from "next/link";

import type { AdminOverviewData } from "@/lib/market-pulse/admin-overview-data";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  overview: AdminOverviewData;
};

function statusPillClass(tone: "emerald" | "amber" | "red" | "zinc"): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "amber":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "red":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-zinc-700";
  }
}

function OverviewCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </article>
  );
}

export default function AdminOverviewCards({ overview }: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const { users, marketPulse, systemNotes } = overview;

  const userLine = translateWith(locale, "auth.admin.overview.userLine", {
    total: users.total,
    admins: users.adminCount,
  });

  const runtimeTone =
    marketPulse?.runtimeStatus === "OPEN"
      ? "emerald"
      : marketPulse?.runtimeStatus === "MAINTENANCE"
        ? "amber"
        : marketPulse
          ? "red"
          : "zinc";

  const playerTone = marketPulse?.playerVisible
    ? "emerald"
    : marketPulse
      ? "amber"
      : "zinc";

  const systemTone =
    systemNotes.length > 0 || marketPulse?.playerVisibilityReason
      ? "amber"
      : "emerald";

  return (
    <section aria-labelledby="admin-overview-heading">
      <h2 id="admin-overview-heading" className="sr-only">
        {t("auth.admin.overview.heading")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <OverviewCard label={t("auth.admin.overview.users")}>
          <p className="text-2xl font-semibold tabular-nums text-zinc-50">
            {users.total}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{userLine}</p>
        </OverviewCard>

        <OverviewCard label={t("auth.admin.overview.marketPulse")}>
          {marketPulse ? (
            <>
              <p className="line-clamp-2 text-sm font-semibold text-zinc-100">
                {marketPulse.activeCycle?.name ?? t("auth.admin.overview.noActiveCycle")}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(runtimeTone)}`}
              >
                {marketPulse.runtimeStatus}
              </span>
              {marketPulse.activeCycle ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {marketPulse.activeCycle.cardCount}{" "}
                  {t("auth.admin.overview.cardsLabel")}
                  {marketPulse.activeCycle.unlockedCount > 0
                    ? ` · ${marketPulse.activeCycle.unlockedCount} ${t("auth.admin.overview.unlockedPpa")}`
                    : null}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-zinc-400">{t("auth.admin.overview.mpUnavailable")}</p>
          )}
        </OverviewCard>

        <OverviewCard label={t("auth.admin.overview.playerVisibility")}>
          {marketPulse ? (
            <>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(playerTone)}`}
              >
                {marketPulse.playerVisible
                  ? t("auth.admin.overview.playable")
                  : t("auth.admin.overview.notPlayable")}
              </span>
              {marketPulse.playerVisibilityReason ? (
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {marketPulse.playerVisibilityReason}
                </p>
              ) : (
                <p className="mt-2 text-xs text-emerald-400/90">
                  {t("auth.admin.overview.playableHint")}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">{t("auth.admin.overview.mpUnavailable")}</p>
          )}
        </OverviewCard>

        <OverviewCard label={t("auth.admin.overview.system")}>
          {systemNotes.length > 0 ? (
            <ul className="space-y-1.5 text-xs leading-relaxed text-amber-100/90">
              {systemNotes.slice(0, 3).map((note) => (
                <li key={note} className="list-inside list-disc">
                  {note}
                </li>
              ))}
              {systemNotes.length > 3 ? (
                <li className="text-zinc-500">
                  +{systemNotes.length - 3} more in Market Pulse admin
                </li>
              ) : null}
            </ul>
          ) : (
            <>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(systemTone)}`}
              >
                {t("auth.admin.overview.systemOk")}
              </span>
              <p className="mt-2 text-xs text-zinc-500">
                {t("auth.admin.overview.systemOkHint")}
              </p>
            </>
          )}
        </OverviewCard>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/admin/market-pulse"
          className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 ${focusRing}`}
        >
          {t("auth.admin.quickActions.manageMp")}
        </Link>
        <Link
          href="/market-pulse"
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`}
        >
          {t("auth.admin.quickActions.hub")}
        </Link>
        <Link
          href="/market-pulse/play"
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`}
        >
          {t("auth.admin.quickActions.play")}
        </Link>
        <Link
          href="/market-pulse/leaderboard"
          className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`}
        >
          {t("auth.admin.quickActions.leaderboard")}
        </Link>
      </div>
    </section>
  );
}
