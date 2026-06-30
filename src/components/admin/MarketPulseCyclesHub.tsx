"use client";

import Link from "next/link";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MARKET_PULSE_PUBLIC_PATHS,
  marketPulseCycleBuilderPath,
} from "@/lib/market-pulse/admin-mp-navigation";
import type { MarketPulseAdminDashboardData } from "@/lib/market-pulse/admin-data";
import { evaluateRevealReadiness } from "@/lib/market-pulse/admin-reveal-status";

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

type Props = {
  cycles: MarketPulseAdminDashboardData["cycles"];
  cards: MarketPulseAdminDashboardData["cards"];
  disabled?: boolean;
  onQuickCreateNextCycle: () => void;
  onEditCycle: (cycleId: string) => void;
  onScrollToReveal: () => void;
};

export default function MarketPulseCyclesHub({
  cycles,
  cards,
  disabled = false,
  onQuickCreateNextCycle,
  onEditCycle,
  onScrollToReveal,
}: Readonly<Props>) {
  const { t } = useTranslations();

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  return (
    <section id="cycles-hub" className="scroll-mt-36 space-y-4 lg:scroll-mt-44">
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-zinc-950 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">
          {t("auth.admin.mp.nav.fastBuilder")}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-50 sm:text-xl">
          {t("auth.admin.mp.nav.primaryPathTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
          {t("auth.admin.mp.nav.primaryPathBody")}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{t("auth.admin.mp.nav.advancedHint")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colCycle")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colDates")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colCards")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colStatus")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.nav.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedCycles.map((cycle) => {
                  const revealReadiness = evaluateRevealReadiness(cycle, cards);
                  const builderPath = marketPulseCycleBuilderPath(cycle.id);

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
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Link href={builderPath} className={primaryButtonClass}>
                            {t("auth.admin.mp.openBuilder")}
                          </Link>
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
                            <button type="button" className={buttonClass} onClick={onScrollToReveal}>
                              {t("auth.admin.mp.nav.revealScoring")}
                            </button>
                          ) : null}
                          <Link
                            href={MARKET_PULSE_PUBLIC_PATHS.leaderboard}
                            className={buttonClass}
                          >
                            {t("auth.admin.mp.nav.leaderboard")}
                          </Link>
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
              const builderPath = marketPulseCycleBuilderPath(cycle.id);
              const revealReadiness = evaluateRevealReadiness(cycle, cards);

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
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Link href={builderPath} className={primaryButtonClass}>
                      {t("auth.admin.mp.openBuilder")}
                    </Link>
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
