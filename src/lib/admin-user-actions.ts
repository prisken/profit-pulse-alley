"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import {
  getDeleteUserBlockReason,
  getRoleChangeBlockReason,
  validateAdminCreateUserInput,
} from "@/lib/admin-user-validation";
import { prisma } from "@/lib/prisma";

const BCRYPT_SALT_ROUNDS = 12;
const ADMIN_PAGE = "/admin";

export type AdminUserActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function unauthorized(): AdminUserActionResult {
  return { ok: false, error: "Unauthorized" };
}

function revalidateAdminUsers() {
  revalidatePath(ADMIN_PAGE);
}

async function writeUserAuditLog(input: {
  adminUserId: string;
  entityId: string;
  action: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
}) {
  await prisma.marketPulseAuditLog.create({
    data: {
      adminUserId: input.adminUserId,
      entityType: "User",
      entityId: input.entityId,
      action: input.action,
      fieldName: input.fieldName,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      reason: input.reason,
    },
  });
}

async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN" } });
}

export type CreateAdminUserInput = {
  email: string;
  name?: string;
  contactNumber?: string;
  role: Role;
  password?: string;
};

export async function createAdminUserAction(
  input: CreateAdminUserInput,
): Promise<AdminUserActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const validation = validateAdminCreateUserInput({
    email: input.email,
    name: input.name ?? "",
    contactNumber: input.contactNumber ?? "",
    role: input.role,
    password: input.password ?? "",
  });

  if (!validation.valid) {
    const firstError =
      validation.errors.email ??
      validation.errors.password ??
      validation.errors.role ??
      "Invalid user data.";
    return { ok: false, error: firstError };
  }

  const { email, name, contactNumber, role, password } = validation.normalized;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "A user with this email already exists." };
  }

  const hashedPassword = password
    ? await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    : null;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        contactNumber: contactNumber || null,
        role,
        password: hashedPassword,
      },
      select: { id: true, email: true, role: true },
    });

    await writeUserAuditLog({
      adminUserId: admin.userId,
      entityId: user.id,
      action: "CREATE_USER",
      newValue: JSON.stringify({
        email: user.email,
        role: user.role,
        hasPassword: Boolean(hashedPassword),
      }),
    });

    revalidateAdminUsers();
    return {
      ok: true,
      message: hashedPassword
        ? "User created with password credentials."
        : "User created. They can sign in when OAuth or magic-link is enabled.",
    };
  } catch (error) {
    console.error("[admin-user-actions] createAdminUserAction failed:", error);
    return { ok: false, error: "Could not create user. Please try again." };
  }
}

export async function deleteAdminUserAction(
  userId: string,
): Promise<AdminUserActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const targetId = userId.trim();
  if (!targetId) {
    return { ok: false, error: "User id is required." };
  }

  const selfDeleteReason = getDeleteUserBlockReason({
    actorUserId: admin.userId,
    targetUserId: targetId,
  });
  if (selfDeleteReason) {
    return { ok: false, error: selfDeleteReason };
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return { ok: false, error: "User not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: targetId } });
    });

    await writeUserAuditLog({
      adminUserId: admin.userId,
      entityId: targetId,
      action: "DELETE_USER",
      oldValue: JSON.stringify({ email: user.email, role: user.role }),
    });

    revalidateAdminUsers();
    return { ok: true, message: `Deleted ${user.email}.` };
  } catch (error) {
    console.error("[admin-user-actions] deleteAdminUserAction failed:", error);
    return {
      ok: false,
      error:
        "Could not delete user. Related records may prevent removal — contact engineering.",
    };
  }
}

export async function updateAdminUserRoleAction(
  userId: string,
  role: Role,
): Promise<AdminUserActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const targetId = userId.trim();
  if (!targetId) {
    return { ok: false, error: "User id is required." };
  }

  if (role !== "USER" && role !== "ADMIN") {
    return { ok: false, error: "Role must be USER or ADMIN." };
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return { ok: false, error: "User not found." };
  }

  if (user.role === role) {
    return { ok: true, message: "Role unchanged." };
  }

  const adminCount = await countAdmins();
  const blockReason = getRoleChangeBlockReason({
    actorUserId: admin.userId,
    targetUserId: targetId,
    currentRole: user.role,
    newRole: role,
    adminCount,
  });
  if (blockReason) {
    return { ok: false, error: blockReason };
  }

  try {
    await prisma.user.update({
      where: { id: targetId },
      data: { role },
    });

    await writeUserAuditLog({
      adminUserId: admin.userId,
      entityId: targetId,
      action: "UPDATE_USER_ROLE",
      fieldName: "role",
      oldValue: user.role,
      newValue: role,
    });

    revalidateAdminUsers();
    return { ok: true, message: `Role updated to ${role} for ${user.email}.` };
  } catch (error) {
    console.error("[admin-user-actions] updateAdminUserRoleAction failed:", error);
    return { ok: false, error: "Could not update user role. Please try again." };
  }
}
