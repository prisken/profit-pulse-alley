"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  isValidLearningInterest,
  isValidNextStepPreference,
} from "@/lib/acquisition/constants";
import { prisma } from "@/lib/prisma";

export type SaveLearningInterestResult =
  | { success: true }
  | { success: false; error: string };

export type DismissLearningInterestPromptResult =
  | { success: true }
  | { success: false; error: string };

export async function saveLearningInterestAction(
  learningInterest: string,
): Promise<SaveLearningInterestResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Sign in required." };
  }

  if (!isValidLearningInterest(learningInterest)) {
    return { success: false, error: "Invalid learning interest." };
  }

  const now = new Date();

  await prisma.userAcquisitionProfile.upsert({
    where: { userId },
    create: {
      userId,
      learningInterest,
      learningInterestCapturedAt: now,
    },
    update: {
      learningInterest,
      learningInterestCapturedAt: now,
    },
  });

  revalidatePath("/market-pulse/play");

  return { success: true };
}

export async function dismissLearningInterestPromptAction(): Promise<DismissLearningInterestPromptResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Sign in required." };
  }

  const now = new Date();

  await prisma.userAcquisitionProfile.upsert({
    where: { userId },
    create: {
      userId,
      learningInterestPromptDismissedAt: now,
    },
    update: {
      learningInterestPromptDismissedAt: now,
    },
  });

  revalidatePath("/market-pulse/play");

  return { success: true };
}

export type SaveNextStepPreferenceResult =
  | { success: true }
  | { success: false; error: string };

export type DismissNextStepPreferencePromptResult =
  | { success: true }
  | { success: false; error: string };

export async function saveNextStepPreferenceAction(
  nextStepPreference: string,
): Promise<SaveNextStepPreferenceResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Sign in required." };
  }

  if (!isValidNextStepPreference(nextStepPreference)) {
    return { success: false, error: "Invalid next-step preference." };
  }

  const now = new Date();

  await prisma.userAcquisitionProfile.upsert({
    where: { userId },
    create: {
      userId,
      nextStepPreference,
      nextStepCapturedAt: now,
    },
    update: {
      nextStepPreference,
      nextStepCapturedAt: now,
    },
  });

  revalidatePath("/market-pulse/reveal");

  return { success: true };
}

export async function dismissNextStepPreferencePromptAction(): Promise<DismissNextStepPreferencePromptResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Sign in required." };
  }

  const now = new Date();

  await prisma.userAcquisitionProfile.upsert({
    where: { userId },
    create: {
      userId,
      nextStepPromptDismissedAt: now,
    },
    update: {
      nextStepPromptDismissedAt: now,
    },
  });

  revalidatePath("/market-pulse/reveal");

  return { success: true };
}
