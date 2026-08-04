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

  // General international: optional +, then 8–15 digits.
  if (/^\+?\d{8,15}$/.test(phone)) {
    return { ok: true, phone };
  }

  return {
    ok: false,
    errorKey: "workshop.capture.phoneInvalid",
  };
}
