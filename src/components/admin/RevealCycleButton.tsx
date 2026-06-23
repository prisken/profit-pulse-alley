"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { MarketPulseCycleStatus } from "@prisma/client";

import {
  revealMarketPulseCycleAction,
  type RevealCycleSummary,
} from "@/lib/market-pulse/admin-actions";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonClass = `rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 ${focusRing}`;

const primaryButtonClass = `rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export function RevealCycleLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/market-pulse/leaderboard"
        className={`${buttonClass} inline-flex items-center`}
      >
        View leaderboard →
      </Link>
      <Link
        href="/market-pulse/reveal"
        className={`${buttonClass} inline-flex items-center`}
      >
        View reveal page →
      </Link>
    </div>
  );
}

function RevealSummaryPanel({ summary }: { summary: RevealCycleSummary }) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
      <p className="font-semibold">Reveal complete</p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <div>
          <dt className="text-emerald-800/70 dark:text-emerald-200/70">Decisions scored</dt>
          <dd className="font-medium">{summary.decisionsScored}</dd>
        </div>
        <div>
          <dt className="text-emerald-800/70 dark:text-emerald-200/70">Players</dt>
          <dd className="font-medium">{summary.usersScored}</dd>
        </div>
        <div>
          <dt className="text-emerald-800/70 dark:text-emerald-200/70">Score events</dt>
          <dd className="font-medium">{summary.eventsCreated}</dd>
        </div>
        <div>
          <dt className="text-emerald-800/70 dark:text-emerald-200/70">Top score</dt>
          <dd className="font-medium">
            {summary.topScore !== null ? summary.topScore : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <RevealCycleLinks />
      </div>
    </div>
  );
}

type RevealCycleButtonProps = {
  cycleId: string;
  cycleName: string;
  cycleStatus: MarketPulseCycleStatus;
  disabled?: boolean;
  onSuccess?: () => void;
};

export default function RevealCycleButton({
  cycleId,
  cycleName,
  cycleStatus,
  disabled = false,
  onSuccess,
}: RevealCycleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RevealCycleSummary | null>(null);

  const busy = disabled || isPending;

  if (cycleStatus === "REVEALED") {
    return (
      <div className="w-full sm:w-auto">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">
          Cycle revealed
        </p>
        <div className="mt-2">
          <RevealCycleLinks />
        </div>
      </div>
    );
  }

  function handleReveal() {
    const confirmed = window.confirm(
      `Reveal "${cycleName}" and calculate scores?\n\nThis will mark the cycle and its published cards as REVEALED, then regenerate score events for all player decisions.`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setSummary(null);

    startTransition(async () => {
      const result = await revealMarketPulseCycleAction(cycleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.revealSummary) {
        setSummary(result.revealSummary);
      }
      onSuccess?.();
    });
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        className={primaryButtonClass}
        disabled={busy}
        onClick={handleReveal}
      >
        {isPending ? "Revealing…" : "Reveal Cycle & Calculate Scores"}
      </button>

      {error ? (
        <p
          className="mt-2 max-w-md text-sm font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {summary ? <RevealSummaryPanel summary={summary} /> : null}
    </div>
  );
}
