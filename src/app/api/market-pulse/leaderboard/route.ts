import { handleGetMarketPulseLeaderboard } from "@/lib/market-pulse/player-handlers";
import {
  marketPulseErrorResponse,
  marketPulseJsonResponse,
} from "@/lib/market-pulse/route-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const cycleId = searchParams.get("cycleId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const result = await handleGetMarketPulseLeaderboard({
    mode,
    cycleId,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  if (!result.ok) {
    return marketPulseErrorResponse(result);
  }

  return marketPulseJsonResponse({
    mode: result.mode,
    entries: result.entries,
  });
}
