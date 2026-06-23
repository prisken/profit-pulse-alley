import MarketPulseHubPage from "@/components/market-pulse/MarketPulseHubPage";
import { getMarketPulseHubPageData } from "@/lib/market-pulse/hub-data";

export const metadata = {
  title: "Market Pulse | Profit Pulse Ally",
  description:
    "Read the signal. Make your call. Compare your market instinct with PPA Insight.",
};

export default async function MarketPulsePage() {
  const data = await getMarketPulseHubPageData();

  return <MarketPulseHubPage data={data} />;
}
