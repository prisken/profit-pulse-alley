"use server";

import { headers } from "next/headers";

import { auth } from "@/auth";
import {
  handleGetMarketPulseLeaderboard,
  handleSubmitMarketPulseDecision,
  type GetMarketPulseLeaderboardActionInput,
  type GetMarketPulseLeaderboardActionResult,
  type SubmitMarketPulseDecisionActionInput,
  type SubmitMarketPulseDecisionActionResult,
} from "@/lib/market-pulse/player-handlers";
import { getRequestMetaFromHeaders } from "@/lib/market-pulse/request-meta";

// TODO: Add rate limiting for decision submissions when a shared limiter exists.

export async function submitMarketPulseDecisionAction(
  input: SubmitMarketPulseDecisionActionInput,
): Promise<SubmitMarketPulseDecisionActionResult> {
  const session = await auth();
  const meta = getRequestMetaFromHeaders(await headers());

  return handleSubmitMarketPulseDecision(session?.user?.id, input, meta);
}

export async function getMarketPulseLeaderboardAction(
  input: GetMarketPulseLeaderboardActionInput = {},
): Promise<GetMarketPulseLeaderboardActionResult> {
  return handleGetMarketPulseLeaderboard(input);
}
