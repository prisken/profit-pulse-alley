import MarketPulseLeaderboard from "@/components/market-pulse/MarketPulseLeaderboard";
import { getMarketPulseLeaderboardPageData } from "@/lib/market-pulse/leaderboard-data";

export const metadata = {
  title: "Market Pulse Leaderboard | Profit Pulse Ally",
  description:
    "View Current Challenge, Monthly, and All-Time Market Pulse leaderboard standings.",
};

export default async function MarketPulseLeaderboardPage() {
  const data = await getMarketPulseLeaderboardPageData();

  return <MarketPulseLeaderboard data={data} />;
}
