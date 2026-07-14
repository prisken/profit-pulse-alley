import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  preferenceFindUnique: vi.fn(),
  preferenceCreate: vi.fn(),
  preferenceUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    userNotificationPreference: {
      findUnique: mocks.preferenceFindUnique,
      create: mocks.preferenceCreate,
      update: mocks.preferenceUpdate,
    },
  },
}));

import { createUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";
import { applyUnsubscribeFromToken } from "@/lib/notifications/unsubscribe";

describe("applyUnsubscribeFromToken", () => {
  const secretEnv = {
    ...process.env,
    EMAIL_UNSUBSCRIBE_SECRET: "test-secret",
  };
  const now = new Date("2026-07-14T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_UNSUBSCRIBE_SECRET = secretEnv.EMAIL_UNSUBSCRIBE_SECRET;
  });

  it("sets unsubscribedAt for a valid token", async () => {
    const token = createUnsubscribeToken(
      {
        userId: "user-1",
        email: "player@example.com",
        now,
      },
      secretEnv,
    );

    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
    });
    mocks.preferenceFindUnique.mockResolvedValue({
      id: "pref-1",
      userId: "user-1",
      unsubscribedAt: null,
      marketPulseRemindersEnabled: false,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
      createdAt: now,
      updatedAt: now,
    });
    mocks.preferenceUpdate.mockResolvedValue({});

    const result = await applyUnsubscribeFromToken(token, now);

    expect(result).toEqual({
      ok: true,
      userId: "user-1",
      alreadyUnsubscribed: false,
    });
    expect(mocks.preferenceUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { unsubscribedAt: now },
    });
  });

  it("returns alreadyUnsubscribed when preference is already set", async () => {
    const token = createUnsubscribeToken(
      {
        userId: "user-1",
        email: "player@example.com",
        now,
      },
      secretEnv,
    );

    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
    });
    mocks.preferenceFindUnique.mockResolvedValue({
      id: "pref-1",
      userId: "user-1",
      unsubscribedAt: new Date("2026-07-01T00:00:00.000Z"),
      marketPulseRemindersEnabled: false,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    const result = await applyUnsubscribeFromToken(token, now);

    expect(result).toEqual({
      ok: true,
      userId: "user-1",
      alreadyUnsubscribed: true,
    });
    expect(mocks.preferenceUpdate).not.toHaveBeenCalled();
  });

  it("rejects expired tokens without mutating preferences", async () => {
    const token = createUnsubscribeToken(
      {
        userId: "user-1",
        email: "player@example.com",
        now,
        ttlMs: 1_000,
      },
      secretEnv,
    );

    const result = await applyUnsubscribeFromToken(
      token,
      new Date(now.getTime() + 60_000),
    );

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects tokens when the account email hash no longer matches", async () => {
    const token = createUnsubscribeToken(
      {
        userId: "user-1",
        email: "old@example.com",
        now,
      },
      secretEnv,
    );

    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
    });

    const result = await applyUnsubscribeFromToken(token, now);

    expect(result).toEqual({ ok: false, reason: "email_mismatch" });
    expect(mocks.preferenceUpdate).not.toHaveBeenCalled();
  });
});
