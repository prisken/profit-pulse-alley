"use client";

import { useMemo } from "react";

import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import {
  FIRST_CYCLE_GUIDANCE,
  evaluateFirstPublicCycleSetup,
} from "@/lib/market-pulse/first-cycle-admin-guidance";
import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonClass =
  `min-h-10 rounded-md border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 ${focusRing}`;

type FirstCycleGuidancePanelProps = Readonly<{
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  cards: MarketPulseAdminCardRow[];
  onPrefillCreateCycle: () => void;
  embedded?: boolean;
}>;

export default function FirstCycleGuidancePanel({
  runtimeStatus,
  activeCycle,
  cards,
  onPrefillCreateCycle,
  embedded = false,
}: FirstCycleGuidancePanelProps) {
  const evaluation = useMemo(
    () =>
      evaluateFirstPublicCycleSetup({
        runtimeStatus,
        activeCycle,
        cards,
      }),
    [runtimeStatus, activeCycle, cards],
  );

  return (
    <section
      aria-labelledby="first-cycle-guidance-heading"
      className={
        embedded
          ? undefined
          : "rounded-lg border border-sky-500/25 bg-sky-500/5 p-4 sm:p-5"
      }
    >
      <h2
        id="first-cycle-guidance-heading"
        className="text-base font-semibold text-foreground sm:text-lg"
      >
        First public cycle guidance
      </h2>
      <p className="mt-2 text-sm text-foreground/75">
        Use these settings for the inaugural public Market Pulse cycle. This panel
        only informs — it does not change live data.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-foreground/85">
        <li>
          <span className="font-medium text-foreground">Start:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.startLabel}
        </li>
        <li>
          <span className="font-medium text-foreground">End:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.endLabel}
        </li>
        <li>
          <span className="font-medium text-foreground">Reveal:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.revealLabel}
        </li>
        <li>
          <span className="font-medium text-foreground">Prize label:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.prizeLabel}
        </li>
        <li>
          <span className="font-medium text-foreground">Runtime:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.runtimeRequired} for public launch
        </li>
        <li>
          <span className="font-medium text-foreground">Cards:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.cardRequirements}
        </li>
        <li>
          <span className="font-medium text-foreground">PPA & reveal:</span>{" "}
          {FIRST_CYCLE_GUIDANCE.ppaRevealNote}
        </li>
      </ul>

      <p className="mt-4 rounded-md border border-foreground/10 bg-background/60 px-3 py-2 text-sm text-foreground/75">
        {FIRST_CYCLE_GUIDANCE.preLaunchNote}
      </p>

      {evaluation.warnings.length > 0 ? (
        <div
          className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="alert"
        >
          <p className="font-semibold">Launch window check</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {evaluation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p
          className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          Active setup matches the first public cycle guidance.
        </p>
      )}

      <div className="mt-4">
        <button type="button" className={buttonClass} onClick={onPrefillCreateCycle}>
          Prefill create-cycle form
        </button>
        <p className="mt-2 text-xs text-foreground/55">
          Opens the create form with recommended dates and prize label. Review and
          save manually — nothing is created automatically.
        </p>
      </div>
    </section>
  );
}
