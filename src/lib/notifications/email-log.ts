import "server-only";

import type { EmailDeliveryLog, Prisma } from "@prisma/client";

import type { NotificationEmailType } from "@/lib/notifications/notification-preferences";
import { prisma } from "@/lib/prisma";

export type EmailLogStatus = "attempted" | "sent" | "failed" | "skipped";

export type LogEmailAttemptInput = {
  userId?: string | null;
  email: string;
  type: NotificationEmailType | string;
  cycleId?: string | null;
  cardId?: string | null;
  status?: EmailLogStatus;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
};

export type EmailSentLookupInput = {
  userId?: string | null;
  email?: string | null;
  cycleId?: string | null;
  cardId?: string | null;
};

export async function logEmailAttempt(
  input: LogEmailAttemptInput,
): Promise<EmailDeliveryLog> {
  return prisma.emailDeliveryLog.create({
    data: {
      userId: input.userId ?? null,
      email: input.email.trim(),
      type: input.type,
      cycleId: input.cycleId ?? null,
      cardId: input.cardId ?? null,
      status: input.status ?? "attempted",
      providerMessageId: input.providerMessageId ?? null,
      error: input.error ?? null,
      sentAt: input.sentAt ?? null,
    },
  });
}

/**
 * True if a successful ("sent") delivery already exists for this type
 * with the provided identity keys (userId and/or email + optional cycle/card).
 */
export async function hasEmailAlreadyBeenSent(
  type: NotificationEmailType | string,
  lookup: EmailSentLookupInput,
): Promise<boolean> {
  const where: Prisma.EmailDeliveryLogWhereInput = {
    type,
    status: "sent",
  };

  if (lookup.userId) {
    where.userId = lookup.userId;
  } else if (lookup.email?.trim()) {
    where.email = lookup.email.trim();
  } else {
    return false;
  }

  if (lookup.cycleId) {
    where.cycleId = lookup.cycleId;
  }

  if (lookup.cardId) {
    where.cardId = lookup.cardId;
  }

  const existing = await prisma.emailDeliveryLog.findFirst({
    where,
    select: { id: true },
  });

  return existing !== null;
}

export async function markEmailSent(
  logId: string,
  options: { providerMessageId?: string | null; sentAt?: Date } = {},
): Promise<EmailDeliveryLog> {
  return prisma.emailDeliveryLog.update({
    where: { id: logId },
    data: {
      status: "sent",
      error: null,
      sentAt: options.sentAt ?? new Date(),
      ...(options.providerMessageId !== undefined
        ? { providerMessageId: options.providerMessageId }
        : {}),
    },
  });
}

export async function markEmailFailed(
  logId: string,
  error: string,
): Promise<EmailDeliveryLog> {
  return prisma.emailDeliveryLog.update({
    where: { id: logId },
    data: {
      status: "failed",
      error,
      sentAt: null,
    },
  });
}

/**
 * True if a successful send of `type` exists for this user at or after `since`.
 * Used for daily rate caps on reminder emails.
 */
export async function hasRecentSentEmail(
  type: NotificationEmailType | string,
  userId: string,
  since: Date,
): Promise<boolean> {
  const existing = await prisma.emailDeliveryLog.findFirst({
    where: {
      type,
      status: "sent",
      userId,
      OR: [{ sentAt: { gte: since } }, { createdAt: { gte: since } }],
    },
    select: { id: true },
  });

  return existing !== null;
}
