import "server-only";

import nodemailer from "nodemailer";

export type SendProductEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendProductEmailResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; skipped?: boolean; error: string };

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function resolveSmtpConfig():
  | { server: string; from: string; replyTo?: string }
  | null {
  const server = process.env.EMAIL_SERVER?.trim();
  const from = stripOuterQuotes(process.env.EMAIL_FROM ?? "");

  if (!server || !from) {
    return null;
  }

  const replyTo = stripOuterQuotes(process.env.EMAIL_REPLY_TO ?? "");
  return {
    server,
    from,
    ...(replyTo ? { replyTo } : {}),
  };
}

/**
 * Sends a product/notification email via Nodemailer using EMAIL_SERVER / EMAIL_FROM.
 * Safe to call when SMTP env is unset (returns skipped, does not throw).
 * Never logs message body content.
 */
export async function sendProductEmail(
  input: SendProductEmailInput,
): Promise<SendProductEmailResult> {
  const config = resolveSmtpConfig();
  if (!config) {
    return {
      ok: false,
      skipped: true,
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    };
  }

  const to = input.to.trim();
  const subject = input.subject.trim();

  if (!to) {
    return { ok: false, error: "Recipient email is required." };
  }

  if (!subject) {
    return { ok: false, error: "Email subject is required." };
  }

  const replyTo = input.replyTo?.trim() || config.replyTo;

  try {
    const transport = nodemailer.createTransport(config.server);
    const info = await transport.sendMail({
      from: config.from,
      to,
      subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(replyTo ? { replyTo } : {}),
    });

    const providerMessageId =
      typeof info.messageId === "string" && info.messageId.trim()
        ? info.messageId
        : undefined;

    return { ok: true, ...(providerMessageId ? { providerMessageId } : {}) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error";
    console.error("[email] sendProductEmail failed:", message);
    return { ok: false, error: message };
  }
}
