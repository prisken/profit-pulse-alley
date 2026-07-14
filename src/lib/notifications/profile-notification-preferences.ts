import "server-only";

import type { UserNotificationPreference } from "@prisma/client";

import { getOrCreateUserNotificationPreference } from "@/lib/notifications/notification-preferences";

export type ProfileNotificationPreferences = {
  marketPulseRemindersEnabled: boolean;
  revealNotificationsEnabled: boolean;
  eventUpdatesEnabled: boolean;
  learningDigestEnabled: boolean;
};

export function serializeNotificationPreferences(
  preference: Pick<
    UserNotificationPreference,
    | "marketPulseRemindersEnabled"
    | "revealNotificationsEnabled"
    | "eventUpdatesEnabled"
    | "learningDigestEnabled"
  >,
): ProfileNotificationPreferences {
  return {
    marketPulseRemindersEnabled: preference.marketPulseRemindersEnabled,
    revealNotificationsEnabled: preference.revealNotificationsEnabled,
    eventUpdatesEnabled: preference.eventUpdatesEnabled,
    learningDigestEnabled: preference.learningDigestEnabled,
  };
}

export const DEFAULT_PROFILE_NOTIFICATION_PREFERENCES: ProfileNotificationPreferences =
  {
    marketPulseRemindersEnabled: false,
    revealNotificationsEnabled: true,
    eventUpdatesEnabled: false,
    learningDigestEnabled: false,
  };

/** Loads (or creates) notification prefs for the signed-in profile page. */
export async function loadProfileNotificationPreferences(
  userId: string,
): Promise<ProfileNotificationPreferences> {
  const preference = await getOrCreateUserNotificationPreference(userId);
  return serializeNotificationPreferences(preference);
}
