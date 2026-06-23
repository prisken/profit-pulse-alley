import MarketPulsePlayExperience from "@/components/market-pulse/MarketPulsePlayExperience";
import { getMarketPulsePlayPageData } from "@/lib/market-pulse/play-data";

export const metadata = {
  title: "Play Market Pulse | Profit Pulse Ally",
  description:
    "Read today's market signal, make your Bullish or Cautious call, and compare your instinct with PPA Insight.",
};

export default async function MarketPulsePlayPage() {
  const data = await getMarketPulsePlayPageData();

  return <MarketPulsePlayExperience data={data} />;
}
