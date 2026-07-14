import "server-only";

import { buildProductEmailBodies, escapeHtml } from "@/lib/email/email-layout";
import { sendProductEmail } from "@/lib/email/email-sender";
import { MARKET_PULSE_CYCLE_PRIZE_SHORT } from "@/lib/market-pulse/launch-config";
import { getMarketPulseLeaderboard } from "@/lib/market-pulse/server";
import {
  hasEmailAlreadyBeenSent,
  logEmailAttempt,
  markEmailFailed,
  markEmailSent,
} from "@/lib/notifications/email-log";
import { canSendEmailType } from "@/lib/notifications/notification-preferences";
import { prisma } from "@/lib/prisma";

export const WINNER_EMAIL_TYPE = "market_pulse_winner" as const;

export type WinnerEmailBodies = {
  subject: string;
  text: string;
  html: string;
};

export type SendWinnerEmailResult =
  | { ok: true; providerMessageId?: string }
  | {
      ok: false;
      skipped: true;
      reason:
        | "no_winner"
        | "missing_email"
        | "already_sent"
        | "preference_blocked"
        | "delivery_skipped"
        | "delivery_failed";
      error?: string;
    };

/**
 * Transactional winner copy — no PPA insight, scores, or ranks.
 * No marketing unsubscribe footer.
 */
export function buildWinnerEmailBodies(input: {
  prizeLabel: string;
}): WinnerEmailBodies {
  const prizeLabel = input.prizeLabel.trim();
  if (!prizeLabel) {
    // Avoid misleading empty prize claims — caller should skip or supply fallback.
    const bodies = buildProductEmailBodies({
      subject: "Congratulations — you won this Market Pulse cycle",
      paragraphs: [
        "Congratulations — you finished at the top of this Market Pulse cycle.",
        "We will contact you about prize fulfilment. You can also reply directly to this email.",
      ],
    });
    return bodies;
  }

  return buildProductEmailBodies({
    subject: "Congratulations — you won this Market Pulse cycle",
    paragraphs: [
      "Congratulations — you finished at the top of this Market Pulse cycle.",
    ],
    plainExtra: `Prize:\n${prizeLabel}\n\nWe will contact you about prize fulfilment. You can also reply directly to this email.`,
    htmlExtra:
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">Prize:<br>${escapeHtml(prizeLabel)}</p>` +
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">We will contact you about prize fulfilment. You can also reply directly to this email.</p>`,
  });
}

export async function findCycleWinnerRecipient(cycleId: string): Promise<{
  userId: string;
  email: string;
  prizeLabel: string;
} | null> {
  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId,
    limit: 1,
  });

  const top = leaderboard[0];
  if (!top?.userId) {
    return null;
  }

  const [user, cycle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: top.userId },
      select: { email: true },
    }),
    prisma.marketPulseCycle.findUnique({
      where: { id: cycleId },
      select: { prizeLabel: true },
    }),
  ]);

  const email = user?.email?.trim() ?? "";
  if (!email) {
    return null;
  }

  return {
    userId: top.userId,
    email,
    prizeLabel: cycle?.prizeLabel?.trim() || MARKET_PULSE_CYCLE_PRIZE_SHORT,
  };
}

export async function sendWinnerEmailToUser(input: {
  userId: string;
  email: string;
  cycleId: string;
  prizeLabel: string;
}): Promise<SendWinnerEmailResult> {
  try {
    const userId = input.userId.trim();
    const email = input.email.trim().toLowerCase();
    const cycleId = input.cycleId.trim();

    if (!userId || !email || !cycleId) {
      return { ok: false, skipped: true, reason: "missing_email" };
    }

    if (
      await hasEmailAlreadyBeenSent(WINNER_EMAIL_TYPE, {
        userId,
        cycleId,
      })
    ) {
      return { ok: false, skipped: true, reason: "already_sent" };
    }

    // Transactional: canSendEmailType ignores marketing opt-outs for winners.
    const allowed = await canSendEmailType(userId, WINNER_EMAIL_TYPE);
    if (!allowed) {
      await logEmailAttempt({
        userId,
        email,
        type: WINNER_EMAIL_TYPE,
        cycleId,
        status: "skipped",
        error: "Blocked by notification preferences",
      });
      return { ok: false, skipped: true, reason: "preference_blocked" };
    }

    const bodies = buildWinnerEmailBodies({ prizeLabel: input.prizeLabel });
    const serialized = JSON.stringify(bodies);
    if (
      serialized.includes("ppaInsight") ||
      serialized.includes("ppaSignal") ||
      serialized.includes("ppaSignalLockedAt")
    ) {
      await logEmailAttempt({
        userId,
        email,
        type: WINNER_EMAIL_TYPE,
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
      type: WINNER_EMAIL_TYPE,
      cycleId,
      status: "attempted",
    });

    // Reply-To comes from EMAIL_REPLY_TO via sendProductEmail defaults.
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
      error instanceof Error ? error.message : "Unknown winner email error";
    console.error("[winner-email] sendWinnerEmailToUser failed:", message);
    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: message,
    };
  }
}

/**
 * Notify the cycle winner once scoring/leaderboard is ready.
 * Never throws — callers must not block admin reveal on email failures.
 */
export async function sendWinnerEmailForCycle(
  cycleId: string,
): Promise<SendWinnerEmailResult> {
  try {
    const recipient = await findCycleWinnerRecipient(cycleId);
    if (!recipient) {
      return { ok: false, skipped: true, reason: "no_winner" };
    }

    return await sendWinnerEmailToUser({
      userId: recipient.userId,
      email: recipient.email,
      cycleId,
      prizeLabel: recipient.prizeLabel,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown winner email batch error";
    console.error("[winner-email] sendWinnerEmailForCycle failed:", message);
    return {
      ok: false,
      skipped: true,
      reason: "delivery_failed",
      error: message,
    };
  }
}
