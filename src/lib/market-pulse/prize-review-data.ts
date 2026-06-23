import "server-only";

import type { MarketPulsePrizeStatus } from "@prisma/client";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prizeNameForRank } from "@/lib/market-pulse/prize-constants";
import {
  getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type PrizeReviewRevealedCycle = {
  id: string;
  name: string;
  revealAt: string;
};

export type PrizeReviewCandidateRow = {
  rank: number;
  userId: string;
  playerName: string;
  email: string;
  score: number;
  decisionsCount: number;
  firstPlayedAt: string | null;
  lastPlayedAt: string | null;
  duplicateIpHashCount: number;
  accountCreatedAt: string;
  prizeName: string;
  claimId: string | null;
  claimStatus: MarketPulsePrizeStatus | null;
};

export type PrizeReviewData = {
  selectedCycleId: string | null;
  selectedCycleName: string | null;
  cycleRevealed: boolean;
  revealedCycles: PrizeReviewRevealedCycle[];
  candidates: PrizeReviewCandidateRow[];
};

function countSharedIpHashes(
  userId: string,
  userIpHashes: Set<string>,
  ipToUserIds: Map<string, Set<string>>,
): number {
  let shared = 0;
  for (const hash of userIpHashes) {
    const users = ipToUserIds.get(hash);
    if (users && users.size > 1 && users.has(userId)) {
      shared += 1;
    }
  }
  return shared;
}

export async function getMarketPulsePrizeReviewData(
  preferredCycleId?: string | null,
): Promise<PrizeReviewData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const revealedCycles = await prisma.marketPulseCycle.findMany({
    where: { status: "REVEALED" },
    orderBy: { revealAt: "desc" },
    select: { id: true, name: true, revealAt: true, status: true },
  });

  const revealedCycleRows: PrizeReviewRevealedCycle[] = revealedCycles.map(
    (cycle) => ({
      id: cycle.id,
      name: cycle.name,
      revealAt: cycle.revealAt.toISOString(),
    }),
  );

  const selectedCycle =
    revealedCycles.find((cycle) => cycle.id === preferredCycleId) ??
    revealedCycles[0] ??
    null;

  if (!selectedCycle) {
    return {
      selectedCycleId: null,
      selectedCycleName: null,
      cycleRevealed: false,
      revealedCycles: revealedCycleRows,
      candidates: [],
    };
  }

  const cycleRevealed = isMarketPulseCycleRevealed(selectedCycle);
  if (!cycleRevealed) {
    return {
      selectedCycleId: selectedCycle.id,
      selectedCycleName: selectedCycle.name,
      cycleRevealed: false,
      revealedCycles: revealedCycleRows,
      candidates: [],
    };
  }

  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId: selectedCycle.id,
    limit: 10,
  });

  if (leaderboard.length === 0) {
    return {
      selectedCycleId: selectedCycle.id,
      selectedCycleName: selectedCycle.name,
      cycleRevealed: true,
      revealedCycles: revealedCycleRows,
      candidates: [],
    };
  }

  const userIds = leaderboard.map((row) => row.userId);

  const [users, decisions, claims] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.marketPulseDecision.findMany({
      where: { cycleId: selectedCycle.id, userId: { in: userIds } },
      select: { userId: true, decidedAt: true, ipHash: true },
    }),
    prisma.marketPulsePrizeClaim.findMany({
      where: {
        cycleId: selectedCycle.id,
        leaderboardType: "CURRENT_CYCLE",
        rank: { lte: 10 },
      },
      select: { id: true, userId: true, rank: true, status: true },
    }),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const claimByRank = new Map(claims.map((claim) => [claim.rank, claim]));

  const decisionsByUser = new Map<
    string,
    { decidedAt: Date; ipHash: string | null }[]
  >();
  const ipToUserIds = new Map<string, Set<string>>();

  for (const decision of decisions) {
    const list = decisionsByUser.get(decision.userId) ?? [];
    list.push({ decidedAt: decision.decidedAt, ipHash: decision.ipHash });
    decisionsByUser.set(decision.userId, list);

    if (decision.ipHash) {
      const usersForIp = ipToUserIds.get(decision.ipHash) ?? new Set<string>();
      usersForIp.add(decision.userId);
      ipToUserIds.set(decision.ipHash, usersForIp);
    }
  }

  const candidates: PrizeReviewCandidateRow[] = leaderboard.map((row) => {
    const user = userMap.get(row.userId);
    const userDecisions = decisionsByUser.get(row.userId) ?? [];
    const sorted = [...userDecisions].sort(
      (a, b) => a.decidedAt.getTime() - b.decidedAt.getTime(),
    );
    const userIpHashes = new Set(
      userDecisions
        .map((entry) => entry.ipHash)
        .filter((hash): hash is string => Boolean(hash)),
    );
    const claim = claimByRank.get(row.rank);

    return {
      rank: row.rank,
      userId: row.userId,
      playerName: user?.name?.trim() || "Member",
      email: user?.email ?? "",
      score: row.score,
      decisionsCount: userDecisions.length,
      firstPlayedAt: sorted[0]?.decidedAt.toISOString() ?? null,
      lastPlayedAt: sorted.at(-1)?.decidedAt.toISOString() ?? null,
      duplicateIpHashCount: countSharedIpHashes(
        row.userId,
        userIpHashes,
        ipToUserIds,
      ),
      accountCreatedAt: user?.createdAt.toISOString() ?? "",
      prizeName: prizeNameForRank(row.rank),
      claimId: claim?.id ?? null,
      claimStatus: claim?.status ?? null,
    };
  });

  return {
    selectedCycleId: selectedCycle.id,
    selectedCycleName: selectedCycle.name,
    cycleRevealed: true,
    revealedCycles: revealedCycleRows,
    candidates,
  };
}
