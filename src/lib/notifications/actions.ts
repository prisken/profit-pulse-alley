"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { updateUserNotificationPreference } from "@/lib/notifications/notification-preferences";
import { serializeNotificationPreferences } from "@/lib/notifications/profile-notification-preferences";
import type { ProfileNotificationPreferences } from "@/lib/notifications/profile-notification-preferences";

export type UpdateNotificationPreferencesInput = {
  marketPulseRemindersEnabled: boolean;
  revealNotificationsEnabled: boolean;
  eventUpdatesEnabled: boolean;
  learningDigestEnabled: boolean;
};

export type UpdateNotificationPreferencesResult =
  | { success: true; preferences: ProfileNotificationPreferences }
  | { success: false; error: string };

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export async function updateNotificationPreferencesAction(
  input: UpdateNotificationPreferencesInput,
): Promise<UpdateNotificationPreferencesResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to continue." };
  }

  const marketPulseRemindersEnabled = asBoolean(
    input.marketPulseRemindersEnabled,
  );
  const revealNotificationsEnabled = asBoolean(
    input.revealNotificationsEnabled,
  );
  const eventUpdatesEnabled = asBoolean(input.eventUpdatesEnabled);
  const learningDigestEnabled = asBoolean(input.learningDigestEnabled);

  if (
    marketPulseRemindersEnabled === null ||
    revealNotificationsEnabled === null ||
    eventUpdatesEnabled === null ||
    learningDigestEnabled === null
  ) {
    return { success: false, error: "Invalid notification preferences." };
  }

  try {
    // Always scoped to the authenticated user — never trusts a client userId.
    const updated = await updateUserNotificationPreference(session.user.id, {
      marketPulseRemindersEnabled,
      revealNotificationsEnabled,
      eventUpdatesEnabled,
      learningDigestEnabled,
    });

    revalidatePath("/profile");
    revalidatePath("/market-pulse/play");

    return {
      success: true,
      preferences: serializeNotificationPreferences(updated),
    };
  } catch (error) {
    console.error(
      "[notifications] updateNotificationPreferencesAction failed:",
      error,
    );
    return {
      success: false,
      error: "Could not save your email preferences. Please try again.",
    };
  }
}

/**
 * Explicit opt-in for Market Pulse game reminders (opt-in only; no email sent here).
 */
export async function enableMarketPulseRemindersAction(): Promise<UpdateNotificationPreferencesResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to continue." };
  }

  try {
    const updated = await updateUserNotificationPreference(session.user.id, {
      marketPulseRemindersEnabled: true,
    });

    revalidatePath("/profile");
    revalidatePath("/market-pulse/play");

    return {
      success: true,
      preferences: serializeNotificationPreferences(updated),
    };
  } catch (error) {
    console.error(
      "[notifications] enableMarketPulseRemindersAction failed:",
      error,
    );
    return {
      success: false,
      error: "Could not save your email preferences. Please try again.",
    };
  }
}
