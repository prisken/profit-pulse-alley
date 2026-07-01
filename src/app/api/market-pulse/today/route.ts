import { auth } from "@/auth";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { handleGetMarketPulseToday } from "@/lib/market-pulse/player-handlers";
import {
  marketPulseErrorResponse,
  marketPulseJsonResponse,
} from "@/lib/market-pulse/route-utils";

// TODO: Add rate limiting when a shared limiter exists.

export async function GET() {
  const session = await auth();
  const locale = await getServerSiteLocale();
  const result = await handleGetMarketPulseToday(session?.user?.id, locale);

  if (!result.ok) {
    return marketPulseErrorResponse(result);
  }

  return marketPulseJsonResponse({ data: result.data });
}
