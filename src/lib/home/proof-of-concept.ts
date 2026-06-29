/** Experts shown in the homepage Proof of Concept section. */

import { translate } from "@/lib/i18n/messages";
import type { SiteLocale } from "@/lib/i18n/locales";

export type ExpertShowcase = {
  name: string;
  title: string;
  bio: string;
  headshotSrc: string;
  imageObjectPosition?: "center" | "top";
};

export function getExpertsShowcase(locale: SiteLocale): ExpertShowcase[] {
  return [
    {
      name: "Vicky Huang",
      title: translate(locale, "home.experts.vicky.title"),
      bio: translate(locale, "home.experts.vicky.bio"),
      headshotSrc: "/vicky-headshot.png",
      imageObjectPosition: "center",
    },
    {
      name: "Marcy Chan",
      title: translate(locale, "home.experts.marcy.title"),
      bio: translate(locale, "home.experts.marcy.bio"),
      headshotSrc: "/marcy-chan-headshot.png",
      imageObjectPosition: "top",
    },
  ];
}

/** @deprecated Use getExpertsShowcase(locale) */
export const EXPERTS_SHOWCASE: ExpertShowcase[] = getExpertsShowcase("en");

/** @deprecated Use translate(locale, "home.philosophy.quote") */
export const INVESTMENT_PHILOSOPHY =
  "Profit Pulse Ally helps ambitious founders and investors think in systems — balancing offense and defense, cash flow and compounding — so every move moves you closer to a zero-cost life. That same rigor powers the PPA Take in Market Pulse: expert-backed judgment you can test, refine, and apply before real capital is on the line.";
