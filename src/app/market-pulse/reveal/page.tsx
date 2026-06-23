import MarketPulseRevealExperience from "@/components/market-pulse/MarketPulseRevealExperience";
import { getMarketPulseRevealPageData } from "@/lib/market-pulse/reveal-data";

export const metadata = {
  title: "PPA Insight Reveal | Market Pulse",
  description:
    "View your Market Pulse challenge results, PPA Insight signals, and score breakdown.",
};

export default async function MarketPulseRevealPage() {
  const data = await getMarketPulseRevealPageData();

  return <MarketPulseRevealExperience data={data} />;
}
