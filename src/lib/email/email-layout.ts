import { resolvePublicSiteOrigin } from "@/lib/email/email-footer";

export type ProductEmailBodies = {
  subject: string;
  text: string;
  html: string;
};

export type ProductEmailCta = {
  label: string;
  path: string;
};

const SIGN_OFF = "— Profit Pulse Ally";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveSiteUrl(origin?: string): string {
  return (origin ?? resolvePublicSiteOrigin()).replace(/\/$/, "");
}

/**
 * Build exact plain-text + simple branded HTML for product emails.
 * Copy paragraphs should already match approved templates (no invented claims).
 */
export function buildProductEmailBodies(input: {
  subject: string;
  paragraphs: string[];
  cta?: ProductEmailCta;
  /** e.g. "Prize:\n{label}" block without relying on CTA */
  plainExtra?: string;
  htmlExtra?: string;
  footerText?: string;
  footerHtml?: string;
  origin?: string;
}): ProductEmailBodies {
  const siteUrl = resolveSiteUrl(input.origin);
  const ctaUrl = input.cta ? `${siteUrl}${input.cta.path}` : null;

  const textParts = ["Hi,", "", ...interleaveParagraphs(input.paragraphs)];
  if (input.plainExtra) {
    textParts.push("", input.plainExtra);
  }
  if (input.cta && ctaUrl) {
    textParts.push("", `${input.cta.label}:`, ctaUrl);
  }
  textParts.push("", SIGN_OFF);

  let text = textParts.join("\n");
  if (input.footerText) {
    text += input.footerText;
  }

  const htmlParagraphs = input.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">${escapeHtml(p)}</p>`)
    .join("");

  const htmlExtra = input.htmlExtra ?? "";
  const button =
    input.cta && ctaUrl
      ? `<p style="margin:24px 0;">` +
        `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">` +
        `${escapeHtml(input.cta.label)}` +
        `</a></p>`
      : "";

  const html =
    `<div style="margin:0;padding:24px;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;">` +
    `<div style="max-width:560px;margin:0 auto;padding:28px 24px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">` +
    `<p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">Profit Pulse Ally</p>` +
    `<p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#18181b;">Hi,</p>` +
    htmlParagraphs +
    htmlExtra +
    button +
    `<p style="margin:24px 0 0;font-size:15px;line-height:1.5;color:#52525b;">${escapeHtml(SIGN_OFF)}</p>` +
    (input.footerHtml ?? "") +
    `</div></div>`;

  return {
    subject: input.subject,
    text,
    html,
  };
}

function interleaveParagraphs(paragraphs: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < paragraphs.length; i += 1) {
    if (i > 0) out.push("");
    out.push(paragraphs[i]!);
  }
  return out;
}

export { escapeHtml };
