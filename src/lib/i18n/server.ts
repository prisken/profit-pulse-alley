import { cookies } from "next/headers";

import {
  DEFAULT_SITE_LOCALE,
  LOCALE_COOKIE_NAME,
  parseSiteLocale,
  type SiteLocale,
} from "@/lib/i18n/locales";
import {
  translate,
  translateWith,
  type MessageKey,
} from "@/lib/i18n/messages";

export async function getServerSiteLocale(): Promise<SiteLocale> {
  const cookieStore = await cookies();
  return parseSiteLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export async function getServerTranslations() {
  const locale = await getServerSiteLocale();
  return {
    locale,
    t: (key: MessageKey) => translate(locale, key),
    tWith: (key: MessageKey, vars: Record<string, string | number>) =>
      translateWith(locale, key, vars),
  };
}

export { DEFAULT_SITE_LOCALE };
export type { MessageKey };
