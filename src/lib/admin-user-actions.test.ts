import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userDelete: vi.fn(),
  userCount: vi.fn(),
  transaction: vi.fn(),
  auditCreate: vi.fn(),
  emailDeliveryLogCreate: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const emailMocks = vi.hoisted(() => ({
  sendProductEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async () => "hashed"),
  },
}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/email/email-sender", () => ({
  sendProductEmail: emailMocks.sendProductEmail,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: prismaMocks.userFindUnique,
      create: prismaMocks.userCreate,
      update: prismaMocks.userUpdate,
      delete: prismaMocks.userDelete,
      count: prismaMocks.userCount,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
    emailDeliveryLog: {
      create: prismaMocks.emailDeliveryLogCreate,
    },
    $transaction: prismaMocks.transaction,
  },
}));

import {
  createAdminUserAction,
  deleteAdminUserAction,
  sendAdminTestEmailAction,
  updateAdminUserRoleAction,
} from "@/lib/admin-user-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

describe("admin-user-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          delete: prismaMocks.userDelete,
        },
      }),
    );
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    prismaMocks.emailDeliveryLogCreate.mockResolvedValue({ id: "log-1" });
    emailMocks.sendProductEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "<test@zoho>",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok true when user role is updated", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    prismaMocks.userCount.mockResolvedValue(2);
    prismaMocks.userUpdate.mockResolvedValue({ id: "user-1", role: "ADMIN" });

    const result = await updateAdminUserRoleAction("user-1", "ADMIN");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("User role updated.");
    }
    expect(prismaMocks.userUpdate).toHaveBeenCalledTimes(1);
  });

  it("returns ok false when self-delete is blocked", async () => {
    const result = await deleteAdminUserAction("admin-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/cannot delete your own account/i);
    }
    expect(prismaMocks.userDelete).not.toHaveBeenCalled();
  });

  it("returns ok false when demoting the last admin", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "admin-2",
      email: "other@example.com",
      role: "ADMIN",
    });
    prismaMocks.userCount.mockResolvedValue(1);

    const result = await updateAdminUserRoleAction("admin-2", "USER");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/last admin/i);
    }
    expect(prismaMocks.userUpdate).not.toHaveBeenCalled();
  });

  it("returns ok true when user is created even if audit log fails", async () => {
    prismaMocks.userFindUnique.mockResolvedValue(null);
    prismaMocks.userCreate.mockResolvedValue({
      id: "user-new",
      email: "new@example.com",
      role: "USER",
    });
    prismaMocks.auditCreate.mockRejectedValue(new Error("audit failed"));

    const result = await createAdminUserAction({
      email: "new@example.com",
      role: "USER",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("User added.");
      expect(result.warning).toContain("audit log");
    }
    expect(prismaMocks.userCreate).toHaveBeenCalledTimes(1);
  });

  it("returns ok true when user is deleted even if audit log fails", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-2",
      email: "gone@example.com",
      role: "USER",
    });
    prismaMocks.userDelete.mockResolvedValue({ id: "user-2" });
    prismaMocks.auditCreate.mockRejectedValue(new Error("audit failed"));

    const result = await deleteAdminUserAction("user-2");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("User deleted.");
      expect(result.warning).toContain("audit log");
    }
    expect(prismaMocks.userDelete).toHaveBeenCalledTimes(1);
  });

  it("sends a test email and writes a delivery log", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
    });

    const result = await sendAdminTestEmailAction("user-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("Test email sent.");
    }
    expect(emailMocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@example.com",
        subject: expect.stringContaining("Admin email delivery test"),
      }),
    );
    expect(prismaMocks.emailDeliveryLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          email: "player@example.com",
          type: "admin_test",
          status: "sent",
          providerMessageId: "<test@zoho>",
        }),
      }),
    );
  });

  it("returns a clear error when SMTP is not configured", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
    });
    emailMocks.sendProductEmail.mockResolvedValue({
      ok: false,
      skipped: true,
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    });

    const result = await sendAdminTestEmailAction("user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/EMAIL_SERVER/i);
    }
    expect(prismaMocks.emailDeliveryLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "skipped",
        }),
      }),
    );
  });

  it("rejects unauthenticated callers for test email", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await sendAdminTestEmailAction("user-1");

    expect(result.ok).toBe(false);
    expect(emailMocks.sendProductEmail).not.toHaveBeenCalled();
  });
});
