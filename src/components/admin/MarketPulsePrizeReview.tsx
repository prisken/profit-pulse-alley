"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MarketPulsePrizeStatus } from "@prisma/client";

import {
  createAllMarketPulsePrizeClaimsAction,
  createMarketPulsePrizeClaimAction,
  updateMarketPulsePrizeClaimStatusAction,
} from "@/lib/market-pulse/admin-actions";
import type { PrizeReviewData } from "@/lib/market-pulse/prize-review-data";

const PRIZE_STATUSES: MarketPulsePrizeStatus[] = [
  "PENDING_REVIEW",
  "VERIFIED",
  "CONTACTED",
  "CLAIMED",
  "DISQUALIFIED",
  "EXPIRED",
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonClass = `rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 ${focusRing}`;

const primaryButtonClass = `rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 ${focusRing}`;

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status: MarketPulsePrizeStatus | null): string {
  switch (status) {
    case "CLAIMED":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "VERIFIED":
    case "CONTACTED":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
    case "DISQUALIFIED":
    case "EXPIRED":
      return "bg-red-500/15 text-red-800 dark:text-red-200";
    default:
      return "bg-foreground/10 text-foreground/70";
  }
}

type Props = {
  data: PrizeReviewData;
};

export default function MarketPulsePrizeReview({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function runAction(
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      refresh();
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
    <section aria-labelledby="prize-review-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="prize-review-heading" className="text-lg font-semibold text-foreground">
            Prize Review
          </h2>
          <p className="mt-1 text-sm text-foreground/65">
            Review top-10 winners after a cycle is revealed. Admin only — includes email
            and anti-cheat signals.
          </p>
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
            Create all missing claims
          </button>
        ) : null}
      </div>

      {data.revealedCycles.length > 0 ? (
        <label className="mt-4 block max-w-md">
          <span className="text-sm font-medium text-foreground/80">Revealed cycle</span>
          <select
            className={`mt-2 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-60 ${focusRing}`}
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
      ) : null}

      {(message || error) && (
        <p
          className={`mt-3 text-sm font-medium ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
          role="status"
        >
          {error ?? message}
        </p>
      )}

      {data.revealedCycles.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/65">
          No revealed cycles yet. Reveal a cycle to review prize winners.
        </p>
      ) : !data.cycleRevealed ? (
        <p className="mt-4 text-sm text-foreground/65">
          Selected cycle is not revealed yet.
        </p>
      ) : data.candidates.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/65">
          No leaderboard entries for this cycle.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-foreground/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-foreground/10 bg-foreground/[0.02] text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-3 py-2.5 font-medium">Rank</th>
                <th className="px-3 py-2.5 font-medium">Player</th>
                <th className="px-3 py-2.5 font-medium">Score</th>
                <th className="px-3 py-2.5 font-medium">Prize</th>
                <th className="px-3 py-2.5 font-medium">Review</th>
                <th className="px-3 py-2.5 font-medium">Claim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {data.candidates.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="px-3 py-3 font-semibold tabular-nums text-foreground">
                    #{row.rank}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{row.playerName}</p>
                    <p className="mt-0.5 text-xs text-foreground/55">{row.email}</p>
                    <p className="mt-2 text-xs text-foreground/50">
                      Account: {formatDateTime(row.accountCreatedAt)}
                    </p>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-foreground">{row.score}</td>
                  <td className="px-3 py-3 text-foreground/80">{row.prizeName}</td>
                  <td className="px-3 py-3 text-xs text-foreground/65">
                    <p>{row.decisionsCount} decisions</p>
                    <p className="mt-1">First: {formatDateTime(row.firstPlayedAt)}</p>
                    <p>Last: {formatDateTime(row.lastPlayedAt)}</p>
                    <p className="mt-1">
                      Shared IP hashes: {row.duplicateIpHashCount}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {row.claimId ? (
                      <div className="space-y-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusTone(row.claimStatus)}`}
                        >
                          {row.claimStatus}
                        </span>
                        <select
                          className={`block w-full min-w-[10rem] rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-xs text-foreground outline-none disabled:opacity-60 ${focusRing}`}
                          value={row.claimStatus ?? "PENDING_REVIEW"}
                          disabled={isPending}
                          onChange={(event) =>
                            runAction(() =>
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
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={isPending || !data.selectedCycleId}
                        onClick={() =>
                          runAction(() =>
                            createMarketPulsePrizeClaimAction({
                              cycleId: data.selectedCycleId!,
                              userId: row.userId,
                              rank: row.rank,
                            }),
                          )
                        }
                      >
                        Create claim
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
