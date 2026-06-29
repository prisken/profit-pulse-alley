import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userDelete: vi.fn(),
  userCount: vi.fn(),
  transaction: vi.fn(),
  auditCreate: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
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
    $transaction: prismaMocks.transaction,
  },
}));

import {
  createAdminUserAction,
  deleteAdminUserAction,
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
});
