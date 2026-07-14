import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  hash: vi.fn(async () => "hashed-password"),
  syncMemberSignupToCrm: vi.fn(),
  sendWelcomeEmailForNewUser: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
  signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mocks.hash,
  },
}));

vi.mock("@/lib/crm-member-sync", () => ({
  syncMemberSignupToCrm: mocks.syncMemberSignupToCrm,
}));

vi.mock("@/lib/notifications/welcome-email", () => ({
  sendWelcomeEmailForNewUser: mocks.sendWelcomeEmailForNewUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { signUpWithPassword } from "@/lib/auth-actions";

describe("signUpWithPassword welcome email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({
      id: "user-new",
      email: "new@example.com",
      name: "New Member",
      contactNumber: null,
      role: "USER",
      createdAt: new Date("2026-07-14T00:00:00.000Z"),
    });
    mocks.syncMemberSignupToCrm.mockResolvedValue(undefined);
    mocks.sendWelcomeEmailForNewUser.mockResolvedValue({ ok: true });
  });

  it("sends a welcome email after successful credentials signup", async () => {
    const result = await signUpWithPassword({
      name: "New Member",
      email: "new@example.com",
      password: "password123",
      contactNumber: "",
    });

    expect(result.success).toBe(true);
    expect(mocks.sendWelcomeEmailForNewUser).toHaveBeenCalledWith({
      userId: "user-new",
      email: "new@example.com",
      name: "New Member",
    });
  });

  it("still returns signup success when welcome email sending fails", async () => {
    mocks.sendWelcomeEmailForNewUser.mockRejectedValue(
      new Error("smtp down"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signUpWithPassword({
      name: "New Member",
      email: "new@example.com",
      password: "password123",
      contactNumber: "",
    });

    expect(result).toEqual({
      success: true,
      message: "Account created successfully. You can sign in now.",
    });
    expect(mocks.create).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("still returns signup success when welcome email is skipped (SMTP unset)", async () => {
    mocks.sendWelcomeEmailForNewUser.mockResolvedValue({
      ok: false,
      skipped: true,
      reason: "delivery_skipped",
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    });

    const result = await signUpWithPassword({
      name: "New Member",
      email: "new@example.com",
      password: "password123",
      contactNumber: "",
    });

    expect(result.success).toBe(true);
  });
});
