import { auth } from "@/auth";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { handleGetMarketPulseReveal } from "@/lib/market-pulse/player-handlers";
import {
  marketPulseErrorResponse,
  marketPulseJsonResponse,
} from "@/lib/market-pulse/route-utils";

export async function GET(request: Request) {
  const session = await auth();
  const locale = await getServerSiteLocale();
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  const result = await handleGetMarketPulseReveal(
    session?.user?.id,
    cycleId,
    locale,
  );

  if (!result.ok) {
    return marketPulseErrorResponse(result);
  }

  return marketPulseJsonResponse({ data: result.data });
}
