export const LOCALE_COOKIE_NAME = "ppa_locale";

export const SITE_LOCALES = ["en", "zh-Hant"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

export function isSiteLocale(value: string | null | undefined): value is SiteLocale {
  return value === "en" || value === "zh-Hant";
}

export function parseSiteLocale(value: string | null | undefined): SiteLocale {
  return isSiteLocale(value) ? value : DEFAULT_SITE_LOCALE;
}

export function siteLocaleToHtmlLang(locale: SiteLocale): string {
  return locale;
}

/** Maps site locale to existing Market Pulse launch copy keys. */
export function siteLocaleToMarketPulseLocale(
  locale: SiteLocale,
): "en" | "zh-HK" {
  return locale === "zh-Hant" ? "zh-HK" : "en";
}

export const LOCALE_LABELS: Record<
  SiteLocale,
  { short: string; aria: string }
> = {
  en: { short: "EN", aria: "English" },
  "zh-Hant": { short: "繁", aria: "繁體中文" },
};
