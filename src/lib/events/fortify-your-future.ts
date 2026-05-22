import type { EventDetailData } from "@/lib/events/types";

export const fortifyYourFutureEvent: EventDetailData = {
  pageTitle: "Fortify Your Future | Profit Pulse Ally",
  title: "Fortify Your Future / 守業增值創未來",
  subtitle:
    "A Fireside Chat with WeWork for Hong Kong's Ambitious Founders.",
  highlights: [
    {
      label: "Exclusive Partnership:",
      text: "An event co-hosted with WeWork.",
    },
    {
      label: "Expert Speakers:",
      text: "Featuring Zeppelin Hot Dog co-founder and business succession experts.",
    },
    {
      label: "High-Value Networking:",
      text: "Connect with a curated group of ambitious founders.",
    },
  ],
  registrationLink: "#",
  registrationText: "Registration Opens Soon / 即將開放報名",
  speakersSectionTitle: "Meet the Speakers / 本次活動嘉賓",
  speakers: [
    {
      name: "Vicky Huang",
      title: "Co-founder, Zeppelin Hot Dog",
      bio: "How does a local brand scale into a kingdom? Vicky will share the invaluable, first-hand experience of Zeppelin Hot Dog's growth, covering her strategies for securing funding and navigating expansion.",
    },
    {
      name: "Prisken & Kevin",
      title: "Founders, ProfitPulseAlly",
      bio: "What is your business really worth, and what is your exit plan? As experts in business valuation and succession planning, Prisken and Kevin will deconstruct the essential strategies for building a lasting legacy beyond yourself.",
    },
  ],
  agenda: [
    { time: "19:00 - 19:30:", description: "Arrival & Networking" },
    {
      time: "19:30 - 20:30:",
      description: "Fireside Chat: Fortify Your Future",
    },
    {
      time: "20:30 - 21:00:",
      description: "Interactive Q&A with the Audience",
    },
    { time: "21:00 onwards:", description: "Deep Networking & Closing" },
  ],
  venueDescription:
    "The event will be held at a premium WeWork location, providing a professional and inspiring environment for networking and learning.",
  eventDateTime: "[Please Insert New Date & Time]",
  eventLocation: "[Please Insert WeWork Address]",
  eventCost: "Free (Registration via WeWork)",
  heroImage: {
    mobileSrc: "/images/fortify-event-poster.png",
    desktopSrc: "/images/fortify-event-poster.png",
    alt: "Fortify Your Future / 守業增值創未來 — event poster",
  },
};
