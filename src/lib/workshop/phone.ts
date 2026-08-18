/**
 * Workshop lead phone normalization + validation (pure — no Prisma).
 */

import type { MessageKey } from "@/lib/i18n/messages";

export type WorkshopPhoneErrorKey = Extract<
  MessageKey,
  | "workshop.capture.phoneRequired"
  | "workshop.capture.phoneInvalid"
  | "workshop.capture.phoneInvalidHk"
>;

export function normalizeWorkshopPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "").trim();
}

/**
 * Accepts +852 + 8 digits, or a general international number:
 * optional leading +, then 8–15 digits.
 *
 * Bare 8-digit inputs are normalized to HK E.164 (+852…): the WhatsApp
 * delivery bridge requires a full E.164 number, and 8-digit local format is
 * the overwhelmingly common entry style on this HK-focused site.
 */
export function validateWorkshopPhone(
  raw: string,
):
  | { ok: true; phone: string }
  | { ok: false; errorKey: WorkshopPhoneErrorKey } {
  const phone = normalizeWorkshopPhone(raw ?? "");

  if (!phone) {
    return { ok: false, errorKey: "workshop.capture.phoneRequired" };
  }

  // Hong Kong local mobile/landline style: +852 + exactly 8 digits.
  if (phone.startsWith("+852")) {
    if (/^\+852\d{8}$/.test(phone)) {
      return { ok: true, phone };
    }
    return {
      ok: false,
      errorKey: "workshop.capture.phoneInvalidHk",
    };
  }

  // Bare 8 digits → treat as a local HK number and expand to E.164.
  if (/^\d{8}$/.test(phone)) {
    return { ok: true, phone: `+852${phone}` };
  }

  // General international: optional +, then 8–15 digits.
  if (/^\+?\d{8,15}$/.test(phone)) {
    return { ok: true, phone };
  }

  return {
    ok: false,
    errorKey: "workshop.capture.phoneInvalid",
  };
}
