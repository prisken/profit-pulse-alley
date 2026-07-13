import "server-only";

import { prisma } from "@/lib/prisma";

export async function countUserMarketPulseDecisions(userId: string): Promise<number> {
  return prisma.marketPulseDecision.count({
    where: { userId },
  });
}

export async function shouldShowLearningInterestPrompt(
  userId: string,
): Promise<boolean> {
  const [decisionCount, profile] = await Promise.all([
    countUserMarketPulseDecisions(userId),
    prisma.userAcquisitionProfile.findUnique({
      where: { userId },
      select: {
        learningInterestCapturedAt: true,
        learningInterestPromptDismissedAt: true,
      },
    }),
  ]);

  if (decisionCount < 1) {
    return false;
  }

  if (profile?.learningInterestCapturedAt || profile?.learningInterestPromptDismissedAt) {
    return false;
  }

  return true;
}

export async function shouldShowNextStepPreferencePrompt(
  userId: string,
): Promise<boolean> {
  const profile = await prisma.userAcquisitionProfile.findUnique({
    where: { userId },
    select: {
      nextStepCapturedAt: true,
      nextStepPromptDismissedAt: true,
    },
  });

  if (profile?.nextStepCapturedAt || profile?.nextStepPromptDismissedAt) {
    return false;
  }

  return true;
}
