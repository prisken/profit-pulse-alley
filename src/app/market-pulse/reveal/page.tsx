import type { Metadata } from "next";

import MarketPulseRevealExperience from "@/components/market-pulse/MarketPulseRevealExperience";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { getMarketPulseRevealPageData } from "@/lib/market-pulse/reveal-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "mp.meta.reveal.title"),
    description: translate(locale, "mp.meta.reveal.description"),
  };
}

export default async function MarketPulseRevealPage() {
  const locale = await getServerSiteLocale();
  const data = await getMarketPulseRevealPageData(locale);

  return <MarketPulseRevealExperience data={data} />;
}
