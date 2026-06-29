import { isMarketPulseCycleRevealed } from "@/lib/market-pulse/reveal-access";
import type { MarketPulseCycleStatus } from "@prisma/client";

export type LeaderboardCycleRow = {
  id: string;
  name: string;
  startsAt: Date | string;
  endsAt: Date | string;
  revealAt: Date | string;
  status: string;
};

export type LeaderboardCycleOption = {
  id: string;
  name: string;
  startsAtIso: string;
  endsAtIso: string;
  revealAtIso: string;
  isActive: boolean;
  isRevealed: boolean;
  labelKind: "current" | "archived";
};

export type LeaderboardViewState =
  | "ready"
  | "locked"
  | "no_scores"
  | "no_cycles"
  | "unavailable";

function isCycleRevealed(cycle: LeaderboardCycleRow, now: Date): boolean {
  const revealAt =
    typeof cycle.revealAt === "string"
      ? new Date(cycle.revealAt)
      : cycle.revealAt;
  return isMarketPulseCycleRevealed(
    { status: cycle.status as MarketPulseCycleStatus, revealAt },
    now,
  );
}

function toIso(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

function toOption(
  cycle: LeaderboardCycleRow,
  input: {
    isActive: boolean;
    labelKind: "current" | "archived";
    isRevealed: boolean;
  },
): LeaderboardCycleOption {
  return {
    id: cycle.id,
    name: cycle.name,
    startsAtIso: toIso(cycle.startsAt),
    endsAtIso: toIso(cycle.endsAt),
    revealAtIso: toIso(cycle.revealAt),
    isActive: input.isActive,
    isRevealed: input.isRevealed,
    labelKind: input.labelKind,
  };
}

/** Cycles shown in the public leaderboard selector (active + revealed history). */
export function buildLeaderboardCycleOptions(
  activeCycle: LeaderboardCycleRow | null,
  historicalCycles: LeaderboardCycleRow[],
  now: Date = new Date(),
): LeaderboardCycleOption[] {
  const byId = new Map<string, LeaderboardCycleOption>();

  for (const cycle of historicalCycles) {
    if (cycle.status === "ARCHIVED") {
      continue;
    }
    if (!isCycleRevealed(cycle, now)) {
      continue;
    }
    byId.set(
      cycle.id,
      toOption(cycle, {
        isActive: false,
        labelKind: "archived",
        isRevealed: true,
      }),
    );
  }

  if (activeCycle && activeCycle.status !== "ARCHIVED") {
    const isRevealed = isCycleRevealed(activeCycle, now);
    byId.set(
      activeCycle.id,
      toOption(activeCycle, {
        isActive: true,
        labelKind: "current",
        isRevealed,
      }),
    );
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.revealAtIso).getTime() - new Date(a.revealAtIso).getTime(),
  );
}

export function resolveLeaderboardSelectedCycleId(
  requestedCycleId: string | null | undefined,
  options: LeaderboardCycleOption[],
  activeCycleId: string | null,
): { cycleId: string | null; unavailable: boolean } {
  const trimmed = requestedCycleId?.trim();
  if (trimmed) {
    const match = options.find((option) => option.id === trimmed);
    if (!match) {
      return { cycleId: null, unavailable: true };
    }
    return { cycleId: match.id, unavailable: false };
  }

  if (activeCycleId && options.some((option) => option.id === activeCycleId)) {
    return { cycleId: activeCycleId, unavailable: false };
  }

  const latestRevealed = options.find((option) => option.isRevealed);
  return { cycleId: latestRevealed?.id ?? null, unavailable: false };
}

export function getLeaderboardViewState(
  selected: LeaderboardCycleOption | null,
  entriesCount: number,
  unavailable: boolean,
): LeaderboardViewState {
  if (unavailable) {
    return "unavailable";
  }
  if (!selected) {
    return "no_cycles";
  }
  if (!selected.isRevealed) {
    return "locked";
  }
  if (entriesCount === 0) {
    return "no_scores";
  }
  return "ready";
}
