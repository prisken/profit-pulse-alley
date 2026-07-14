import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  updateUserNotificationPreference: vi.fn(),
  getOrCreateUserNotificationPreference: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/notifications/notification-preferences", () => ({
  updateUserNotificationPreference: mocks.updateUserNotificationPreference,
  getOrCreateUserNotificationPreference:
    mocks.getOrCreateUserNotificationPreference,
}));

import {
  enableMarketPulseRemindersAction,
  updateNotificationPreferencesAction,
} from "@/lib/notifications/actions";
import {
  DEFAULT_PROFILE_NOTIFICATION_PREFERENCES,
  loadProfileNotificationPreferences,
  serializeNotificationPreferences,
} from "@/lib/notifications/profile-notification-preferences";

describe("updateNotificationPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects guests", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await updateNotificationPreferencesAction({
      marketPulseRemindersEnabled: true,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to continue.",
    });
    expect(mocks.updateUserNotificationPreference).not.toHaveBeenCalled();
  });

  it("updates preferences for the authenticated user only", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-session-1" } });
    mocks.updateUserNotificationPreference.mockResolvedValue({
      id: "pref-1",
      userId: "user-session-1",
      marketPulseRemindersEnabled: true,
      revealNotificationsEnabled: false,
      eventUpdatesEnabled: true,
      learningDigestEnabled: false,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateNotificationPreferencesAction({
      marketPulseRemindersEnabled: true,
      revealNotificationsEnabled: false,
      eventUpdatesEnabled: true,
      learningDigestEnabled: false,
    });

    expect(mocks.updateUserNotificationPreference).toHaveBeenCalledWith(
      "user-session-1",
      {
        marketPulseRemindersEnabled: true,
        revealNotificationsEnabled: false,
        eventUpdatesEnabled: true,
        learningDigestEnabled: false,
      },
    );
    expect(result).toEqual({
      success: true,
      preferences: {
        marketPulseRemindersEnabled: true,
        revealNotificationsEnabled: false,
        eventUpdatesEnabled: true,
        learningDigestEnabled: false,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/market-pulse/play");
  });

  it("rejects non-boolean preference payloads", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateNotificationPreferencesAction({
      // @ts-expect-error intentional invalid input for runtime guard
      marketPulseRemindersEnabled: "yes",
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
    });

    expect(result.success).toBe(false);
    expect(mocks.updateUserNotificationPreference).not.toHaveBeenCalled();
  });
});

describe("enableMarketPulseRemindersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects guests", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await enableMarketPulseRemindersAction();

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to continue.",
    });
    expect(mocks.updateUserNotificationPreference).not.toHaveBeenCalled();
  });

  it("enables marketPulseRemindersEnabled for the authenticated user only", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-session-2" } });
    mocks.updateUserNotificationPreference.mockResolvedValue({
      id: "pref-2",
      userId: "user-session-2",
      marketPulseRemindersEnabled: true,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await enableMarketPulseRemindersAction();

    expect(mocks.updateUserNotificationPreference).toHaveBeenCalledWith(
      "user-session-2",
      { marketPulseRemindersEnabled: true },
    );
    expect(result).toEqual({
      success: true,
      preferences: {
        marketPulseRemindersEnabled: true,
        revealNotificationsEnabled: true,
        eventUpdatesEnabled: false,
        learningDigestEnabled: false,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/market-pulse/play");
  });
});

describe("profile notification preference loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes default reminder opt-in as false and reveal as true", () => {
    expect(
      DEFAULT_PROFILE_NOTIFICATION_PREFERENCES.marketPulseRemindersEnabled,
    ).toBe(false);
    expect(
      DEFAULT_PROFILE_NOTIFICATION_PREFERENCES.revealNotificationsEnabled,
    ).toBe(true);
  });

  it("serializes preference fields for the profile page", () => {
    expect(
      serializeNotificationPreferences({
        marketPulseRemindersEnabled: false,
        revealNotificationsEnabled: true,
        eventUpdatesEnabled: false,
        learningDigestEnabled: false,
      }),
    ).toEqual(DEFAULT_PROFILE_NOTIFICATION_PREFERENCES);
  });

  it("loads preferences for the profile page", async () => {
    mocks.getOrCreateUserNotificationPreference.mockResolvedValue({
      id: "pref-1",
      userId: "user-1",
      marketPulseRemindersEnabled: false,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(loadProfileNotificationPreferences("user-1")).resolves.toEqual(
      {
        marketPulseRemindersEnabled: false,
        revealNotificationsEnabled: true,
        eventUpdatesEnabled: false,
        learningDigestEnabled: false,
      },
    );
    expect(mocks.getOrCreateUserNotificationPreference).toHaveBeenCalledWith(
      "user-1",
    );
  });
});
