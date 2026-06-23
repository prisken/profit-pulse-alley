"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SaveGameScoreResult = {
  saved: boolean;
};

export async function saveGameScore(
  score: number,
): Promise<SaveGameScoreResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { saved: false };
  }

  if (!Number.isFinite(score)) {
    return { saved: false };
  }

  const normalizedScore = Math.round(score);

  try {
    await prisma.gameScore.create({
      data: {
        userId: session.user.id,
        score: normalizedScore,
      },
    });
    return { saved: true };
  } catch (error) {
    console.error("[game-actions] Failed to save score:", error);
    return { saved: false };
  }
}
