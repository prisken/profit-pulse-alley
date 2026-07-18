"use server";

import { revalidatePath } from "next/cache";

import {
  adminFail,
  finishAdminMutation,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import {
  isMatchingPulseStatus,
  MATCHING_PULSE_FIELD_MAX,
  type MatchingPulseStatusValue,
} from "@/lib/matching-pulse/constants";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prisma } from "@/lib/prisma";

const ADMIN_LIST_PATH = "/admin/matching-pulse";

function unauthorized(): AdminActionResult {
  return adminFail("Unauthorized");
}

function detailPath(requestId: string): string {
  return `${ADMIN_LIST_PATH}/${requestId}`;
}

function revalidateMatchingPulseAdmin(requestId: string) {
  return {
    label: "cache refresh",
    run: () => {
      revalidatePath(ADMIN_LIST_PATH);
      revalidatePath(detailPath(requestId));
    },
  };
}

function normalizeOptionalText(
  value: string,
  maxLength: number,
  fieldLabel: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${fieldLabel} must be ${maxLength} characters or fewer.`,
    };
  }
  return { ok: true, value: trimmed };
}

async function findRequestId(requestId: string): Promise<string | null> {
  const trimmed = requestId.trim();
  if (!trimmed) {
    return null;
  }
  const row = await prisma.matchingPulseRequest.findUnique({
    where: { id: trimmed },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function updateMatchingPulseRequestStatusAction(
  requestId: string,
  status: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  if (!isMatchingPulseStatus(status)) {
    return adminFail("Select a valid status.");
  }

  const id = await findRequestId(requestId);
  if (!id) {
    return adminFail("Request not found.");
  }

  try {
    await prisma.matchingPulseRequest.update({
      where: { id },
      data: { status: status as MatchingPulseStatusValue },
    });
  } catch (error) {
    console.error("[matching-pulse] update status failed:", error);
    return adminFail("Could not update status. Please try again.");
  }

  return finishAdminMutation("Status updated.", [
    revalidateMatchingPulseAdmin(id),
  ]);
}

export async function updateMatchingPulseRequestAdminNotesAction(
  requestId: string,
  adminNotes: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const normalized = normalizeOptionalText(
    adminNotes,
    MATCHING_PULSE_FIELD_MAX.adminNotes,
    "Admin notes",
  );
  if (!normalized.ok) {
    return adminFail(normalized.error);
  }

  const id = await findRequestId(requestId);
  if (!id) {
    return adminFail("Request not found.");
  }

  try {
    await prisma.matchingPulseRequest.update({
      where: { id },
      data: { adminNotes: normalized.value },
    });
  } catch (error) {
    console.error("[matching-pulse] update admin notes failed:", error);
    return adminFail("Could not save admin notes. Please try again.");
  }

  return finishAdminMutation("Admin notes saved.", [
    revalidateMatchingPulseAdmin(id),
  ]);
}

export async function updateMatchingPulseRequestTagsAction(
  requestId: string,
  tags: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  const normalized = normalizeOptionalText(
    tags,
    MATCHING_PULSE_FIELD_MAX.tags,
    "Tags",
  );
  if (!normalized.ok) {
    return adminFail(normalized.error);
  }

  const id = await findRequestId(requestId);
  if (!id) {
    return adminFail("Request not found.");
  }

  try {
    await prisma.matchingPulseRequest.update({
      where: { id },
      data: { tags: normalized.value },
    });
  } catch (error) {
    console.error("[matching-pulse] update tags failed:", error);
    return adminFail("Could not save tags. Please try again.");
  }

  return finishAdminMutation("Tags saved.", [revalidateMatchingPulseAdmin(id)]);
}

export type UpdateMatchingPulseRequestReviewInput = {
  requestId: string;
  status: string;
  adminNotes: string;
  tags: string;
};

/** Combined save for the admin review form (status + notes + tags). */
export async function updateMatchingPulseRequestReviewAction(
  input: UpdateMatchingPulseRequestReviewInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) {
    return unauthorized();
  }

  if (!isMatchingPulseStatus(input.status)) {
    return adminFail("Select a valid status.");
  }

  const notes = normalizeOptionalText(
    input.adminNotes,
    MATCHING_PULSE_FIELD_MAX.adminNotes,
    "Admin notes",
  );
  if (!notes.ok) {
    return adminFail(notes.error);
  }

  const tags = normalizeOptionalText(
    input.tags,
    MATCHING_PULSE_FIELD_MAX.tags,
    "Tags",
  );
  if (!tags.ok) {
    return adminFail(tags.error);
  }

  const id = await findRequestId(input.requestId);
  if (!id) {
    return adminFail("Request not found.");
  }

  try {
    await prisma.matchingPulseRequest.update({
      where: { id },
      data: {
        status: input.status as MatchingPulseStatusValue,
        adminNotes: notes.value,
        tags: tags.value,
      },
    });
  } catch (error) {
    console.error("[matching-pulse] update review failed:", error);
    return adminFail("Could not save review. Please try again.");
  }

  return finishAdminMutation("Review saved.", [revalidateMatchingPulseAdmin(id)]);
}
