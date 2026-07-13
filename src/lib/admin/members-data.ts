import "server-only";

import type {
  AdminMemberAcquisition,
  AdminMemberRow,
} from "@/lib/admin/members-types";
import { prisma } from "@/lib/prisma";

export type { AdminMemberAcquisition, AdminMemberRow } from "@/lib/admin/members-types";

function serializeAcquisition(
  profile:
    | {
        learningInterest: string | null;
        learningInterestCapturedAt: Date | null;
        learningInterestPromptDismissedAt: Date | null;
        nextStepPreference: string | null;
        nextStepCapturedAt: Date | null;
        nextStepPromptDismissedAt: Date | null;
      }
    | null
    | undefined,
): AdminMemberAcquisition | null {
  if (!profile) {
    return null;
  }

  return {
    learningInterest: profile.learningInterest,
    learningInterestCapturedAt:
      profile.learningInterestCapturedAt?.toISOString() ?? null,
    learningInterestPromptDismissedAt:
      profile.learningInterestPromptDismissedAt?.toISOString() ?? null,
    nextStepPreference: profile.nextStepPreference,
    nextStepCapturedAt: profile.nextStepCapturedAt?.toISOString() ?? null,
    nextStepPromptDismissedAt:
      profile.nextStepPromptDismissedAt?.toISOString() ?? null,
  };
}

export async function loadAdminMembers(): Promise<AdminMemberRow[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        acquisitionProfile: {
          select: {
            learningInterest: true,
            learningInterestCapturedAt: true,
            learningInterestPromptDismissedAt: true,
            nextStepPreference: true,
            nextStepCapturedAt: true,
            nextStepPromptDismissedAt: true,
          },
        },
        _count: {
          select: { gameScores: true },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      role: user.role,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      gameScoreCount: user._count.gameScores,
      acquisition: serializeAcquisition(user.acquisitionProfile),
    }));
  } catch (error) {
    console.error("[admin] Failed to load members:", error);
    return [];
  }
}
