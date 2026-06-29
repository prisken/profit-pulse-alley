import type { Role } from "@prisma/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AdminCreateUserInput = {
  email: string;
  name: string;
  contactNumber: string;
  role: Role;
  password: string;
};

export type AdminCreateUserFieldErrors = Partial<
  Record<"email" | "name" | "password" | "role" | "global", string>
>;

export function normalizeAdminUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAdminUserEmail(email: string): boolean {
  const normalized = normalizeAdminUserEmail(email);
  return normalized.length > 0 && EMAIL_PATTERN.test(normalized);
}

export function validateAdminCreateUserInput(
  input: AdminCreateUserInput,
): { valid: boolean; errors: AdminCreateUserFieldErrors; normalized: AdminCreateUserInput } {
  const errors: AdminCreateUserFieldErrors = {};
  const email = normalizeAdminUserEmail(input.email);
  const name = input.name.trim();
  const contactNumber = input.contactNumber.trim();
  const password = input.password;
  const role = input.role;

  if (!isValidAdminUserEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password && password.length < 8) {
    errors.password = "Password must be at least 8 characters when provided.";
  }

  if (role !== "USER" && role !== "ADMIN") {
    errors.role = "Role must be USER or ADMIN.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      email,
      name,
      contactNumber,
      role,
      password,
    },
  };
}

export function getDeleteUserBlockReason(input: {
  actorUserId: string;
  targetUserId: string;
}): string | null {
  if (input.actorUserId === input.targetUserId) {
    return "You cannot delete your own account from the admin dashboard.";
  }
  return null;
}

export function getRoleChangeBlockReason(input: {
  actorUserId: string;
  targetUserId: string;
  currentRole: Role;
  newRole: Role;
  adminCount: number;
}): string | null {
  if (input.currentRole === input.newRole) {
    return null;
  }

  if (input.currentRole === "ADMIN" && input.newRole === "USER") {
    if (input.adminCount <= 1) {
      return "Cannot demote the last admin account.";
    }
    if (input.actorUserId === input.targetUserId) {
      return "You cannot demote your own admin account. Ask another admin to change your role.";
    }
  }

  return null;
}
