"use client";

import Link from "next/link";

import type { MatchingPulseAdminOverviewCounts } from "@/lib/matching-pulse/admin-filters";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type AdminMatchingPulseOverviewProps = Readonly<{
  counts: MatchingPulseAdminOverviewCounts;
}>;

export default function AdminMatchingPulseOverview({
  counts,
}: AdminMatchingPulseOverviewProps) {
  const { t, locale } = useTranslations();
  const awaitingLine =
    counts.needsReviewCount === 1
      ? translateWith(locale, "auth.admin.matchingPulse.awaitingOne", {
          count: counts.needsReviewCount,
        })
      : translateWith(locale, "auth.admin.matchingPulse.awaitingPlural", {
          count: counts.needsReviewCount,
        });

  return (
    <section
      aria-labelledby="admin-matching-pulse-heading"
      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
            Pilot
          </p>
          <h2
            id="admin-matching-pulse-heading"
            className="mt-1 text-base font-semibold tracking-tight text-zinc-50 sm:text-lg"
          >
            {t("auth.admin.matchingPulse.heading")}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-300">{awaitingLine}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {translateWith(locale, "auth.admin.matchingPulse.totals", {
              newCount: counts.newCount,
              total: counts.total,
            })}
          </p>
        </div>

        <Link
          href="/admin/matching-pulse"
          className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 ${focusRing}`}
        >
          {t("auth.admin.matchingPulse.reviewCta")}
        </Link>
      </div>
    </section>
  );
}
