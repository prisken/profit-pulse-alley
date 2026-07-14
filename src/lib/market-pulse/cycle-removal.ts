import type { MarketPulseCycleStatus } from "@prisma/client";

export type CycleRemovalBlockReason = "active" | "status" | "player_data";

export type CycleRemovalEligibilityInput = {
  status: MarketPulseCycleStatus;
  isActive: boolean;
  decisionCount: number;
  scoreCount: number;
  scoreEventCount: number;
  prizeClaimCount: number;
};

export const CYCLE_REMOVAL_MESSAGES = {
  success: "Cycle removed.",
  blockedActive:
    "Cannot remove the active cycle. Unpin or switch the active cycle first.",
  blockedData:
    "Cannot remove a cycle with player decisions, scores, score events, or prize claims.",
  blockedStatus: "Cannot remove revealed or archived cycles.",
  notFound: "Cycle not found.",
  failed: "Could not remove cycle. Please try again.",
} as const;

export function hasMarketPulseCyclePlayerData(
  input: Pick<
    CycleRemovalEligibilityInput,
    "decisionCount" | "scoreCount" | "scoreEventCount" | "prizeClaimCount"
  >,
): boolean {
  return (
    input.decisionCount > 0 ||
    input.scoreCount > 0 ||
    input.scoreEventCount > 0 ||
    input.prizeClaimCount > 0
  );
}

export function getCycleRemovalBlockReason(
  input: CycleRemovalEligibilityInput,
): CycleRemovalBlockReason | null {
  if (input.isActive) {
    return "active";
  }

  if (input.status === "REVEALED" || input.status === "ARCHIVED") {
    return "status";
  }

  if (hasMarketPulseCyclePlayerData(input)) {
    return "player_data";
  }

  return null;
}

export function canRemoveMarketPulseCycle(
  input: CycleRemovalEligibilityInput,
): boolean {
  return getCycleRemovalBlockReason(input) === null;
}

export function cycleRemovalBlockMessage(
  reason: CycleRemovalBlockReason,
): string {
  switch (reason) {
    case "active":
      return CYCLE_REMOVAL_MESSAGES.blockedActive;
    case "status":
      return CYCLE_REMOVAL_MESSAGES.blockedStatus;
    case "player_data":
      return CYCLE_REMOVAL_MESSAGES.blockedData;
  }
}
