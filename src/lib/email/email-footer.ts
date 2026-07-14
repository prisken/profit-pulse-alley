import type { NotificationEmailType } from "@/lib/notifications/notification-preferences";
import { createUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";

/** Non-essential types that should include an unsubscribe footer. */
export const EMAIL_TYPES_WITH_UNSUBSCRIBE_FOOTER: ReadonlyArray<NotificationEmailType> =
  [
    "welcome",
    "market_pulse_reminder",
    "market_pulse_reveal",
    "event_update",
    "learning_digest",
  ];

export function shouldIncludeUnsubscribeFooter(
  type: NotificationEmailType | string,
): boolean {
  return (EMAIL_TYPES_WITH_UNSUBSCRIBE_FOOTER as readonly string[]).includes(
    type,
  );
}

export function resolvePublicSiteOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit =
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.AUTH_URL?.trim() ||
    env.NEXTAUTH_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "https://profitpulseally.com";
}

export function buildUnsubscribeUrl(input: {
  userId: string;
  email: string;
  origin?: string;
  env?: NodeJS.ProcessEnv;
}): string {
  const origin = (input.origin ?? resolvePublicSiteOrigin(input.env)).replace(
    /\/$/,
    "",
  );
  const token = createUnsubscribeToken(
    { userId: input.userId, email: input.email },
    input.env ?? process.env,
  );
  return `${origin}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export type EmailFooterContent = {
  text: string;
  html: string;
  unsubscribeUrl: string;
};

/**
 * Footer for marketing / reminder / reveal / digest emails.
 * Do not attach to Auth.js magic-link or transactional prize emails.
 */
export function buildMarketingEmailFooter(input: {
  userId: string;
  email: string;
  origin?: string;
  env?: NodeJS.ProcessEnv;
}): EmailFooterContent {
  const unsubscribeUrl = buildUnsubscribeUrl(input);
  const text =
    `\n\n---\n` +
    `You are receiving this because you have a Profit Pulse Ally account.\n` +
    `Unsubscribe from non-essential emails: ${unsubscribeUrl}\n` +
    `Manage preferences: ${resolvePublicSiteOrigin(input.env)}/profile\n`;

  const html =
    `<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />` +
    `<p style="font-size:12px;line-height:1.5;color:#71717a;">` +
    `You are receiving this because you have a Profit Pulse Ally account.<br />` +
    `<a href="${unsubscribeUrl}">Unsubscribe from non-essential emails</a>` +
    ` · <a href="${resolvePublicSiteOrigin(input.env)}/profile">Manage preferences</a>` +
    `</p>`;

  return { text, html, unsubscribeUrl };
}
