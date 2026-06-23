import { auth } from "@/auth";
import { handleSubmitMarketPulseDecision } from "@/lib/market-pulse/player-handlers";
import { getRequestMetaFromHeaders } from "@/lib/market-pulse/request-meta";
import {
  marketPulseErrorResponse,
  marketPulseJsonResponse,
} from "@/lib/market-pulse/route-utils";

// TODO: Add rate limiting for POST /decision when a shared limiter exists.

type DecisionRequestBody = {
  cardId?: unknown;
  decision?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  let body: DecisionRequestBody;
  try {
    body = (await request.json()) as DecisionRequestBody;
  } catch {
    return marketPulseErrorResponse({
      ok: false,
      code: "INVALID_DECISION",
      error: "Invalid JSON body.",
    });
  }

  const cardId = typeof body.cardId === "string" ? body.cardId : "";
  const decision = typeof body.decision === "string" ? body.decision : "";

  const result = await handleSubmitMarketPulseDecision(
    session?.user?.id,
    { cardId, decision },
    getRequestMetaFromHeaders(request.headers),
  );

  if (!result.ok) {
    return marketPulseErrorResponse(result);
  }

  return marketPulseJsonResponse({
    alreadySubmitted: result.alreadySubmitted,
    decision: result.decision,
  });
}
