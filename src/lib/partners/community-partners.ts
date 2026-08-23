/**
 * Community Collaborators & Venues — partner/venue logo strip for PPA.
 *
 * COMPLIANCE (hard rules — do not remove):
 * - Logos are for community/event illustration only. Never imply endorsement,
 *   formal partnership, product sponsorship, or financial-service recommendation.
 * - Only display logos Prisken has written permission for (document it).
 * - The disclaimer must stay directly under the logos.
 */

export type PartnerGroup = "venues" | "educational";

export type CommunityPartner = {
  slug: string;
  name: string;
  nameZh?: string;
  file: string; // /partners/<file>.png
  group: PartnerGroup;
  width: number; // native px at h=96
  height: number;
};

export const COMMUNITY_PARTNERS: CommunityPartner[] = [
  // Venues & community
  { slug: "honor-district", name: "Honor District", nameZh: "Honor District", file: "/partners/honor-district.png", group: "venues", width: 96, height: 96 },
  { slug: "profi", name: "PROFI", file: "/partners/profi.png", group: "venues", width: 137, height: 96 },
  { slug: "pm", name: "PM", file: "/partners/pm.png", group: "venues", width: 94, height: 96 },
  // Educational session collaborators
  { slug: "deutsche-bank", name: "Deutsche Bank", file: "/partners/deutsche-bank.png", group: "educational", width: 389, height: 96 },
  { slug: "abc-china", name: "Agricultural Bank of China", nameZh: "中國農業銀行", file: "/partners/abc-china.png", group: "educational", width: 477, height: 96 },
  { slug: "chang-hwa-bank", name: "Chang Hwa Bank", nameZh: "彰化銀行", file: "/partners/chang-hwa-bank.png", group: "educational", width: 577, height: 96 },
  { slug: "vp-bank", name: "VP Bank", file: "/partners/vp-bank.png", group: "educational", width: 291, height: 96 },
  { slug: "uob-kay-hian", name: "UOB Kay Hian", file: "/partners/uob-kay-hian.png", group: "educational", width: 467, height: 96 },
  { slug: "deloitte", name: "Deloitte", nameZh: "德勤", file: "/partners/deloitte.png", group: "educational", width: 212, height: 96 },
  { slug: "ey", name: "EY", nameZh: "安永", file: "/partners/ey.png", group: "educational", width: 123, height: 96 },
];

export function partnersByGroup(group: PartnerGroup): CommunityPartner[] {
  return COMMUNITY_PARTNERS.filter((p) => p.group === group);
}
