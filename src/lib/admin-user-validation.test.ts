import { describe, expect, it } from "vitest";

import {
  getDeleteUserBlockReason,
  getRoleChangeBlockReason,
  isValidAdminUserEmail,
  validateAdminCreateUserInput,
} from "@/lib/admin-user-validation";

describe("isValidAdminUserEmail", () => {
  it("accepts normalized valid emails", () => {
    expect(isValidAdminUserEmail("  Admin@Example.COM ")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidAdminUserEmail("not-an-email")).toBe(false);
    expect(isValidAdminUserEmail("")).toBe(false);
  });
});

describe("validateAdminCreateUserInput", () => {
  it("requires a valid email", () => {
    const result = validateAdminCreateUserInput({
      email: "bad",
      name: "",
      contactNumber: "",
      role: "USER",
      password: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it("validates optional password length", () => {
    const result = validateAdminCreateUserInput({
      email: "user@example.com",
      name: "",
      contactNumber: "",
      role: "USER",
      password: "short",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toMatch(/8 characters/i);
  });

  it("allows empty password for OAuth-ready users", () => {
    const result = validateAdminCreateUserInput({
      email: "user@example.com",
      name: "Demo",
      contactNumber: "+85212345678",
      role: "ADMIN",
      password: "",
    });
    expect(result.valid).toBe(true);
    expect(result.normalized.email).toBe("user@example.com");
  });
});

describe("getDeleteUserBlockReason", () => {
  it("blocks self-delete", () => {
    expect(
      getDeleteUserBlockReason({
        actorUserId: "admin-1",
        targetUserId: "admin-1",
      }),
    ).toMatch(/cannot delete your own account/i);
  });
});

describe("getRoleChangeBlockReason", () => {
  it("blocks demoting the last admin", () => {
    expect(
      getRoleChangeBlockReason({
        actorUserId: "admin-1",
        targetUserId: "admin-2",
        currentRole: "ADMIN",
        newRole: "USER",
        adminCount: 1,
      }),
    ).toMatch(/last admin/i);
  });

  it("blocks self-demotion even when other admins exist", () => {
    expect(
      getRoleChangeBlockReason({
        actorUserId: "admin-1",
        targetUserId: "admin-1",
        currentRole: "ADMIN",
        newRole: "USER",
        adminCount: 3,
      }),
    ).toMatch(/cannot demote your own admin account/i);
  });

  it("allows promoting a user to admin", () => {
    expect(
      getRoleChangeBlockReason({
        actorUserId: "admin-1",
        targetUserId: "user-1",
        currentRole: "USER",
        newRole: "ADMIN",
        adminCount: 2,
      }),
    ).toBeNull();
  });
});
