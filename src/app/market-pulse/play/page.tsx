import type { Metadata } from "next";

import MarketPulsePlayExperience from "@/components/market-pulse/MarketPulsePlayExperience";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { getMarketPulsePlayPageData } from "@/lib/market-pulse/play-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "mp.meta.play.title"),
    description: translate(locale, "mp.meta.play.description"),
  };
}

export default async function MarketPulsePlayPage() {
  const locale = await getServerSiteLocale();
  const data = await getMarketPulsePlayPageData(locale);

  return <MarketPulsePlayExperience data={data} />;
}
