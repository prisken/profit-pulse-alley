import type { SiteLocale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/messages";

/** Locale-aware copy for the Fortify Sales & Marketing upcoming event card. */
export function getFortifySalesMarketingShowcase(locale: SiteLocale) {
  const title =
    locale === "zh-Hant"
      ? translate(locale, "home.events.upcoming.salesMarketing.titleZh")
      : translate(locale, "home.events.upcoming.salesMarketing.title");

  return {
    title,
    blurb: translate(locale, "events.hub.upcoming.salesMarketing.blurb"),
    date: translate(locale, "home.events.upcoming.salesMarketing.date"),
    location: translate(locale, "home.events.upcoming.salesMarketing.location"),
  };
}
