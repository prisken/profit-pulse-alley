import "server-only";

import {
  buildMarketingEmailFooter,
  resolvePublicSiteOrigin,
} from "@/lib/email/email-footer";
import { buildProductEmailBodies } from "@/lib/email/email-layout";
import { sendProductEmail } from "@/lib/email/email-sender";
import {
  hasEmailAlreadyBeenSent,
  hasRecentSentEmail,
  logEmailAttempt,
  markEmailFailed,
  markEmailSent,
} from "@/lib/notifications/email-log";
import { canSendEmailType } from "@/lib/notifications/notification-preferences";

export const REMINDER_EMAIL_TYPE = "market_pulse_reminder" as const;

export const REMINDER_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

export type ReminderEmailKind = "playable_card" | "next_cycle";

export type ReminderEmailBodies = {
  subject: string;
  text: string;
  html: string;
};

export type SendReminderEmailResult =
  | { ok: true; providerMessageId?: string }
  | {
      ok: false;
      skipped: true;
      reason:
        | "missing_email"
        | "already_sent"
        | "rate_limited"
        | "preference_blocked"
        | "delivery_skipped"
        | "delivery_failed";
      error?: string;
    };

/**
 * Reminder copy only — approved templates; no PPA content, scores, or ranks.
 */
export function buildReminderEmailBodies(input: {
  kind: ReminderEmailKind;
  userId: string;
  email: string;
}): ReminderEmailBodies {
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
    console.error("[reminder-email] unsubscribe footer skipped:", message);
  }

  const origin = resolvePublicSiteOrigin();

  if (input.kind === "next_cycle") {
    return buildProductEmailBodies({
      subject: "Next Market Pulse cycle starts soon",
      paragraphs: [
        "The next Market Pulse cycle starts soon.",
        "When it opens, you can read the signal, lock in your view, and compare with PPA Insight after reveal.",
      ],
      cta: {
        label: "Go to Market Pulse",
        path: "/market-pulse/play",
      },
      footerText,
      footerHtml,
      origin,
    });
  }

  return buildProductEmailBodies({
    subject: "Today's Market Pulse signal is ready",
    paragraphs: [
      "Today's Market Pulse signal is live.",
      "Make your call when you have a minute. You can turn reminders off anytime from your profile.",
    ],
    cta: {
      label: "Play now",
      path: "/market-pulse/play",
    },
    footerText,
    footerHtml,
    origin,
  });
}

export async function sendMarketPulseReminderEmail(input: {
  userId: string;
  email: string;
  kind: ReminderEmailKind;
  cycleId: string;
  cardId?: string | null;
  now?: Date;
}): Promise<SendReminderEmailResult> {
  try {
    const userId = input.userId.trim();
    const email = input.email.trim().toLowerCase();
    const cycleId = input.cycleId.trim();
    const cardId = input.cardId?.trim() || null;
    const now = input.now ?? new Date();

    if (!userId || !email || !cycleId) {
      return { ok: false, skipped: true, reason: "missing_email" };
    }

    if (
      await hasEmailAlreadyBeenSent(REMINDER_EMAIL_TYPE, {
        userId,
        cycleId,
        ...(cardId ? { cardId } : {}),
      })
    ) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    if (
      cardId &&
      (await hasEmailAlreadyBeenSent(REMINDER_EMAIL_TYPE, {
        userId,
        cardId,
      }))
    ) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    const rateSince = new Date(now.getTime() - REMINDER_RATE_LIMIT_MS);
    if (await hasRecentSentEmail(REMINDER_EMAIL_TYPE, userId, rateSince)) {
      return { ok: false, skipped: true, reason: "rate_limited" };
    }

    const allowed = await canSendEmailType(userId, REMINDER_EMAIL_TYPE);
    if (!allowed) {
      await logEmailAttempt({
        userId,
        email,
        type: REMINDER_EMAIL_TYPE,
        cycleId,
        cardId,
        status: "skipped",
        error: "Blocked by notification preferences",
      });
      return { ok: false, skipped: true, reason: "preference_blocked" };
    }

    const bodies = buildReminderEmailBodies({
      kind: input.kind,
      userId,
      email,
    });
    const serialized = JSON.stringify(bodies);
    if (
      serialized.includes("ppaInsight") ||
      serialized.includes("ppaSignal") ||
      serialized.includes("ppaSignalLockedAt")
    ) {
      await logEmailAttempt({
        userId,
        email,
        type: REMINDER_EMAIL_TYPE,
        cycleId,
        cardId,
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
      type: REMINDER_EMAIL_TYPE,
      cycleId,
      cardId,
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
      error instanceof Error ? error.message : "Unknown reminder email error";
    console.error("[reminder-email] sendMarketPulseReminderEmail failed:", message);
    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: message,
    };
  }
}
