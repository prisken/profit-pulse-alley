import type { SiteLocale } from "@/lib/i18n/locales";
import type { Bilingual } from "@/lib/workshop/types";

export function isBilingual(value: unknown): value is Bilingual {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Bilingual).en === "string" &&
    typeof (value as Bilingual).zhHant === "string"
  );
}

/**
 * Strict AI response validation: both `en` and `zhHant` must be non-empty strings.
 * Names the missing/malformed locale in the error for faster debugging.
 */
export function assertStrictBilingual(
  value: unknown,
  field: string,
): Bilingual {
  if (value == null) {
    throw new Error(
      `Invalid bilingual "${field}": expected { en, zhHant } object, got null/undefined.`,
    );
  }

  if (typeof value === "string") {
    throw new Error(
      `Invalid bilingual "${field}": got a plain string — expected { "en": "...", "zhHant": "..." }.`,
    );
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `Invalid bilingual "${field}": expected { en, zhHant } object.`,
    );
  }

  const record = value as Record<string, unknown>;

  if (typeof record.en !== "string") {
    throw new Error(
      `Invalid bilingual "${field}.en": must be a non-empty string (got ${typeof record.en}).`,
    );
  }
  if (typeof record.zhHant !== "string") {
    throw new Error(
      `Invalid bilingual "${field}.zhHant": must be a non-empty string (got ${typeof record.zhHant}).`,
    );
  }

  const en = record.en.trim();
  const zhHant = record.zhHant.trim();

  if (!en) {
    throw new Error(
      `Invalid bilingual "${field}.en": English text is missing or empty.`,
    );
  }
  if (!zhHant) {
    throw new Error(
      `Invalid bilingual "${field}.zhHant": Traditional Chinese text is missing or empty.`,
    );
  }

  return { en, zhHant };
}

/**
 * Normalize AI / stored narrative into Bilingual.
 * Plain strings are mirrored to both locales (legacy stored sessions / PDF parse).
 * Prefer `assertStrictBilingual` for live DeepSeek response validation.
 */
export function coerceBilingual(value: unknown, field = "text"): Bilingual {
  if (isBilingual(value)) {
    const en = value.en.trim();
    const zhHant = value.zhHant.trim();
    if (!en && !zhHant) {
      throw new Error(`Invalid bilingual "${field}": both locales are empty.`);
    }
    return {
      en: en || zhHant,
      zhHant: zhHant || en,
    };
  }

  if (typeof value === "string" && value.trim()) {
    const text = value.trim();
    return { en: text, zhHant: text };
  }

  throw new Error(
    `Invalid bilingual "${field}": expected string or { en, zhHant }.`,
  );
}

/** Pick the active locale string from a Bilingual (or legacy plain string). */
export function pickBilingual(
  value: Bilingual | string | null | undefined,
  locale: SiteLocale,
): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (locale === "zh-Hant") {
    return value.zhHant || value.en;
  }
  return value.en || value.zhHant;
}

/** Update only the active locale side of a Bilingual value. */
export function patchBilingual(
  current: Bilingual,
  locale: SiteLocale,
  next: string,
): Bilingual {
  if (locale === "zh-Hant") {
    return { en: current.en, zhHant: next };
  }
  return { en: next, zhHant: current.zhHant };
}

export function bilingualBoth(text: string): Bilingual {
  return { en: text, zhHant: text };
}
