import type { EventDetailData } from "@/lib/events/types";

/** Original June 2026 fireside — archived; registration closed. */
export const fortifyYourFutureEvent: EventDetailData = {
  pageTitle: "Fortify Your Future | Profit Pulse Ally",
  title: "Fortify Your Future / 守業增值創未來",
  subtitle:
    "A Fireside Chat on Business Defense & Investment for Hong Kong's Ambitious Founders.",
  highlights: [
    {
      label: "Free Professional Headshot:",
      text: "Get a free business headshot from a professional photographer.",
    },
    {
      label: "Star Speakers:",
      text: "Featuring Vicky Huang (Zeppelin Hot Dog Co-founder) & Marcy Chan (Bestselling Author).",
    },
    {
      label: "High-Value Networking:",
      text: "Connect with a curated group of ambitious founders.",
    },
  ],
  registrationLink: "/fortify-survey",
  registrationText: "Registration Closed / 報名已結束",
  registrationDisabled: true,
  speakersSectionTitle: "Meet the Speakers / 本次活動嘉賓",
  speakers: [
    {
      name: "Vicky Huang",
      title: "Co-founder, Zeppelin Hot Dog",
      bio: "How does a local brand scale into a kingdom? Vicky will share the invaluable, first-hand experience of Zeppelin Hot Dog's growth, covering her strategies for securing funding and navigating expansion.",
    },
    {
      name: "Marcy Chan",
      title: "Bestselling Author,《以「輪」擊石》",
      bio: 'Author of the bestselling investment book "以「輪」擊石", Marcy will be on-site to exclusively deconstruct the practical mindset for building new-generation passive income streams, helping you establish a second income.',
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
    "Join us at WeWork YF Life Tower — a premium city-center venue with an inspiring environment for networking and learning.",
  eventDateTime: "June 26th (Friday), 7:00 PM – 9:00 PM",
  eventLocation: "WeWork YF Life Tower",
  eventCost: "Free",
  heroImage: {
    mobileSrc: "/images/fortify-event-poster.png",
    desktopSrc: "/images/fortify-event-poster.png",
    alt: "Fortify Your Future / 守業增值創未來 — event poster",
  },
};
