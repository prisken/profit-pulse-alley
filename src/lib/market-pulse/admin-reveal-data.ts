import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import {
  getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/server";
import { prisma } from "@/lib/prisma";

export type RevealLeaderboardPreviewRow = {
  rank: number;
  playerName: string;
  score: number;
};

export type RevealCycleEnrichment = {
  scoreEventCount: number;
  scoresCalculated: boolean;
  leaderboardPreview: RevealLeaderboardPreviewRow[];
};

export type RevealSectionData = {
  enrichments: Record<string, RevealCycleEnrichment>;
};

export async function getMarketPulseRevealSectionData(): Promise<RevealSectionData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const cycles = await prisma.marketPulseCycle.findMany({
    select: { id: true, status: true, revealAt: true },
  });

  const enrichments: Record<string, RevealCycleEnrichment> = {};

  await Promise.all(
    cycles.map(async (cycle) => {
      const scoreEventCount = await prisma.marketPulseScoreEvent.count({
        where: { cycleId: cycle.id },
      });

      const revealed = isMarketPulseCycleRevealed(cycle);
      let leaderboardPreview: RevealLeaderboardPreviewRow[] = [];

      if (revealed) {
        const leaderboard = await getMarketPulseLeaderboard({
          mode: "CURRENT_CYCLE",
          cycleId: cycle.id,
          limit: 5,
        });

        if (leaderboard.length > 0) {
          const users = await prisma.user.findMany({
            where: { id: { in: leaderboard.map((row) => row.userId) } },
            select: { id: true, name: true },
          });
          const userMap = new Map(users.map((user) => [user.id, user]));

          leaderboardPreview = leaderboard.map((row) => ({
            rank: row.rank,
            playerName: userMap.get(row.userId)?.name?.trim() || "Member",
            score: row.score,
          }));
        }
      }

      enrichments[cycle.id] = {
        scoreEventCount,
        scoresCalculated: scoreEventCount > 0 || cycle.status === "REVEALED",
        leaderboardPreview,
      };
    }),
  );

  return { enrichments };
}
