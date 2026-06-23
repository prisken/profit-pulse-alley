import "server-only";

import type { MarketPulseLeaderboardType } from "@prisma/client";

import type { MarketPulseRequestMeta } from "@/lib/market-pulse/request-meta";
import { stripPpaFromCardPayload } from "@/lib/market-pulse/swipe-card";
import {
  getMarketPulseLeaderboard,
  getMarketPulseRevealForUser,
  getTodayMarketPulseCardForUser,
  submitMarketPulseDecision,
  type MarketPulseLeaderboardRow,
  type MarketPulseRevealForUser,
  type TodayMarketPulseCardForUser,
} from "@/lib/market-pulse/server";

export type MarketPulsePlayerErrorCode =
  | "UNAUTHENTICATED"
  | "GAME_CLOSED"
  | "CARD_UNAVAILABLE"
  | "ALREADY_SUBMITTED"
  | "INVALID_DECISION"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type MarketPulsePlayerError = {
  ok: false;
  code: MarketPulsePlayerErrorCode;
  error: string;
};

export type SubmitMarketPulseDecisionActionInput = {
  cardId: string;
  decision: string;
};

export type SubmitMarketPulseDecisionActionSuccess = {
  ok: true;
  alreadySubmitted: boolean;
  decision: {
    id: string;
    decision: string;
    decidedAt: string;
  };
};

export type SubmitMarketPulseDecisionActionResult =
  | SubmitMarketPulseDecisionActionSuccess
  | MarketPulsePlayerError;

export type GetMarketPulseLeaderboardActionInput = {
  mode?: string | null;
  cycleId?: string | null;
  limit?: number;
};

export type GetMarketPulseLeaderboardActionResult =
  | {
      ok: true;
      mode: MarketPulseLeaderboardType;
      entries: MarketPulseLeaderboardRow[];
    }
  | MarketPulsePlayerError;

export type GetMarketPulseTodayResult =
  | { ok: true; data: TodayMarketPulseCardForUser }
  | MarketPulsePlayerError;

export type GetMarketPulseRevealResult =
  | { ok: true; data: MarketPulseRevealForUser }
  | MarketPulsePlayerError;

function mapSubmitError(error: string): MarketPulsePlayerError {
  const normalized = error.toLowerCase();

  if (normalized.includes("decision must be bullish or cautious")) {
    return {
      ok: false,
      code: "INVALID_DECISION",
      error,
    };
  }

  if (
    normalized.includes("not open") ||
    normalized.includes("not open for decisions")
  ) {
    return {
      ok: false,
      code: "GAME_CLOSED",
      error,
    };
  }

  if (normalized.includes("already submitted")) {
    return {
      ok: false,
      code: "ALREADY_SUBMITTED",
      error,
    };
  }

  if (
    normalized.includes("card not found") ||
    normalized.includes("not published") ||
    normalized.includes("not yet available") ||
    normalized.includes("not ready") ||
    normalized.includes("not part of the active challenge") ||
    normalized.includes("not available for decisions right now") ||
    normalized.includes("has not started yet") ||
    normalized.includes("window for this card has closed")
  ) {
    return {
      ok: false,
      code: "CARD_UNAVAILABLE",
      error,
    };
  }

  if (normalized.includes("invalid user")) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error,
    };
  }

  return {
    ok: false,
    code: "INTERNAL_ERROR",
    error,
  };
}

export function parseLeaderboardMode(
  value: string | null | undefined,
): MarketPulseLeaderboardType {
  switch (value?.trim().toLowerCase()) {
    case "monthly":
      return "MONTHLY";
    case "all-time":
    case "all_time":
      return "ALL_TIME";
    case "current-cycle":
    case "current_cycle":
    default:
      return "CURRENT_CYCLE";
  }
}

export async function handleGetMarketPulseToday(
  userId: string | undefined,
): Promise<GetMarketPulseTodayResult> {
  if (!userId) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Sign in required.",
    };
  }

  const data = await getTodayMarketPulseCardForUser(userId);

  if (!data) {
    return {
      ok: false,
      code: "CARD_UNAVAILABLE",
      error: "No playable card is available right now.",
    };
  }

  return {
    ok: true,
    data: {
      ...data,
      card: stripPpaFromCardPayload(data.card),
    },
  };
}

export async function handleSubmitMarketPulseDecision(
  userId: string | undefined,
  input: SubmitMarketPulseDecisionActionInput,
  meta: MarketPulseRequestMeta,
): Promise<SubmitMarketPulseDecisionActionResult> {
  if (!userId) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Sign in required.",
    };
  }

  const cardId = input.cardId?.trim();
  if (!cardId) {
    return {
      ok: false,
      code: "CARD_UNAVAILABLE",
      error: "cardId is required.",
    };
  }

  const result = await submitMarketPulseDecision({
    userId,
    cardId,
    decision: input.decision,
    ipHash: meta.ipHash,
    userAgentHash: meta.userAgentHash,
  });

  if (!result.ok) {
    return mapSubmitError(result.error);
  }

  if (result.alreadySubmitted) {
    return {
      ok: false,
      code: "ALREADY_SUBMITTED",
      error: "You have already submitted a decision for this card.",
    };
  }

  return {
    ok: true,
    alreadySubmitted: false,
    decision: {
      id: result.decision.id,
      decision: result.decision.decision,
      decidedAt: result.decision.decidedAt.toISOString(),
    },
  };
}

export async function handleGetMarketPulseLeaderboard(
  input: GetMarketPulseLeaderboardActionInput = {},
): Promise<GetMarketPulseLeaderboardActionResult> {
  const mode = parseLeaderboardMode(input.mode);
  const limit =
    typeof input.limit === "number" && input.limit > 0
      ? Math.min(input.limit, 100)
      : 10;

  try {
    const entries = await getMarketPulseLeaderboard({
      mode,
      cycleId: input.cycleId ?? null,
      limit,
    });

    return { ok: true, mode, entries };
  } catch (error) {
    console.error("[market-pulse] Leaderboard failed:", error);
    return { ok: true, mode, entries: [] };
  }
}

export async function handleGetMarketPulseReveal(
  userId: string | undefined,
  cycleId: string | null | undefined,
): Promise<GetMarketPulseRevealResult> {
  if (!userId) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Sign in required.",
    };
  }

  const normalizedCycleId = cycleId?.trim();
  if (!normalizedCycleId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "cycleId is required.",
    };
  }

  const data = await getMarketPulseRevealForUser(userId, normalizedCycleId);

  if (!data) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Cycle not found.",
    };
  }

  if (!data.isRevealed) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Results are not available until the cycle is revealed.",
    };
  }

  return { ok: true, data };
}

export function marketPulseErrorStatus(
  code: MarketPulsePlayerErrorCode,
): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "GAME_CLOSED":
      return 403;
    case "CARD_UNAVAILABLE":
      return 404;
    case "ALREADY_SUBMITTED":
      return 409;
    case "INVALID_DECISION":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
