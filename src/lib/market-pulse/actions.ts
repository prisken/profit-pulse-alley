"use server";

import { auth } from "@/auth";
import { getCurrentMarketPulseCycle } from "@/lib/market-pulse/challenge-cycle";
import {
  MAX_MARKET_PULSE_SCORE,
  MIN_MARKET_PULSE_SCORE,
} from "@/lib/market-pulse/score-limits";
import type {
  MarketPulseRunResult,
  SaveMarketPulseScoreResult,
} from "@/lib/market-pulse/types";
import { MARKET_PULSE_GAME_VERSION } from "@/lib/market-pulse/types";
import { prisma } from "@/lib/prisma";

function invalidScore(message = "Invalid score."): SaveMarketPulseScoreResult {
  return { saved: false, error: message };
}

export async function saveMarketPulseScore(
  score: MarketPulseRunResult["score"],
): Promise<SaveMarketPulseScoreResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { saved: false, error: "Sign in required to save your score." };
  }

  if (typeof score !== "number") {
    return invalidScore();
  }

  if (!Number.isFinite(score)) {
    return invalidScore();
  }

  const normalizedScore = Math.round(score);

  if (!Number.isInteger(normalizedScore)) {
    return invalidScore();
  }

  if (
    normalizedScore < MIN_MARKET_PULSE_SCORE ||
    normalizedScore > MAX_MARKET_PULSE_SCORE
  ) {
    return { saved: false, error: "Score is out of range." };
  }

  const { cycleId } = getCurrentMarketPulseCycle();

  try {
    await prisma.gameScore.create({
      data: {
        userId: session.user.id,
        score: normalizedScore,
        cycleId,
        gameVersion: MARKET_PULSE_GAME_VERSION,
      },
    });
    return { saved: true };
  } catch (error) {
    console.error("[market-pulse/actions] Failed to save score:", error);
    return { saved: false, error: "Unable to save score." };
  }
}
