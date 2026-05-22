import type { ReactNode } from "react";

export type EventHighlight = {
  label: string;
  text: string;
};

export type EventSpeaker = {
  name: string;
  title: string;
  bio: string;
};

export type AgendaItem = {
  time: string;
  description: string;
};

export type EventDetailData = {
  title: string;
  subtitle: string;
  highlights: EventHighlight[];
  registrationLink: string;
  registrationText: string;
  registrationDisabled?: boolean;
  speakersSectionTitle: string;
  speakers: EventSpeaker[];
  agenda: AgendaItem[];
  venueDescription: string;
  eventDateTime: string;
  eventLocation: string;
  eventCost: string;
  mapHtml?: ReactNode;
  pastEventBanner?: ReactNode;
  pageTitle?: string;
  heroImage?: {
    mobileSrc: string;
    desktopSrc: string;
    alt: string;
  };
};
