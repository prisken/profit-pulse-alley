"use server";

import type { MarketPulseSignal } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  adminFail,
  fieldErrorsFromRecord,
  finishAdminMutation,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import {
  deriveCardPublishedAtFromSchedule,
  getCardSchedulingPublishBlockReason,
} from "@/lib/market-pulse/admin-card-scheduling";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import { validateCardPublishable } from "@/lib/market-pulse/card-validation";
import { validateGuidedPpaApprove } from "@/lib/market-pulse/guided-card-validation";
import { prisma } from "@/lib/prisma";

const ADMIN_PATH = "/admin/market-pulse";
const APPROVALS_PATH = `${ADMIN_PATH}/approvals`;

function unauthorized(): AdminActionResult {
  return adminFail("Unauthorized");
}

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateApprovals() {
  revalidatePath(APPROVALS_PATH);
  revalidatePath(ADMIN_PATH);
}

export type ApproveAndPublishCardInput = {
  cardId: string;
  ppaSignal?: MarketPulseSignal | "";
  ppaInsight?: string;
  ppaInsightZhHant?: string;
  reviewNote?: string;
};

/**
 * Approve a card from the approvals queue and publish it in one step.
 *
 * SIGNAL cards require a PPA decision (mirrors `approveGuidedMarketPulseCardPpaAction`);
 * publishability + scheduling checks mirror `publishMarketPulseCardAction`, but the
 * publishability check runs against the post-approval card state (PPA locked).
 */
export async function approveAndPublishMarketPulseCardAction(
  input: ApproveAndPublishCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) return adminFail("Card not found.");
  if (card.status !== "DRAFT") {
    return adminFail("Only draft cards can be approved from the approvals queue.");
  }

  const isRest = isMarketPulseRestCard(card);

  if (!isRest) {
    const validation = validateGuidedPpaApprove({
      ppaSignal: input.ppaSignal ?? "",
      ppaInsight: input.ppaInsight ?? "",
    });
    if (!validation.valid) {
      const fieldErrors = Object.fromEntries(
        Object.entries(validation.errors).filter(
          (entry): entry is [string, string] => Boolean(entry[1]),
        ),
      );
      return adminFail(
        validation.error ?? "PPA approval is incomplete.",
        fieldErrorsFromRecord(fieldErrors),
      );
    }
  }

  // Publishability is checked against the state the card WILL have after approval.
  const publishError = validateCardPublishable(
    isRest
      ? card
      : {
          ...card,
          ppaSignal: input.ppaSignal || null,
          ppaInsight: trimOrNull(input.ppaInsight),
          ppaSignalLockedAt: new Date(),
        },
  );
  if (publishError) return adminFail(publishError);

  const cycleCards = await prisma.marketPulseCard.findMany({
    where: { cycleId: card.cycleId },
    select: { id: true, dayIndex: true, sourceDate: true, status: true },
  });
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: card.cycleId },
    select: { startsAt: true, endsAt: true },
  });
  if (!cycle) return adminFail("Cycle not found.");

  const schedulingError = getCardSchedulingPublishBlockReason(
    card,
    cycle,
    cycleCards,
  );
  if (schedulingError) return adminFail(schedulingError);

  try {
    await prisma.marketPulseCard.update({
      where: { id: card.id },
      data: {
        ...(isRest
          ? {}
          : {
              ppaSignal: input.ppaSignal || null,
              ppaInsight: trimOrNull(input.ppaInsight),
              ppaInsightZhHant: trimOrNull(input.ppaInsightZhHant),
              ppaSignalLockedAt: new Date(),
            }),
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        reviewNote: trimOrNull(input.reviewNote),
        status: "PUBLISHED",
        publishedAt:
          card.publishedAt ??
          deriveCardPublishedAtFromSchedule(cycle.startsAt, card.dayIndex),
      },
    });
  } catch (error) {
    console.error(
      "[admin] approveAndPublishMarketPulseCardAction failed:",
      error,
    );
    return adminFail("Could not approve card. Please try again.");
  }

  return finishAdminMutation("Card approved and published.", [
    {
      label: "audit log",
      run: () =>
        prisma.marketPulseAuditLog.create({
          data: {
            adminUserId: admin.userId,
            entityType: "MarketPulseCard",
            entityId: card.id,
            action: isRest ? "APPROVE_AND_PUBLISH_REST" : "APPROVE_AND_PUBLISH",
            reason: "Approved and published from the approvals queue",
            fieldName: "reviewStatus",
            oldValue: card.reviewStatus,
            newValue: "APPROVED",
          },
        }),
    },
    { label: "revalidate approvals", run: revalidateApprovals },
  ]);
}

export type RejectCardInput = {
  cardId: string;
  reviewNote?: string;
};

/** Reject a card in the approvals queue. It stays a DRAFT and can be edited and resubmitted. */
export async function rejectMarketPulseCardAction(
  input: RejectCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) return adminFail("Card not found.");
  if (card.status !== "DRAFT") {
    return adminFail("Published cards cannot be rejected.");
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: card.id },
      data: {
        reviewStatus: "REJECTED",
        reviewedAt: new Date(),
        reviewNote: trimOrNull(input.reviewNote),
      },
    });
  } catch (error) {
    console.error("[admin] rejectMarketPulseCardAction failed:", error);
    return adminFail("Could not reject card. Please try again.");
  }

  return finishAdminMutation("Card rejected.", [
    {
      label: "audit log",
      run: () =>
        prisma.marketPulseAuditLog.create({
          data: {
            adminUserId: admin.userId,
            entityType: "MarketPulseCard",
            entityId: card.id,
            action: "REJECT_CARD",
            reason: "Rejected from the approvals queue",
            fieldName: "reviewStatus",
            oldValue: card.reviewStatus,
            newValue: "REJECTED",
          },
        }),
    },
    { label: "revalidate approvals", run: revalidateApprovals },
  ]);
}
