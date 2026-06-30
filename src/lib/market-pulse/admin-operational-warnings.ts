import type { MarketPulseGameRuntimeStatus } from "@prisma/client";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";

export type ActiveCycleOperationalEvaluation = {
  warnings: string[];
};

/**
 * Production ops warnings for /admin overview after public launch.
 * Omits inaugural launch-window checks (exact Jul 2026 dates, pre-launch copy).
 */
export function evaluateActiveCycleOperationalWarnings(input: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  activeCycle: MarketPulseAdminCycleRow | null;
  cards: MarketPulseAdminCardRow[];
}): ActiveCycleOperationalEvaluation {
  const warnings: string[] = [];

  if (input.runtimeStatus !== "OPEN") {
    warnings.push(
      `Game runtime is ${input.runtimeStatus}. Players cannot play until runtime is OPEN.`,
    );
  }

  if (!input.activeCycle) {
    warnings.push(
      "No active cycle is set. Pin an active cycle in advanced cycle settings.",
    );
    return { warnings };
  }

  const cycle = input.activeCycle;
  const cycleCards = input.cards.filter((card) => card.cycleId === cycle.id);

  if (!cycle.isPlayableNow && cycle.playabilityIssue) {
    warnings.push(cycle.playabilityIssue);
  }

  if (new Date(cycle.revealAt).getTime() < new Date(cycle.endsAt).getTime()) {
    warnings.push(
      "Active cycle revealAt is before endsAt. Reveal must be on or after the cycle end.",
    );
  }

  if (cycle.status !== "OPEN") {
    warnings.push(
      `Active cycle status is ${cycle.status}. Set status to OPEN while the cycle should be playable.`,
    );
  }

  if (cycleCards.length === 0) {
    warnings.push("Active cycle has no cards yet. Add and publish cards in the cycle builder.");
  } else {
    const unpublished = cycleCards.filter((card) => card.status !== "PUBLISHED");
    if (unpublished.length > 0) {
      warnings.push(
        `${unpublished.length} card(s) are not PUBLISHED on the active cycle.`,
      );
    }
  }

  return { warnings };
}
