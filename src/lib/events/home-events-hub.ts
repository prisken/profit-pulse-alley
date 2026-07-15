/** Homepage Events Hub — past events showcase; swap for CMS or DB later. */

import { translate } from "@/lib/i18n/messages";
import type { SiteLocale } from "@/lib/i18n/locales";

export type UpcomingEventShowcase = {
  title: string;
  date: string;
  registerHref: string;
  speakers: Array<{
    name: string;
    role: string;
    headshotSrc: string;
  }>;
};

export type PastEventAccent = "amber" | "pulse" | "sky";

export type PastEventShowcase = {
  title: string;
  summary: string;
  attendeeMetric: string;
  accent: PastEventAccent;
  /** Omit when no archive page exists — homepage card is display-only. */
  archiveHref?: string;
};

/** Past events for the homepage showcase. */
export function getPastEventsShowcase(locale: SiteLocale): PastEventShowcase[] {
  return [
    {
      title: translate(locale, "home.events.past1.title"),
      summary: translate(locale, "home.events.past1.summary"),
      attendeeMetric: translate(locale, "home.events.past1.metric"),
      accent: "pulse",
      archiveHref: "/events/wo-leung-yiu-dou-yiu",
    },
    {
      title: translate(locale, "home.events.pastFortify.title"),
      summary: translate(locale, "home.events.pastFortify.summary"),
      attendeeMetric: translate(locale, "home.events.pastFortify.metric"),
      accent: "amber",
      archiveHref: "/events/fortify-your-future",
    },
  ];
}

/** @deprecated Use getPastEventsShowcase(locale) */
export const PAST_EVENTS_SHOWCASE: PastEventShowcase[] = getPastEventsShowcase("en");
