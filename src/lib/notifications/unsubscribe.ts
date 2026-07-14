import "server-only";

import {
  hashEmailForUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/notifications/unsubscribe-token";
import { getOrCreateUserNotificationPreference } from "@/lib/notifications/notification-preferences";
import { prisma } from "@/lib/prisma";

export type ApplyUnsubscribeResult =
  | { ok: true; userId: string; alreadyUnsubscribed: boolean }
  | {
      ok: false;
      reason:
        | "missing_token"
        | "missing_secret"
        | "malformed"
        | "bad_signature"
        | "expired"
        | "invalid_payload"
        | "user_not_found"
        | "email_mismatch";
    };

/**
 * Verifies a signed unsubscribe token and sets unsubscribedAt.
 * Transactional emails (e.g. prize notices) ignore unsubscribedAt via canSendEmailType.
 */
export async function applyUnsubscribeFromToken(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<ApplyUnsubscribeResult> {
  if (!token?.trim()) {
    return { ok: false, reason: "missing_token" };
  }

  const verified = verifyUnsubscribeToken(token, process.env, now);
  if (!verified.ok) {
    return { ok: false, reason: verified.reason };
  }

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: false, reason: "user_not_found" };
  }

  if (hashEmailForUnsubscribeToken(user.email) !== verified.emailHash) {
    return { ok: false, reason: "email_mismatch" };
  }

  const preference = await getOrCreateUserNotificationPreference(user.id);
  if (preference.unsubscribedAt) {
    return { ok: true, userId: user.id, alreadyUnsubscribed: true };
  }

  await prisma.userNotificationPreference.update({
    where: { userId: user.id },
    data: { unsubscribedAt: now },
  });

  return { ok: true, userId: user.id, alreadyUnsubscribed: false };
}
