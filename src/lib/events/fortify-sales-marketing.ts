import type { EventDetailData } from "@/lib/events/types";

/** July 2026 Lunch & Learn edition — coming soon. */
export const fortifySalesMarketingEvent: EventDetailData = {
  pageTitle: "Fortify Your Future (Lunch & Learn) | Profit Pulse Ally",
  title: "Fortify Your Future (Lunch & Learn) / 守業增值創未來（Lunch & Learn）",
  subtitle:
    "An exclusive Lunch & Learn for Hong Kong's ambitious founders. Full programme details to be announced.",
  highlights: [
    {
      label: "Lunch & Learn:",
      text: "A focused midday session designed for busy founders.",
    },
    {
      label: "Expert Speakers:",
      text: "Guest speakers to be announced.",
    },
    {
      label: "Founder Networking:",
      text: "Connect with a curated group of ambitious operators.",
    },
  ],
  registrationLink: "/events",
  registrationText: "Coming Soon / 敬請期待",
  registrationDisabled: true,
  speakersSectionTitle: "Speakers / 嘉賓",
  speakers: [
    {
      name: "To be announced",
      title: "Guest Speaker TBA / 嘉賓待定",
      bio: "Speaker details will be shared closer to the event date.",
    },
  ],
  agenda: [
    {
      time: "TBC",
      description: "Full agenda to be announced / 詳細流程待定",
    },
  ],
  venueDescription:
    "Venue to be confirmed. Check back for updates on location and registration.",
  eventDateTime: "July",
  eventLocation: "TBC",
  eventCost: "TBC",
  heroImage: {
    mobileSrc: "/images/fortify-hero-chess-king.png",
    desktopSrc: "/images/fortify-hero-1600.png",
    alt: "Fortify Your Future (Lunch & Learn) — coming soon",
  },
};
