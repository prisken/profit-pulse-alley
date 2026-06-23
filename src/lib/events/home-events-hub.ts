/** Homepage Events Hub — placeholder past events; swap for CMS or DB later. */

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
export const PAST_EVENTS_SHOWCASE: PastEventShowcase[] = [
  {
    title: "《我兩樣都要》線下戰略會議",
    summary:
      "Founders explored how to scale a business while building long-term wealth with Vicky Huang and Marcy Chan.",
    attendeeMetric: "150+ Attendees",
    archiveHref: "/events/wo-leung-yiu-dou-yiu",
  },
  {
    title: "The Zero-Cost Life Salon",
    summary:
      "A practical evening on designing passive income streams without sacrificing your day-to-day cash flow.",
    attendeeMetric: "120+ Attendees",
    archiveHref: "/events/archive/zero-cost-life-salon",
  },
  {
    title: "Founder's Funding Roundtable",
    summary:
      "Early-stage founders traded real stories on pitching, term sheets, and surviving your first capital raise.",
    attendeeMetric: "90+ Attendees",
    archiveHref: "/events/archive/founders-funding-roundtable",
  },
];
