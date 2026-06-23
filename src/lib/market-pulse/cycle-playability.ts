import type { MarketPulseCycleStatus } from "@prisma/client";

export type CyclePlayabilityInput = {
  status: MarketPulseCycleStatus;
  startsAt: Date;
  revealAt: Date;
};

export type CyclePlayabilityIssue =
  | "not_open"
  | "not_started"
  | "reveal_passed";

export function getCyclePlayabilityIssue(
  cycle: CyclePlayabilityInput,
  at: Date = new Date(),
): CyclePlayabilityIssue | null {
  if (cycle.status !== "OPEN") {
    return "not_open";
  }
  if (cycle.startsAt > at) {
    return "not_started";
  }
  if (cycle.revealAt < at) {
    return "reveal_passed";
  }
  return null;
}

export function isCyclePlayable(
  cycle: CyclePlayabilityInput,
  at: Date = new Date(),
): boolean {
  return getCyclePlayabilityIssue(cycle, at) === null;
}

export function describeCyclePlayabilityIssue(
  issue: CyclePlayabilityIssue,
): string {
  switch (issue) {
    case "not_open":
      return "Cycle status is not OPEN — players cannot play.";
    case "not_started":
      return "Cycle has not started yet (startsAt is in the future).";
    case "reveal_passed":
      return "Cycle reveal date has passed — extend revealAt or create a new cycle.";
    default:
      return "Cycle is not playable.";
  }
}
