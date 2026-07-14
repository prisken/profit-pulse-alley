/**
 * Manual SMTP smoke test for Zoho / product email.
 *
 * Usage:
 *   npx tsx scripts/send-test-email.ts you@example.com
 *
 * Requires in .env.local (or .env):
 *   EMAIL_SERVER=smtp://USER:APP_PASSWORD@smtp.zoho.com:587
 *   EMAIL_FROM=Profit Pulse Ally <priskenlo@profitpulseally.com>
 *   EMAIL_REPLY_TO=priskenlo@profitpulseally.com
 *
 * Does not print message bodies or SMTP passwords.
 * Mirrors src/lib/email/email-sender.ts (cannot import that module from a
 * plain Node script because of `server-only`).
 */

import { config } from "dotenv";
import nodemailer from "nodemailer";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

type Result =
  | { ok: true; providerMessageId?: string }
  | { ok: false; skipped?: boolean; error: string };

function maskServer(server: string): string {
  try {
    const url = new URL(server);
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch {
    return "[unparseable EMAIL_SERVER]";
  }
}

async function main(): Promise<void> {
  const to = process.argv[2]?.trim();
  if (!to) {
    console.error("Usage: npx tsx scripts/send-test-email.ts <to-email>");
    process.exit(1);
  }

  const server = process.env.EMAIL_SERVER?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  console.log("[email-test] to:", to);
  console.log("[email-test] EMAIL_SERVER:", server ? maskServer(server) : "(missing)");
  console.log("[email-test] EMAIL_FROM:", from ? "(set)" : "(missing)");
  console.log(
    "[email-test] EMAIL_REPLY_TO:",
    replyTo ? "(set)" : "(missing — optional)",
  );

  if (!server || !from) {
    const result: Result = {
      ok: false,
      skipped: true,
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    };
    console.log("[email-test] result:", result);
    process.exit(2);
  }

  try {
    const transport = nodemailer.createTransport(server);
    const info = await transport.sendMail({
      from,
      to,
      subject: "[Profit Pulse Ally] Email delivery test",
      text:
        "This is a manual SMTP test from scripts/send-test-email.ts.\n" +
        "If you received this, Zoho EMAIL_SERVER / EMAIL_FROM are working.",
      html:
        "<p>This is a manual SMTP test from <code>scripts/send-test-email.ts</code>.</p>" +
        "<p>If you received this, Zoho <code>EMAIL_SERVER</code> / <code>EMAIL_FROM</code> are working.</p>",
      ...(replyTo ? { replyTo } : {}),
    });

    const result: Result = {
      ok: true,
      ...(typeof info.messageId === "string" && info.messageId.trim()
        ? { providerMessageId: info.messageId }
        : {}),
    };
    console.log("[email-test] result:", result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error";
    console.error("[email-test] failed:", message);
    console.log("[email-test] result:", { ok: false, error: message });
    process.exit(1);
  }
}

main();
