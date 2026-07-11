import "server-only";

import type { MarketPulseCycle } from "@prisma/client";

import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import {
  resolveAllowDemoCycles,
  shouldTreatCycleAsActiveForPublic,
  type GetActiveMarketPulseCycleOptions,
} from "@/lib/market-pulse/demo-cycle-guards";
import { getCardReleaseTime } from "@/lib/market-pulse/playable-card";
import { prisma } from "@/lib/prisma";

export type MarketPulseNextCycleStatus =
  | {
      status: "available";
      cycleId: string;
      name: string;
      startsAtIso: string;
      endsAtIso: string | null;
      revealAtIso: string | null;
      firstCardReleaseAtIso: string | null;
    }
  | {
      status: "tbc";
    };

export type MarketPulseNextCycleCandidate = Pick<
  MarketPulseCycle,
  "id" | "name" | "startsAt" | "endsAt" | "revealAt"
>;

export type GetMarketPulseNextCycleStatusOptions =
  GetActiveMarketPulseCycleOptions & {
    now?: Date;
  };

const futureCycleSelect = {
  id: true,
  name: true,
  startsAt: true,
  endsAt: true,
  revealAt: true,
} as const;

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Pick the nearest future cycle visible on public production paths. */
export function pickNearestPublicFutureCycle(
  cycles: MarketPulseNextCycleCandidate[],
  now: Date,
  allowDemoCycles: boolean,
): MarketPulseNextCycleCandidate | null {
  let nearest: MarketPulseNextCycleCandidate | null = null;

  for (const cycle of cycles) {
    if (cycle.startsAt.getTime() <= now.getTime()) {
      continue;
    }

    if (!shouldTreatCycleAsActiveForPublic(cycle.name, allowDemoCycles)) {
      continue;
    }

    if (
      !nearest ||
      cycle.startsAt.getTime() < nearest.startsAt.getTime()
    ) {
      nearest = cycle;
    }
  }

  return nearest;
}

export function deriveFirstCardReleaseAtIso(
  cycleStartsAt: Date,
  firstPublishedCard?: {
    dayIndex: number;
    publishedAt: Date | null;
  } | null,
): string {
  if (firstPublishedCard) {
    return getCardReleaseTime(firstPublishedCard, cycleStartsAt).toISOString();
  }

  return getCycleDayReleaseAt(cycleStartsAt, 1).toISOString();
}

async function loadFirstPublishedCardForCycle(cycleId: string) {
  return prisma.marketPulseCard.findFirst({
    where: {
      cycleId,
      status: "PUBLISHED",
    },
    orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }],
    select: {
      dayIndex: true,
      publishedAt: true,
    },
  });
}

export async function loadMarketPulseNextCycleStatus(
  options: GetMarketPulseNextCycleStatusOptions = {},
): Promise<MarketPulseNextCycleStatus> {
  try {
    return await getMarketPulseNextCycleStatus(options);
  } catch (error) {
    console.error("[market-pulse/next-cycle] Failed to load next cycle:", error);
    return { status: "tbc" };
  }
}

export async function getMarketPulseNextCycleStatus(
  options: GetMarketPulseNextCycleStatusOptions = {},
): Promise<MarketPulseNextCycleStatus> {
  const now = options.now ?? new Date();
  const allowDemoCycles = resolveAllowDemoCycles(options);

  const futureCycles = await prisma.marketPulseCycle.findMany({
    where: {
      startsAt: { gt: now },
      status: "OPEN",
    },
    orderBy: { startsAt: "asc" },
    select: futureCycleSelect,
  });

  const nextCycle = pickNearestPublicFutureCycle(
    futureCycles,
    now,
    allowDemoCycles,
  );

  if (!nextCycle) {
    return { status: "tbc" };
  }

  const firstPublishedCard = await loadFirstPublishedCardForCycle(nextCycle.id);

  return {
    status: "available",
    cycleId: nextCycle.id,
    name: nextCycle.name,
    startsAtIso: nextCycle.startsAt.toISOString(),
    endsAtIso: toIso(nextCycle.endsAt),
    revealAtIso: toIso(nextCycle.revealAt),
    firstCardReleaseAtIso: deriveFirstCardReleaseAtIso(
      nextCycle.startsAt,
      firstPublishedCard,
    ),
  };
}
