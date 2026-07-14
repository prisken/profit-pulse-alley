import "server-only";

import {
  buildMarketingEmailFooter,
  resolvePublicSiteOrigin,
} from "@/lib/email/email-footer";
import { buildProductEmailBodies } from "@/lib/email/email-layout";
import { sendProductEmail } from "@/lib/email/email-sender";
import {
  hasEmailAlreadyBeenSent,
  logEmailAttempt,
  markEmailFailed,
  markEmailSent,
} from "@/lib/notifications/email-log";
import { canSendEmailType } from "@/lib/notifications/notification-preferences";
import { prisma } from "@/lib/prisma";

export const REVEAL_EMAIL_TYPE = "market_pulse_reveal" as const;

export type RevealReadyEmailBodies = {
  subject: string;
  text: string;
  html: string;
};

export type SendRevealReadyEmailResult =
  | { ok: true; providerMessageId?: string }
  | {
      ok: false;
      skipped: true;
      reason:
        | "missing_email"
        | "already_sent"
        | "preference_blocked"
        | "delivery_skipped"
        | "delivery_failed";
      error?: string;
    };

export type RevealReadyEmailBatchResult = {
  cycleId: string;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
};

/**
 * Reveal-ready email copy only — no PPA insight, scores, or ranks.
 */
export function buildRevealReadyEmailBodies(input: {
  userId: string;
  email: string;
}): RevealReadyEmailBodies {
  let footerText = "";
  let footerHtml = "";
  try {
    const footer = buildMarketingEmailFooter({
      userId: input.userId,
      email: input.email,
    });
    footerText = footer.text;
    footerHtml = footer.html;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown footer error";
    console.error("[reveal-email] unsubscribe footer skipped:", message);
  }

  return buildProductEmailBodies({
    subject: "Your Market Pulse results are ready",
    paragraphs: [
      "PPA Insight is now revealed for the latest Market Pulse cycle.",
      "View your cycle review to compare your calls and learn from the result.",
    ],
    cta: {
      label: "View your review",
      path: "/market-pulse/reveal",
    },
    footerText,
    footerHtml,
    origin: resolvePublicSiteOrigin(),
  });
}

export async function findCycleRevealEmailRecipients(cycleId: string): Promise<
  Array<{ userId: string; email: string; name: string | null }>
> {
  const decisions = await prisma.marketPulseDecision.findMany({
    where: { cycleId },
    distinct: ["userId"],
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  return decisions
    .map((row) => ({
      userId: row.userId,
      email: row.user.email?.trim() ?? "",
      name: row.user.name,
    }))
    .filter((row) => Boolean(row.email));
}

export async function sendRevealReadyEmailToUser(input: {
  userId: string;
  email: string;
  cycleId: string;
}): Promise<SendRevealReadyEmailResult> {
  try {
    const userId = input.userId.trim();
    const email = input.email.trim().toLowerCase();
    const cycleId = input.cycleId.trim();

    if (!userId || !email || !cycleId) {
      return { ok: false, skipped: true, reason: "missing_email" };
    }

    if (
      await hasEmailAlreadyBeenSent(REVEAL_EMAIL_TYPE, {
        userId,
        cycleId,
      })
    ) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    const allowed = await canSendEmailType(userId, REVEAL_EMAIL_TYPE);
    if (!allowed) {
      await logEmailAttempt({
        userId,
        email,
        type: REVEAL_EMAIL_TYPE,
        cycleId,
        status: "skipped",
        error: "Blocked by notification preferences",
      });
      return { ok: false, skipped: true, reason: "preference_blocked" };
    }

    const bodies = buildRevealReadyEmailBodies({ userId, email });
    // Privacy guard — never ship PPA fields from callers into the payload.
    const serialized = JSON.stringify(bodies);
    if (
      serialized.includes("ppaInsight") ||
      serialized.includes("ppaSignal") ||
      serialized.includes("ppaSignalLockedAt")
    ) {
      await logEmailAttempt({
        userId,
        email,
        type: REVEAL_EMAIL_TYPE,
        cycleId,
        status: "skipped",
        error: "Blocked: PPA fields detected in email payload",
      });
      return {
        ok: false,
        skipped: true,
        reason: "delivery_failed",
        error: "Blocked: PPA fields detected in email payload",
      };
    }

    const log = await logEmailAttempt({
      userId,
      email,
      type: REVEAL_EMAIL_TYPE,
      cycleId,
      status: "attempted",
    });

    const sendResult = await sendProductEmail({
      to: email,
      subject: bodies.subject,
      text: bodies.text,
      html: bodies.html,
    });

    if (sendResult.ok) {
      await markEmailSent(log.id, {
        providerMessageId: sendResult.providerMessageId ?? null,
      });
      return {
        ok: true,
        ...(sendResult.providerMessageId
          ? { providerMessageId: sendResult.providerMessageId }
          : {}),
      };
    }

    await markEmailFailed(log.id, sendResult.error);

    if (sendResult.skipped) {
      return {
        ok: false,
        skipped: true,
        reason: "delivery_skipped",
        error: sendResult.error,
      };
    }

    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: sendResult.error,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown reveal email error";
    console.error("[reveal-email] sendRevealReadyEmailToUser failed:", message);
    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: message,
    };
  }
}

/**
 * Notify opted-in cycle participants that reveal is ready.
 * Never throws — callers must not block admin reveal on email failures.
 */
export async function sendRevealReadyEmailsForCycle(
  cycleId: string,
): Promise<RevealReadyEmailBatchResult> {
  const result: RevealReadyEmailBatchResult = {
    cycleId,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const recipients = await findCycleRevealEmailRecipients(cycleId);

    for (const recipient of recipients) {
      result.attempted += 1;
      const sendResult = await sendRevealReadyEmailToUser({
        userId: recipient.userId,
        email: recipient.email,
        cycleId,
      });

      if (sendResult.ok) {
        result.sent += 1;
      } else if (sendResult.reason === "delivery_failed") {
        result.failed += 1;
      } else {
        result.skipped += 1;
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown reveal email batch error";
    console.error("[reveal-email] sendRevealReadyEmailsForCycle failed:", message);
  }

  return result;
}
