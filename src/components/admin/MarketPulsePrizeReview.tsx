"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MarketPulsePrizeStatus } from "@prisma/client";

import { IndicatorBadge } from "@/components/admin/AdminCardStatusBadge";
import {
  createAllMarketPulsePrizeClaimsAction,
  createMarketPulsePrizeClaimAction,
  updateMarketPulsePrizeClaimStatusAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import type { PrizeReviewData } from "@/lib/market-pulse/prize-review-data";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const PRIZE_STATUSES: MarketPulsePrizeStatus[] = [
  "PENDING_REVIEW",
  "VERIFIED",
  "CONTACTED",
  "CLAIMED",
  "DISQUALIFIED",
  "EXPIRED",
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const primaryButtonClass = `min-h-10 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:w-auto ${focusRing}`;

function prizeStatusTone(status: MarketPulsePrizeStatus | null): "ok" | "warn" | "neutral" {
  switch (status) {
    case "CLAIMED":
      return "ok";
    case "DISQUALIFIED":
    case "EXPIRED":
      return "warn";
    default:
      return "neutral";
  }
}

type Props = {
  data: PrizeReviewData;
  embedded?: boolean;
};

function PrizeClaimCard({
  row,
  cycleName,
  prizeLabel,
  isPending,
  selectedCycleId,
  onRunAction,
}: {
  row: PrizeReviewData["candidates"][number];
  cycleName: string | null;
  prizeLabel: string | null;
  isPending: boolean;
  selectedCycleId: string | null;
  onRunAction: (action: () => Promise<AdminActionResult>) => void;
}) {
  const { t } = useTranslations();

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-zinc-100">#{row.rank}</span>
            {row.claimStatus ? (
              <IndicatorBadge label={row.claimStatus} tone={prizeStatusTone(row.claimStatus)} />
            ) : (
              <IndicatorBadge label={t("auth.admin.mp.prize.noClaim")} tone="warn" />
            )}
          </div>
          <p className="mt-2 text-base font-semibold text-zinc-100">{row.playerName}</p>
          <p className="mt-0.5 break-all text-sm text-zinc-400">{row.email}</p>
          {row.contactNumber ? (
            <p className="mt-1 text-sm text-zinc-500">
              {t("auth.admin.mp.prize.contact")}: {row.contactNumber}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">{t("auth.admin.mp.prize.noContact")}</p>
          )}
        </div>
        <p className="shrink-0 text-lg font-semibold tabular-nums text-emerald-300">
          {row.score} pts
        </p>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">{t("auth.admin.mp.prize.cycle")}</dt>
          <dd className="mt-0.5 font-medium text-zinc-300">{cycleName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("auth.admin.mp.prize.prizeLabel")}</dt>
          <dd className="mt-0.5 font-medium text-zinc-300">
            {row.prizeName || prizeLabel || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("auth.admin.mp.prize.reviewSignals")}</dt>
          <dd className="mt-0.5 text-zinc-400">
            {row.decisionsCount} {t("auth.admin.mp.cards.decisions")} ·{" "}
            {t("auth.admin.mp.prize.sharedIp")}: {row.duplicateIpHashCount}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-zinc-800 pt-3">
        {row.claimId ? (
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              {t("auth.admin.mp.prize.updateStatus")}
            </span>
            <select
              className={`mt-1 block w-full min-h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 outline-none disabled:opacity-60 sm:max-w-xs ${focusRing}`}
              value={row.claimStatus ?? "PENDING_REVIEW"}
              disabled={isPending}
              onChange={(event) =>
                onRunAction(() =>
                  updateMarketPulsePrizeClaimStatusAction({
                    claimId: row.claimId!,
                    status: event.target.value as MarketPulsePrizeStatus,
                  }),
                )
              }
            >
              {PRIZE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button
            type="button"
            className={primaryButtonClass}
            disabled={isPending || !selectedCycleId}
            onClick={() =>
              onRunAction(() =>
                createMarketPulsePrizeClaimAction({
                  cycleId: selectedCycleId!,
                  userId: row.userId,
                  rank: row.rank,
                }),
              )
            }
          >
            {t("auth.admin.mp.prize.createClaim")}
          </button>
        )}
      </div>
    </article>
  );
}

export default function MarketPulsePrizeReview({ data, embedded = false }: Props) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimsCount = data.candidates.filter((row) => row.claimId).length;

  function refresh() {
    router.refresh();
  }

  function runAction(action: () => Promise<AdminActionResult>) {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      await invokeAdminAction(action, {
        onSuccess: (successMessage, successWarning) => {
          setMessage(successMessage ?? t("auth.admin.mp.saved"));
          setWarning(successWarning ?? null);
          refresh();
        },
        onError: (actionError) => {
          setError(actionError ?? t("auth.admin.mp.actionFailed"));
        },
        onThrow: () => refresh(),
      });
    });
  }

  function handleCycleChange(cycleId: string) {
    const url = new URL(window.location.href);
    if (cycleId) {
      url.searchParams.set("prizeCycleId", cycleId);
    } else {
      url.searchParams.delete("prizeCycleId");
    }
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <section aria-labelledby="prize-review-heading" className={embedded ? undefined : ""}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 id="prize-review-heading" className="text-base font-semibold text-zinc-50 sm:text-lg">
            {t("auth.admin.mp.prizeReview")}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{t("auth.admin.mp.prize.subtitle")}</p>
        </div>
        {data.selectedCycleId ? (
          <button
            type="button"
            className={primaryButtonClass}
            disabled={isPending || data.candidates.length === 0}
            onClick={() =>
              runAction(() =>
                createAllMarketPulsePrizeClaimsAction(data.selectedCycleId!),
              )
            }
          >
            {t("auth.admin.mp.prize.createAll")}
          </button>
        ) : null}
      </div>

      {data.revealedCycles.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2 sm:max-w-md">
            <span className="text-sm font-medium text-zinc-300">
              {t("auth.admin.mp.prize.selectCycle")}
            </span>
            <select
              className={`mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none disabled:opacity-60 ${focusRing}`}
              value={data.selectedCycleId ?? ""}
              onChange={(event) => handleCycleChange(event.target.value)}
              disabled={isPending}
            >
              {data.revealedCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </label>
          {data.selectedCycleName ? (
            <>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {t("auth.admin.mp.prize.cycle")}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{data.selectedCycleName}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {t("auth.admin.mp.prize.prizeLabel")}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-200">
                  {data.prizeLabel?.trim() || "—"}
                </p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {(message || warning || error) && (
        <div className="mt-3 space-y-1" role="status" aria-live="polite">
          {error ? (
            <p className="text-sm font-medium text-red-400">
              {translateAuthMessage(locale, error)}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm font-medium text-emerald-300">
              {translateAuthMessage(locale, message)}
            </p>
          ) : null}
          {warning ? (
            <p className="text-sm font-medium text-amber-200">{warning}</p>
          ) : null}
        </div>
      )}

      {data.revealedCycles.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">
            {t("auth.admin.mp.prize.emptyNoRevealed")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{t("auth.admin.mp.prize.emptyNoRevealedHint")}</p>
        </div>
      ) : !data.cycleRevealed ? (
        <p className="mt-4 text-sm text-zinc-400">{t("auth.admin.mp.prize.notRevealedYet")}</p>
      ) : data.candidates.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">
            {t("auth.admin.mp.prize.emptyNoWinners")}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-500">
            {t("auth.admin.mp.prize.claimsSummary")
              .replace("{claims}", String(claimsCount))
              .replace("{candidates}", String(data.candidates.length))}
          </p>
          <ul className="mt-4 space-y-3">
            {data.candidates.map((row) => (
              <li key={row.userId}>
                <PrizeClaimCard
                  row={row}
                  cycleName={data.selectedCycleName}
                  prizeLabel={data.prizeLabel}
                  isPending={isPending}
                  selectedCycleId={data.selectedCycleId}
                  onRunAction={runAction}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
