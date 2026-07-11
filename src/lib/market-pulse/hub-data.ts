import "server-only";

import { isDatabaseConfigured } from "@/lib/db-config";
import { getCurrentMarketPulseCycle as getSyntheticChallengeCycle } from "@/lib/market-pulse/challenge-cycle";
import { shouldUseMarketPulseDevelopmentFallback } from "@/lib/market-pulse/demo-cycle-guards";
import {
  loadMarketPulseNextCycleStatus,
  type MarketPulseNextCycleStatus,
} from "@/lib/market-pulse/next-cycle";
import {
  getActiveMarketPulseCycle,
  getMarketPulseLeaderboard,
  getMarketPulseSettings,
  isMarketPulseCycleRevealed,
  type MarketPulseLeaderboardRow,
} from "@/lib/market-pulse/server";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
import { MARKET_PULSE_CYCLE_PRIZE_SHORT } from "@/lib/market-pulse/launch-config";

const DEFAULT_PRIZE_LABEL = MARKET_PULSE_CYCLE_PRIZE_SHORT;
const DEFAULT_CHALLENGE_NAME = "Market Pulse Challenge";

export type MarketPulseHubPageData = {
  challengeName: string;
  dayCurrent: number;
  dayTotal: number;
  prizeLabel: string;
  startsAtIso: string;
  endsAtIso: string;
  revealAtIso: string;
  revealRemainingMs: number;
  cycleId: string | null;
  runtimeOpen: boolean;
  leaderboardEntries: MarketPulseLeaderboardRow[];
  leaderboardRevealed: boolean;
  hasDatabaseCycle: boolean;
  nextCycle: MarketPulseNextCycleStatus;
};

function getDayProgress(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): { dayCurrent: number; dayTotal: number } {
  const spanMs = Math.max(endsAt.getTime() - startsAt.getTime(), MS_PER_DAY);
  const dayTotal = Math.max(1, Math.round(spanMs / MS_PER_DAY));
  const elapsedMs = now.getTime() - startsAt.getTime();
  const dayCurrent = Math.min(
    dayTotal,
    Math.max(1, Math.floor(elapsedMs / MS_PER_DAY) + 1),
  );

  return { dayCurrent, dayTotal };
}

async function loadHubNextCycle(now: Date): Promise<MarketPulseNextCycleStatus> {
  if (!isDatabaseConfigured()) {
    return { status: "tbc" };
  }

  return loadMarketPulseNextCycleStatus({ now });
}

export async function getMarketPulseHubPageData(): Promise<MarketPulseHubPageData> {
  const now = new Date();
  const synthetic = getSyntheticChallengeCycle();

  if (!isDatabaseConfigured()) {
    if (!shouldUseMarketPulseDevelopmentFallback()) {
      return buildProductionSafeEmptyHubData(now, false);
    }
    return buildFallbackHubData(synthetic, now, true);
  }

  let settings;
  let prismaCycle = null;
  let nextCycle: MarketPulseNextCycleStatus = { status: "tbc" };

  try {
    [settings, prismaCycle, nextCycle] = await Promise.all([
      getMarketPulseSettings(),
      getActiveMarketPulseCycle(),
      loadHubNextCycle(now),
    ]);
  } catch (error) {
    console.error("[market-pulse/hub-data] Failed to load Prisma hub data:", error);
    if (!shouldUseMarketPulseDevelopmentFallback()) {
      return buildProductionSafeEmptyHubData(now, false);
    }
    return buildFallbackHubData(synthetic, now, true);
  }

  if (!prismaCycle) {
    if (!shouldUseMarketPulseDevelopmentFallback()) {
      return buildProductionSafeEmptyHubData(
        now,
        settings.runtimeStatus === "OPEN",
        nextCycle,
      );
    }
    return buildFallbackHubData(
      synthetic,
      now,
      settings.runtimeStatus === "OPEN",
    );
  }

  const startsAt = prismaCycle.startsAt;
  const endsAt = prismaCycle.endsAt;
  const revealAt = prismaCycle.revealAt;
  const { dayCurrent, dayTotal } = getDayProgress(startsAt, endsAt, now);

  const cycleId = prismaCycle.id;
  const leaderboardRevealed = isMarketPulseCycleRevealed(prismaCycle, now);

  let leaderboardEntries: MarketPulseLeaderboardRow[] = [];

  try {
    leaderboardEntries = await getMarketPulseLeaderboard({
      mode: "CURRENT_CYCLE",
      cycleId: prismaCycle.id,
      limit: 5,
    });
  } catch (error) {
    console.error("[market-pulse/hub-data] Failed to load leaderboard:", error);
  }

  return {
    challengeName: prismaCycle.name,
    dayCurrent,
    dayTotal,
    prizeLabel: prismaCycle.prizeLabel?.trim() || DEFAULT_PRIZE_LABEL,
    startsAtIso: startsAt.toISOString(),
    endsAtIso: endsAt.toISOString(),
    revealAtIso: revealAt.toISOString(),
    revealRemainingMs: Math.max(0, revealAt.getTime() - now.getTime()),
    cycleId,
    runtimeOpen: settings.runtimeStatus === "OPEN",
    leaderboardEntries,
    leaderboardRevealed,
    hasDatabaseCycle: true,
    nextCycle,
  };
}

function buildProductionSafeEmptyHubData(
  now: Date,
  runtimeOpen: boolean,
  nextCycle: MarketPulseNextCycleStatus = { status: "tbc" },
): MarketPulseHubPageData {
  return {
    challengeName: DEFAULT_CHALLENGE_NAME,
    dayCurrent: 0,
    dayTotal: 0,
    prizeLabel: DEFAULT_PRIZE_LABEL,
    startsAtIso: now.toISOString(),
    endsAtIso: now.toISOString(),
    revealAtIso: now.toISOString(),
    revealRemainingMs: 0,
    cycleId: null,
    runtimeOpen,
    leaderboardEntries: [],
    leaderboardRevealed: false,
    hasDatabaseCycle: false,
    nextCycle,
  };
}

function buildFallbackHubData(
  synthetic: ReturnType<typeof getSyntheticChallengeCycle>,
  now: Date,
  runtimeOpen: boolean,
): MarketPulseHubPageData {
  const { dayCurrent, dayTotal } = getDayProgress(
    synthetic.startAt,
    synthetic.endAt,
    now,
  );

  return {
    challengeName: DEFAULT_CHALLENGE_NAME,
    dayCurrent,
    dayTotal,
    prizeLabel: DEFAULT_PRIZE_LABEL,
    startsAtIso: synthetic.startAt.toISOString(),
    endsAtIso: synthetic.endAt.toISOString(),
    revealAtIso: synthetic.endAt.toISOString(),
    revealRemainingMs: Math.max(0, synthetic.endAt.getTime() - now.getTime()),
    cycleId: synthetic.cycleId,
    runtimeOpen,
    leaderboardEntries: [],
    leaderboardRevealed: false,
    hasDatabaseCycle: false,
    nextCycle: { status: "tbc" },
  };
}
