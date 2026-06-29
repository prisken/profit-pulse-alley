"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import RevealCycleButton from "@/components/admin/RevealCycleButton";
import { CycleStatusBadge } from "@/components/admin/AdminCardStatusBadge";
import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { evaluateRevealReadiness } from "@/lib/market-pulse/admin-reveal-status";
import type { RevealSectionData } from "@/lib/market-pulse/admin-reveal-data";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const linkClass = `inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 sm:text-sm ${focusRing}`;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Props = {
  cycles: MarketPulseAdminCycleRow[];
  cards: MarketPulseAdminCardRow[];
  activeCycleId: string | null;
  revealSection: RevealSectionData;
  disabled?: boolean;
  onSuccess?: () => void;
};

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-zinc-100">{children}</div>
    </div>
  );
}

export default function MarketPulseRevealScoringSection({
  cycles,
  cards,
  activeCycleId,
  revealSection,
  disabled = false,
  onSuccess,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const defaultCycleId =
    activeCycleId ?? cycles.find((cycle) => cycle.status !== "REVEALED")?.id ?? cycles[0]?.id ?? "";
  const [selectedCycleId, setSelectedCycleId] = useState(defaultCycleId);

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId],
  );

  const readiness = useMemo(
    () => evaluateRevealReadiness(selectedCycle, cards),
    [selectedCycle, cards],
  );

  const enrichment = selectedCycle
    ? revealSection.enrichments[selectedCycle.id]
    : null;

  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId) ?? null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">{t("auth.admin.mp.reveal.intro")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-300">
            {t("auth.admin.mp.reveal.selectCycle")}
          </span>
          <select
            value={selectedCycleId}
            onChange={(event) => setSelectedCycleId(event.target.value)}
            disabled={disabled || cycles.length === 0}
            className={`mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none disabled:opacity-60 ${focusRing}`}
          >
            {cycles.length === 0 ? (
              <option value="">{t("auth.admin.mp.noCycles")}</option>
            ) : (
              cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                  {cycle.isActive ? ` (${t("auth.admin.mp.active")})` : ""}
                </option>
              ))
            )}
          </select>
        </label>

        <StatTile label={t("auth.admin.mp.reveal.activeCycle")}>
          {activeCycle?.name ?? t("auth.admin.mp.none")}
        </StatTile>
        <StatTile label={t("auth.admin.mp.statRevealDate")}>
          {selectedCycle ? formatDateTime(selectedCycle.revealAt) : "—"}
        </StatTile>
        <StatTile label={t("auth.admin.mp.reveal.status")}>
          {selectedCycle ? <CycleStatusBadge status={selectedCycle.status} /> : "—"}
        </StatTile>
        <StatTile label={t("auth.admin.mp.reveal.allowed")}>
          {readiness.canReveal ? (
            <span className="text-emerald-300">{t("auth.admin.mp.reveal.allowedYes")}</span>
          ) : (
            <span className="text-amber-200">{t("auth.admin.mp.reveal.allowedNo")}</span>
          )}
        </StatTile>
        <StatTile label={t("auth.admin.mp.statCards")}>
          {selectedCycle ? selectedCycle.cardCount : "—"}
        </StatTile>
        <StatTile label={t("auth.admin.mp.statDecisions")}>
          {selectedCycle ? selectedCycle.decisionCount : "—"}
        </StatTile>
        <StatTile label={t("auth.admin.mp.reveal.scoresCalculated")}>
          {enrichment?.scoresCalculated
            ? t("auth.admin.mp.reveal.scoresYes").replace(
                "{count}",
                String(enrichment.scoreEventCount),
              )
            : t("auth.admin.mp.reveal.scoresNo")}
        </StatTile>
      </div>

      {readiness.blockMessage ? (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100"
          role="alert"
        >
          <p>{translateAuthMessage(locale, readiness.blockMessage)}</p>
          {readiness.missingPpaCards.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-200/90">
              {readiness.missingPpaCards.map((card) => (
                <li key={card.id}>
                  {translateWith(locale, "auth.admin.mp.reveal.missingCardLine", {
                    day: String(card.dayIndex),
                    company: card.companyName,
                    headline: card.headline,
                  })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {readiness.scheduledRevealNote ? (
        <div
          className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-3 text-sm text-zinc-300"
          role="status"
        >
          {translateAuthMessage(locale, readiness.scheduledRevealNote)}
          <p className="mt-1 text-xs text-zinc-500">
            {t("auth.admin.mp.reveal.earlyAdminNote")}
          </p>
        </div>
      ) : null}

      {enrichment && enrichment.leaderboardPreview.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-zinc-100">
            {t("auth.admin.mp.reveal.leaderboardPreview")}
          </h3>
          <ol className="mt-3 space-y-2">
            {enrichment.leaderboardPreview.map((row) => (
              <li
                key={row.rank}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-200">
                  #{row.rank} {row.playerName}
                </span>
                <span className="tabular-nums text-emerald-300">{row.score} pts</span>
              </li>
            ))}
          </ol>
        </div>
      ) : selectedCycle && readiness.alreadyRevealed ? (
        <p className="text-sm text-zinc-500">{t("auth.admin.mp.reveal.noLeaderboard")}</p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        {selectedCycle ? (
          <RevealCycleButton
            cycleId={selectedCycle.id}
            cycleName={selectedCycle.name}
            cycleStatus={selectedCycle.status}
            disabled={disabled || !readiness.canReveal}
            blockMessage={readiness.blockMessage}
            onSuccess={onSuccess}
          />
        ) : null}
        <Link href="/market-pulse/leaderboard" className={linkClass}>
          {t("auth.admin.quickActions.leaderboard")}
        </Link>
        <Link href="/market-pulse/reveal" className={linkClass}>
          {t("auth.admin.mp.reveal.viewRevealPage")}
        </Link>
      </div>
    </div>
  );
}
