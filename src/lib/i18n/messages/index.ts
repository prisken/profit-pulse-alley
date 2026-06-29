import type { SiteLocale } from "@/lib/i18n/locales";
import { enMessages, type MessageKey, type Messages } from "@/lib/i18n/messages/en";
import { zhHantMessages } from "@/lib/i18n/messages/zh-Hant";

export const MESSAGES_BY_LOCALE: Record<SiteLocale, Messages> = {
  en: enMessages,
  "zh-Hant": zhHantMessages,
};

export function translate(
  locale: SiteLocale,
  key: MessageKey,
): string {
  return MESSAGES_BY_LOCALE[locale][key] ?? MESSAGES_BY_LOCALE.en[key];
}

export function translateWith(
  locale: SiteLocale,
  key: MessageKey,
  vars: Record<string, string | number>,
): string {
  let text = translate(locale, key);
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export type { MessageKey, Messages };
