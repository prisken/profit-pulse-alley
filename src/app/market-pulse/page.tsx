import type { Metadata } from "next";

import MarketPulseHubPage from "@/components/market-pulse/MarketPulseHubPage";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { getMarketPulseHubPageData } from "@/lib/market-pulse/hub-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "mp.meta.hub.title"),
    description: translate(locale, "mp.meta.hub.description"),
  };
}

export default async function MarketPulsePage() {
  const data = await getMarketPulseHubPageData();

  return <MarketPulseHubPage data={data} />;
}
