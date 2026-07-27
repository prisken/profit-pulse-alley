import type { SiteLocale } from "@/lib/i18n/locales";
import type { EventDetailData } from "@/lib/events/types";

export const FORTIFY_LUNCH_LEARN_POSTER =
  "/images/fortify-lunch-learn-july-2026-poster.png";

export const FORTIFY_LUNCH_LEARN_REGISTRATION_PATH = "/fortify-registration";

const HERO = {
  mobileSrc: FORTIFY_LUNCH_LEARN_POSTER,
  desktopSrc: FORTIFY_LUNCH_LEARN_POSTER,
  alt: "Fortify Your Future (Lunch & Learn) — 30 July 2026 at WeWork Taikoo",
} as const;

const enEvent: EventDetailData = {
  pageTitle: "Fortify Your Future (Lunch & Learn) | Profit Pulse Ally",
  title: "Fortify Your Future (Lunch & Learn)",
  subtitle:
    "An exclusive midday Lunch & Learn for Hong Kong founders — case study, discussion, and collaboration over a complimentary light lunch.",
  highlights: [
    {
      label: "Case study:",
      text: "Ghost in the Shopping Cart! — Amazon's AI Sales Engine.",
    },
    {
      label: "Guest speaker:",
      text: "Vickie Yau — Ph.D. (Education, HKU); Regional APAC Corporate Trainer and Facilitator; Coach for Executives and Organisational Leaders.",
    },
    {
      label: "Professional headshot:",
      text: "Complimentary professional headshot for attendees.",
    },
    {
      label: "Complimentary light lunch:",
      text: "Join us for a focused midday session with lunch included.",
    },
    {
      label: "Discussion & collaboration:",
      text: "Useful discussion and business collaboration with a curated founder group.",
    },
  ],
  registrationLink: FORTIFY_LUNCH_LEARN_REGISTRATION_PATH,
  registrationText: "Register now",
  registrationDisabled: false,
  speakersSectionTitle: "Guest speaker",
  speakers: [
    {
      name: "Vickie Yau",
      title:
        "Ph.D. (Education, HKU) · Regional APAC Corporate Trainer and Facilitator · Coach for Executives and Organisational Leaders",
      bio: "Vickie joins Profit Pulse Ally and WeWork for this Lunch & Learn case study on Amazon's AI sales engine — Ghost in the Shopping Cart! — with practical discussion for founders and operators.",
    },
  ],
  agenda: [
    {
      time: "12:30",
      description: "Arrival, networking & complimentary light lunch",
    },
    {
      time: "12:45",
      description:
        "Case study & discussion: Ghost in the Shopping Cart! — Amazon's AI Sales Engine with Vickie Yau",
    },
    {
      time: "13:20",
      description: "Business collaboration & closing",
    },
    {
      time: "13:30",
      description: "Session ends",
    },
  ],
  venueDescription:
    "Join us at WeWork Taikoo, Room 22B — a focused Lunch & Learn space for founders, operators, and collaborators.",
  eventDateTime: "30th July 2026 (Thursday), 12:30–13:30",
  eventLocation: "WeWork Taikoo, Room 22B",
  eventCost: "Free",
  heroImage: HERO,
};

const zhEvent: EventDetailData = {
  pageTitle: "守業增值創未來（Lunch & Learn）| Profit Pulse Ally",
  title: "守業增值創未來（Lunch & Learn）",
  subtitle:
    "專為香港創業者而設的午間 Lunch & Learn——案例分享、深度討論與協作交流，並提供輕食午餐。",
  highlights: [
    {
      label: "案例研討：",
      text: "Ghost in the Shopping Cart! — Amazon 的 AI 銷售引擎。",
    },
    {
      label: "嘉賓講者：",
      text: "Vickie Yau — 香港大學教育學博士；亞太區企業培訓師與引導者；高管與組織領袖教練。",
    },
    {
      label: "專業形象照：",
      text: "出席者可獲專業頭像拍攝。",
    },
    {
      label: "免費輕食午餐：",
      text: "聚焦午間時段，活動包含輕食午餐。",
    },
    {
      label: "討論與協作：",
      text: "實用討論與商業協作，連結精選創業者社群。",
    },
  ],
  registrationLink: FORTIFY_LUNCH_LEARN_REGISTRATION_PATH,
  registrationText: "立即報名",
  registrationDisabled: false,
  speakersSectionTitle: "嘉賓講者",
  speakers: [
    {
      name: "Vickie Yau",
      title:
        "香港大學教育學博士 · 亞太區企業培訓師與引導者 · 高管與組織領袖教練",
      bio: "Vickie 將與 Profit Pulse Ally 及 WeWork 一同主持本次 Lunch & Learn，分享 Amazon AI 銷售引擎案例「Ghost in the Shopping Cart!」，並與創業者及營運者進行實務討論。",
    },
  ],
  agenda: [
    {
      time: "12:30",
      description: "到達、交流與免費輕食午餐",
    },
    {
      time: "12:45",
      description:
        "案例分享與討論：Ghost in the Shopping Cart! — Amazon 的 AI 銷售引擎（Vickie Yau）",
    },
    {
      time: "13:20",
      description: "商業協作與總結",
    },
    {
      time: "13:30",
      description: "活動結束",
    },
  ],
  venueDescription:
    "活動於 WeWork Taikoo 22B 室舉行——適合創業者、營運者與協作夥伴的 Lunch & Learn 空間。",
  eventDateTime: "2026年7月30日（星期四），12:30–13:30",
  eventLocation: "WeWork Taikoo 22B 室",
  eventCost: "免費",
  heroImage: {
    ...HERO,
    alt: "守業增值創未來（Lunch & Learn）— 2026年7月30日於 WeWork Taikoo",
  },
};

/** July 2026 Lunch & Learn — open for registration. */
export function getFortifySalesMarketingEvent(
  locale: SiteLocale,
): EventDetailData {
  return locale === "zh-Hant" ? zhEvent : enEvent;
}

/** @deprecated Prefer getFortifySalesMarketingEvent(locale) for bilingual pages. */
export const fortifySalesMarketingEvent = enEvent;
