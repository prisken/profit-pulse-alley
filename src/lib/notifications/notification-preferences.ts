import "server-only";

import type { UserNotificationPreference } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const NOTIFICATION_EMAIL_TYPES = [
  "welcome",
  "market_pulse_reminder",
  "market_pulse_reveal",
  "market_pulse_winner",
  "event_update",
  "learning_digest",
] as const;

export type NotificationEmailType = (typeof NOTIFICATION_EMAIL_TYPES)[number];

export type UpdateUserNotificationPreferenceInput = {
  marketPulseRemindersEnabled?: boolean;
  revealNotificationsEnabled?: boolean;
  eventUpdatesEnabled?: boolean;
  learningDigestEnabled?: boolean;
  /** Pass a Date to unsubscribe; pass null to clear unsubscribe. */
  unsubscribedAt?: Date | null;
};

export function isNotificationEmailType(
  value: string,
): value is NotificationEmailType {
  return (NOTIFICATION_EMAIL_TYPES as readonly string[]).includes(value);
}

export async function getOrCreateUserNotificationPreference(
  userId: string,
): Promise<UserNotificationPreference> {
  const existing = await prisma.userNotificationPreference.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.userNotificationPreference.create({
    data: { userId },
  });
}

export async function updateUserNotificationPreference(
  userId: string,
  input: UpdateUserNotificationPreferenceInput,
): Promise<UserNotificationPreference> {
  await getOrCreateUserNotificationPreference(userId);

  return prisma.userNotificationPreference.update({
    where: { userId },
    data: {
      ...(input.marketPulseRemindersEnabled !== undefined
        ? { marketPulseRemindersEnabled: input.marketPulseRemindersEnabled }
        : {}),
      ...(input.revealNotificationsEnabled !== undefined
        ? { revealNotificationsEnabled: input.revealNotificationsEnabled }
        : {}),
      ...(input.eventUpdatesEnabled !== undefined
        ? { eventUpdatesEnabled: input.eventUpdatesEnabled }
        : {}),
      ...(input.learningDigestEnabled !== undefined
        ? { learningDigestEnabled: input.learningDigestEnabled }
        : {}),
      ...(input.unsubscribedAt !== undefined
        ? { unsubscribedAt: input.unsubscribedAt }
        : {}),
    },
  });
}

export async function isUserUnsubscribed(userId: string): Promise<boolean> {
  const preference = await getOrCreateUserNotificationPreference(userId);
  return preference.unsubscribedAt !== null;
}

/**
 * Whether product email of `type` may be sent for this user.
 * Winner mail is transactional (ignores marketing opt-outs / global unsubscribe)
 * but still requires a non-empty user email.
 */
export async function canSendEmailType(
  userId: string,
  type: NotificationEmailType,
): Promise<boolean> {
  if (type === "market_pulse_winner") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return Boolean(user?.email?.trim());
  }

  const preference = await getOrCreateUserNotificationPreference(userId);

  if (preference.unsubscribedAt !== null) {
    return false;
  }

  switch (type) {
    case "welcome":
      return true;
    case "market_pulse_reminder":
      return preference.marketPulseRemindersEnabled;
    case "market_pulse_reveal":
      return preference.revealNotificationsEnabled;
    case "event_update":
      return preference.eventUpdatesEnabled;
    case "learning_digest":
      return preference.learningDigestEnabled;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
