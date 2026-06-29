import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import type { MarketPulseCycleFormValues } from "@/lib/market-pulse/cycle-validation";
import { toDatetimeLocalValue } from "@/lib/market-pulse/cycle-validation";
import {
  MARKET_PULSE_CYCLE_PRIZE_SHORT,
  MARKET_PULSE_FIRST_CYCLE_END_AT,
  MARKET_PULSE_FIRST_CYCLE_START_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
} from "@/lib/market-pulse/launch-config";
import { PRIZE_RANK_1_NAME } from "@/lib/market-pulse/prize-constants";

/** Allow small drift from datetime-local rounding vs stored UTC instants. */
const DATE_TOLERANCE_MS = 60_000;

export const FIRST_PUBLIC_CYCLE_NAME = "First Public Cycle — July 2026";

export const FIRST_CYCLE_GUIDANCE = {
  startLabel: "July 1, 2026 00:00 HKT",
  endLabel: "July 10, 2026 (closes 11 July 2026 00:00 HKT)",
  revealLabel:
    "On or after cycle end — recommended 11 July 2026 00:00 HKT (existing rule: reveal ≥ end)",
  prizeLabel: "One Ocean Park ticket",
  runtimeRequired: "OPEN" as const,
  cardRequirements: "All cards PUBLISHED with locked PPA signal",
  preLaunchNote:
    "Public users are blocked before July 1, 2026. ADMIN accounts can test earlier.",
} as const;

export function getFirstPublicCycleFormPrefill(): MarketPulseCycleFormValues {
  const startsIso = MARKET_PULSE_FIRST_CYCLE_START_AT.toISOString();
  const endsIso = MARKET_PULSE_FIRST_CYCLE_END_AT.toISOString();
  const revealIso = MARKET_PULSE_FIRST_CYCLE_END_AT.toISOString();

  return {
    name: FIRST_PUBLIC_CYCLE_NAME,
    startsAt: toDatetimeLocalValue(startsIso),
    endsAt: toDatetimeLocalValue(endsIso),
    revealAt: toDatetimeLocalValue(revealIso),
    prizeLabel: PRIZE_RANK_1_NAME,
    status: "OPEN",
    setActive: true,
  };
}

function instantMatchesExpected(iso: string, expected: Date): boolean {
  const actualMs = new Date(iso).getTime();
  return Math.abs(actualMs - expected.getTime()) <= DATE_TOLERANCE_MS;
}

function prizeLabelMatches(label: string | null | undefined): boolean {
  if (!label?.trim()) {
    return false;
  }
  const normalized = label.toLowerCase();
  return (
    normalized.includes("ocean park") ||
    normalized.includes("海洋公園")
  );
}

export type FirstCycleSetupEvaluation = {
  warnings: string[];
};

export function evaluateFirstPublicCycleSetup(input: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  cards: MarketPulseAdminCardRow[];
}): FirstCycleSetupEvaluation {
  const warnings: string[] = [];

  if (input.runtimeStatus !== "OPEN") {
    warnings.push(
      `Game runtime is ${input.runtimeStatus}. Set runtime to OPEN before public launch on ${FIRST_CYCLE_GUIDANCE.startLabel}.`,
    );
  }

  if (!input.activeCycle) {
    warnings.push(
      "No active cycle is set. Create the first public cycle and mark it active before launch.",
    );
    return { warnings };
  }

  const cycle = input.activeCycle;
  const cycleCards = input.cards.filter((card) => card.cycleId === cycle.id);

  if (!instantMatchesExpected(cycle.startsAt, MARKET_PULSE_PUBLIC_LAUNCH_AT)) {
    warnings.push(
      `Active cycle starts at ${formatGuidanceInstant(cycle.startsAt)}; expected ${FIRST_CYCLE_GUIDANCE.startLabel}.`,
    );
  }

  if (!instantMatchesExpected(cycle.endsAt, MARKET_PULSE_FIRST_CYCLE_END_AT)) {
    warnings.push(
      `Active cycle ends at ${formatGuidanceInstant(cycle.endsAt)}; expected end of ${FIRST_CYCLE_GUIDANCE.endLabel}.`,
    );
  }

  if (new Date(cycle.revealAt).getTime() < new Date(cycle.endsAt).getTime()) {
    warnings.push(
      "Active cycle revealAt is before endsAt. Reveal must be on or after the cycle end.",
    );
  }

  if (cycle.status !== "OPEN") {
    warnings.push(
      `Active cycle status is ${cycle.status}. Set status to OPEN for the public launch window.`,
    );
  }

  if (!prizeLabelMatches(cycle.prizeLabel)) {
    warnings.push(
      `Active cycle prize label is "${cycle.prizeLabel ?? "(empty)"}"; expected ${FIRST_CYCLE_GUIDANCE.prizeLabel} (${MARKET_PULSE_CYCLE_PRIZE_SHORT}).`,
    );
  }

  if (cycleCards.length === 0) {
    warnings.push("Active cycle has no cards yet. Add and publish cards before launch.");
  } else {
    const unpublished = cycleCards.filter((card) => card.status !== "PUBLISHED");
    if (unpublished.length > 0) {
      warnings.push(
        `${unpublished.length} card(s) are not PUBLISHED on the active cycle.`,
      );
    }

    const unlockedPpa = cycleCards.filter((card) => !card.ppaSignalLockedAt);
    if (unlockedPpa.length > 0) {
      warnings.push(
        `${unlockedPpa.length} card(s) are missing locked PPA on the active cycle.`,
      );
    }
  }

  return { warnings };
}

function formatGuidanceInstant(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Hong_Kong",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
