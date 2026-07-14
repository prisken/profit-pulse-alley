import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  preferenceFindUnique: vi.fn(),
  preferenceCreate: vi.fn(),
  preferenceUpdate: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userNotificationPreference: {
      findUnique: mocks.preferenceFindUnique,
      create: mocks.preferenceCreate,
      update: mocks.preferenceUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import {
  canSendEmailType,
  getOrCreateUserNotificationPreference,
  isUserUnsubscribed,
  updateUserNotificationPreference,
} from "@/lib/notifications/notification-preferences";

function preference(
  overrides: Partial<{
    id: string;
    userId: string;
    marketPulseRemindersEnabled: boolean;
    revealNotificationsEnabled: boolean;
    eventUpdatesEnabled: boolean;
    learningDigestEnabled: boolean;
    unsubscribedAt: Date | null;
  }> = {},
) {
  return {
    id: overrides.id ?? "pref-1",
    userId: overrides.userId ?? "user-1",
    marketPulseRemindersEnabled: overrides.marketPulseRemindersEnabled ?? false,
    revealNotificationsEnabled: overrides.revealNotificationsEnabled ?? true,
    eventUpdatesEnabled: overrides.eventUpdatesEnabled ?? false,
    learningDigestEnabled: overrides.learningDigestEnabled ?? false,
    unsubscribedAt: overrides.unsubscribedAt ?? null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
}

describe("notification-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a preference with reminders default false and reveal default true", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(null);
    mocks.preferenceCreate.mockResolvedValue(preference());

    const created = await getOrCreateUserNotificationPreference("user-1");

    expect(mocks.preferenceCreate).toHaveBeenCalledWith({
      data: { userId: "user-1" },
    });
    expect(created.marketPulseRemindersEnabled).toBe(false);
    expect(created.revealNotificationsEnabled).toBe(true);
    expect(created.eventUpdatesEnabled).toBe(false);
    expect(created.learningDigestEnabled).toBe(false);
    expect(created.unsubscribedAt).toBeNull();
  });

  it("returns existing preference without creating again", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(preference());

    await getOrCreateUserNotificationPreference("user-1");

    expect(mocks.preferenceCreate).not.toHaveBeenCalled();
  });

  it("updates preference fields", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(preference());
    mocks.preferenceUpdate.mockResolvedValue(
      preference({ marketPulseRemindersEnabled: true }),
    );

    const updated = await updateUserNotificationPreference("user-1", {
      marketPulseRemindersEnabled: true,
    });

    expect(mocks.preferenceUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { marketPulseRemindersEnabled: true },
    });
    expect(updated.marketPulseRemindersEnabled).toBe(true);
  });

  it("isUserUnsubscribed is true when unsubscribedAt is set", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(
      preference({ unsubscribedAt: new Date("2026-07-10T00:00:00.000Z") }),
    );

    await expect(isUserUnsubscribed("user-1")).resolves.toBe(true);
  });

  it("unsubscribe blocks non-transactional email types", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(
      preference({
        marketPulseRemindersEnabled: true,
        revealNotificationsEnabled: true,
        eventUpdatesEnabled: true,
        learningDigestEnabled: true,
        unsubscribedAt: new Date("2026-07-10T00:00:00.000Z"),
      }),
    );

    await expect(canSendEmailType("user-1", "welcome")).resolves.toBe(false);
    await expect(
      canSendEmailType("user-1", "market_pulse_reminder"),
    ).resolves.toBe(false);
    await expect(canSendEmailType("user-1", "market_pulse_reveal")).resolves.toBe(
      false,
    );
    await expect(canSendEmailType("user-1", "event_update")).resolves.toBe(false);
    await expect(canSendEmailType("user-1", "learning_digest")).resolves.toBe(
      false,
    );
  });

  it("reminder cannot send without opt-in", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(
      preference({ marketPulseRemindersEnabled: false }),
    );

    await expect(
      canSendEmailType("user-1", "market_pulse_reminder"),
    ).resolves.toBe(false);
  });

  it("reminder can send when opted in and not unsubscribed", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(
      preference({ marketPulseRemindersEnabled: true }),
    );

    await expect(
      canSendEmailType("user-1", "market_pulse_reminder"),
    ).resolves.toBe(true);
  });

  it("reveal can send with default preference", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(preference());

    await expect(canSendEmailType("user-1", "market_pulse_reveal")).resolves.toBe(
      true,
    );
  });

  it("welcome can send unless unsubscribed", async () => {
    mocks.preferenceFindUnique.mockResolvedValue(preference());

    await expect(canSendEmailType("user-1", "welcome")).resolves.toBe(true);
  });

  it("winner can send with marketing opt-outs when email exists", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "player@example.com",
    });
    mocks.preferenceFindUnique.mockResolvedValue(
      preference({
        marketPulseRemindersEnabled: false,
        revealNotificationsEnabled: false,
        eventUpdatesEnabled: false,
        learningDigestEnabled: false,
        unsubscribedAt: new Date("2026-07-10T00:00:00.000Z"),
      }),
    );

    await expect(canSendEmailType("user-1", "market_pulse_winner")).resolves.toBe(
      true,
    );
    expect(mocks.preferenceFindUnique).not.toHaveBeenCalled();
  });

  it("winner cannot send when email is missing", async () => {
    mocks.userFindUnique.mockResolvedValue({ email: "   " });

    await expect(canSendEmailType("user-1", "market_pulse_winner")).resolves.toBe(
      false,
    );
  });
});
