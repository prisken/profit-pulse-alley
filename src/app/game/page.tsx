import GameHub from "@/components/game/GameHub";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Game Hub | Profit Pulse Ally",
  description:
    "View the VC Investment Challenge leaderboard and play to climb the ranks.",
};

export default async function GamePage() {
  let leaderboard: Array<{
    id: string;
    rank: number;
    playerName: string;
    score: number;
  }> = [];

  try {
    const topScores = await prisma.gameScore.findMany({
      take: 10,
      orderBy: { score: "desc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    leaderboard = topScores.map((entry, index) => ({
      id: entry.id,
      rank: index + 1,
      playerName: entry.user.name?.trim() || "Member",
      score: entry.score,
    }));
  } catch (error) {
    console.error("[game] Failed to load leaderboard:", error);
  }

  return <GameHub leaderboard={leaderboard} />;
}
