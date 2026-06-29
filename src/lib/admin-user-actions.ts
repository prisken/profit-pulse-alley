"use server";

import bcrypt from "bcrypt";
import type { Role } from "@prisma/client";

import {
  adminFail,
  adminOk,
  fieldErrorsFromRecord,
  finishAdminMutation,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import {
  getDeleteUserBlockReason,
  getRoleChangeBlockReason,
  validateAdminCreateUserInput,
} from "@/lib/admin-user-validation";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const BCRYPT_SALT_ROUNDS = 12;
const ADMIN_PAGE = "/admin";

export type { AdminActionResult as AdminUserActionResult } from "@/lib/admin/action-result";

function unauthorized(): AdminActionResult {
  return adminFail("Unauthorized");
}

function revalidateAdminUsersEffect() {
  return {
    label: "cache refresh",
    run: () => {
      revalidatePath(ADMIN_PAGE);
    },
  };
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
): Promise<AdminActionResult> {
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
    return adminFail(firstError, fieldErrorsFromRecord(validation.errors));
  }

  const { email, name, contactNumber, role, password } = validation.normalized;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return adminFail("A user with this email already exists.");
  }

  const hashedPassword = password
    ? await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    : null;

  let user: { id: string; email: string; role: Role };
  try {
    user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        contactNumber: contactNumber || null,
        role,
        password: hashedPassword,
      },
      select: { id: true, email: true, role: true },
    });
  } catch (error) {
    console.error("[admin-user-actions] createAdminUserAction failed:", error);
    return adminFail("Could not create user. Please try again.");
  }

  return finishAdminMutation("User added.", [
    {
      label: "audit log",
      run: () =>
        writeUserAuditLog({
          adminUserId: admin.userId,
          entityId: user.id,
          action: "CREATE_USER",
          newValue: JSON.stringify({
            email: user.email,
            role: user.role,
            hasPassword: Boolean(hashedPassword),
          }),
        }),
    },
    revalidateAdminUsersEffect(),
  ]);
}

export async function deleteAdminUserAction(
  userId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const targetId = userId.trim();
  if (!targetId) {
    return adminFail("User id is required.");
  }

  const selfDeleteReason = getDeleteUserBlockReason({
    actorUserId: admin.userId,
    targetUserId: targetId,
  });
  if (selfDeleteReason) {
    return adminFail(selfDeleteReason);
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return adminFail("User not found.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: targetId } });
    });
  } catch (error) {
    console.error("[admin-user-actions] deleteAdminUserAction failed:", error);
    return adminFail(
      "Could not delete user. Related records may prevent removal — contact engineering.",
    );
  }

  return finishAdminMutation("User deleted.", [
    {
      label: "audit log",
      run: () =>
        writeUserAuditLog({
          adminUserId: admin.userId,
          entityId: targetId,
          action: "DELETE_USER",
          oldValue: JSON.stringify({ email: user.email, role: user.role }),
        }),
    },
    revalidateAdminUsersEffect(),
  ]);
}

export async function updateAdminUserRoleAction(
  userId: string,
  role: Role,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const targetId = userId.trim();
  if (!targetId) {
    return adminFail("User id is required.");
  }

  if (role !== "USER" && role !== "ADMIN") {
    return adminFail("Role must be USER or ADMIN.");
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return adminFail("User not found.");
  }

  if (user.role === role) {
    return adminOk("User role updated.");
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
    return adminFail(blockReason);
  }

  try {
    await prisma.user.update({
      where: { id: targetId },
      data: { role },
    });
  } catch (error) {
    console.error("[admin-user-actions] updateAdminUserRoleAction failed:", error);
    return adminFail("Could not update user role. Please try again.");
  }

  return finishAdminMutation("User role updated.", [
    {
      label: "audit log",
      run: () =>
        writeUserAuditLog({
          adminUserId: admin.userId,
          entityId: targetId,
          action: "UPDATE_USER_ROLE",
          fieldName: "role",
          oldValue: user.role,
          newValue: role,
        }),
    },
    revalidateAdminUsersEffect(),
  ]);
}
