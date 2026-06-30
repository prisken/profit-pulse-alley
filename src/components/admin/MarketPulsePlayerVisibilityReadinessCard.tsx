"use client";

import type { PlayerVisibilityReadiness } from "@/lib/market-pulse/admin-player-visibility-readiness";
import { useTranslations } from "@/components/providers/LocaleProvider";

function checkIconClass(status: PlayerVisibilityReadiness["checks"][number]["status"]): string {
  switch (status) {
    case "pass":
      return "text-emerald-400";
    case "fail":
      return "text-amber-300";
    default:
      return "text-sky-300";
  }
}

function checkMarker(status: PlayerVisibilityReadiness["checks"][number]["status"]): string {
  switch (status) {
    case "pass":
      return "✓";
    case "fail":
      return "!";
    default:
      return "·";
  }
}

type MarketPulsePlayerVisibilityReadinessCardProps = Readonly<{
  readiness: PlayerVisibilityReadiness;
}>;

export default function MarketPulsePlayerVisibilityReadinessCard({
  readiness,
}: MarketPulsePlayerVisibilityReadinessCardProps) {
  const { t } = useTranslations();

  const toneClass =
    readiness.overallStatus === "ready"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-amber-500/30 bg-amber-500/5";

  const headlineClass =
    readiness.overallStatus === "ready" ? "text-emerald-100" : "text-amber-100";

  return (
    <section
      aria-labelledby="player-visibility-readiness-heading"
      className={`rounded-xl border px-4 py-4 sm:px-5 ${toneClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="player-visibility-readiness-heading"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400"
          >
            {t("auth.admin.mp.playerVisibility.title")}
          </h2>
          <p className={`mt-1 text-lg font-semibold ${headlineClass}`}>
            {readiness.headline}
          </p>
          {readiness.detail ? (
            <p className="mt-1 text-sm text-zinc-300">{readiness.detail}</p>
          ) : null}
        </div>
        {readiness.playersCanSubmitToday ? (
          <span className="inline-flex min-h-8 items-center rounded-full bg-emerald-500/15 px-3 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/30">
            {t("auth.admin.mp.playerVisibility.canSubmitToday")}
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2" aria-label={t("auth.admin.mp.playerVisibility.checklist")}>
        {readiness.checks.map((check) => (
          <li
            key={check.id}
            className="flex gap-2 text-sm text-zinc-300"
          >
            <span
              className={`mt-0.5 w-4 shrink-0 text-center font-semibold ${checkIconClass(check.status)}`}
              aria-hidden
            >
              {checkMarker(check.status)}
            </span>
            <span>{check.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
