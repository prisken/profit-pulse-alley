import GameHub from "@/components/game/GameHub";
import { getGameHubLeaderboardView } from "@/lib/market-pulse/queries";
import type { MarketPulseLeaderboardView } from "@/lib/market-pulse/types";

export const metadata = {
  title: "Market Pulse Hub | Profit Pulse Ally",
  description:
    "View the Market Pulse leaderboard and play to climb the ranks.",
};

const EMPTY_LEADERBOARD_VIEW: MarketPulseLeaderboardView = {
  entries: [],
  mode: "current-cycle",
  usedAllTimeFallback: false,
};

export default async function MarketPulseHubPage() {
  let leaderboardView = EMPTY_LEADERBOARD_VIEW;

  try {
    leaderboardView = await getGameHubLeaderboardView(10);
  } catch (error) {
    console.error("[market-pulse] Failed to load leaderboard:", error);
  }

  return <GameHub leaderboardView={leaderboardView} />;
}
