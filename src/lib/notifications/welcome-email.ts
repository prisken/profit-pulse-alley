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

export const WELCOME_EMAIL_TYPE = "welcome" as const;

export type SendWelcomeEmailInput = {
  userId: string;
  email: string;
  name?: string | null;
};

export type SendWelcomeEmailResult =
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

export function buildWelcomeBodies(input: {
  userId: string;
  email: string;
}): { subject: string; text: string; html: string } {
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
    console.error("[welcome-email] unsubscribe footer skipped:", message);
  }

  return buildProductEmailBodies({
    subject: "Welcome to Profit Pulse Ally",
    paragraphs: [
      "Welcome to Profit Pulse Ally.",
      "Market Pulse is our recurring market signal challenge. Read a signal, lock in your view, and compare with PPA Insight after reveal.",
      "You can start with one signal — it takes less than 60 seconds.",
    ],
    cta: {
      label: "Play Market Pulse",
      path: "/market-pulse/play",
    },
    footerText,
    footerHtml,
    origin: resolvePublicSiteOrigin(),
  });
}

/**
 * Sends the post-signup welcome email once per user (deduped via EmailDeliveryLog).
 * Never throws — signup must succeed even if SMTP fails or is unset.
 *
 * OAuth / Google first-login welcome is intentionally not wired here yet (Auth.js
 * has no existing createUser hook in this repo; add carefully as a follow-up).
 */
export async function sendWelcomeEmailForNewUser(
  input: SendWelcomeEmailInput,
): Promise<SendWelcomeEmailResult> {
  try {
    const email = input.email.trim().toLowerCase();
    const userId = input.userId.trim();

    if (!userId || !email) {
      return { ok: false, skipped: true, reason: "missing_email" };
    }

    if (await hasEmailAlreadyBeenSent(WELCOME_EMAIL_TYPE, { userId })) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    if (await hasEmailAlreadyBeenSent(WELCOME_EMAIL_TYPE, { email })) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    const allowed = await canSendEmailType(userId, WELCOME_EMAIL_TYPE);
    if (!allowed) {
      await logEmailAttempt({
        userId,
        email,
        type: WELCOME_EMAIL_TYPE,
        status: "skipped",
        error: "Blocked by notification preferences",
      });
      return { ok: false, skipped: true, reason: "preference_blocked" };
    }

    const log = await logEmailAttempt({
      userId,
      email,
      type: WELCOME_EMAIL_TYPE,
      status: "attempted",
    });

    const bodies = buildWelcomeBodies({ userId, email });

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
      error instanceof Error ? error.message : "Unknown welcome email error";
    console.error("[welcome-email] sendWelcomeEmailForNewUser failed:", message);
    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: message,
    };
  }
}
