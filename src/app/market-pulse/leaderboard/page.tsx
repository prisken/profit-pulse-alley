import type { Metadata } from "next";

import { auth } from "@/auth";
import MarketPulseLeaderboard from "@/components/market-pulse/MarketPulseLeaderboard";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { getMarketPulseLeaderboardPageData } from "@/lib/market-pulse/leaderboard-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "mp.meta.leaderboard.title"),
    description: translate(locale, "mp.meta.leaderboard.description"),
  };
}

export default async function MarketPulseLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cycleId?: string }>;
}) {
  const { cycleId } = await searchParams;
  const session = await auth();
  const locale = await getServerSiteLocale();
  const data = await getMarketPulseLeaderboardPageData(
    cycleId,
    session?.user?.id,
    locale,
  );

  return <MarketPulseLeaderboard data={data} />;
}
