/** Homepage Events Hub — placeholder past events; swap for CMS or DB later. */

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

export type PastEventShowcase = {
  title: string;
  summary: string;
  attendeeMetric: string;
  archiveHref: string;
};

/** Placeholder past events for the homepage showcase. */
export function getPastEventsShowcase(locale: SiteLocale): PastEventShowcase[] {
  return [
    {
      title: translate(locale, "home.events.past1.title"),
      summary: translate(locale, "home.events.past1.summary"),
      attendeeMetric: translate(locale, "home.events.past1.metric"),
      archiveHref: "/events/wo-leung-yiu-dou-yiu",
    },
    {
      title: translate(locale, "home.events.pastFortify.title"),
      summary: translate(locale, "home.events.pastFortify.summary"),
      attendeeMetric: translate(locale, "home.events.pastFortify.metric"),
      archiveHref: "/events/fortify-your-future",
    },
    {
      title: translate(locale, "home.events.past2.title"),
      summary: translate(locale, "home.events.past2.summary"),
      attendeeMetric: translate(locale, "home.events.past2.metric"),
      archiveHref: "/events/archive/zero-cost-life-salon",
    },
    {
      title: translate(locale, "home.events.past3.title"),
      summary: translate(locale, "home.events.past3.summary"),
      attendeeMetric: translate(locale, "home.events.past3.metric"),
      archiveHref: "/events/archive/founders-funding-roundtable",
    },
  ];
}

/** @deprecated Use getPastEventsShowcase(locale) */
export const PAST_EVENTS_SHOWCASE: PastEventShowcase[] = getPastEventsShowcase("en");
