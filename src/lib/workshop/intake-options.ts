import type { MessageKey } from "@/lib/i18n/messages";

/**
 * Stable English enum keys for Workshop Pyramid Lab intake.
 * Display labels come from the i18n catalog; AI prompts use English labels.
 */

export const WORKSHOP_INDUSTRY_KEYS = [
  "tech",
  "finance",
  "healthcare",
  "legal",
  "realEstate",
  "civilService",
  "education",
  "hospitality",
  "selfEmployed",
  "other",
] as const;

export type WorkshopIndustryKey = (typeof WORKSHOP_INDUSTRY_KEYS)[number];

export const WORKSHOP_HOUSEHOLD_KEYS = [
  "single",
  "marriedNoKids",
  "marriedWithKids",
  "singleParent",
] as const;

export type WorkshopHouseholdKey = (typeof WORKSHOP_HOUSEHOLD_KEYS)[number];

export const INDUSTRY_LABEL_KEYS: Record<WorkshopIndustryKey, MessageKey> = {
  tech: "workshop.intake.industries.tech",
  finance: "workshop.intake.industries.finance",
  healthcare: "workshop.intake.industries.healthcare",
  legal: "workshop.intake.industries.legal",
  realEstate: "workshop.intake.industries.realEstate",
  civilService: "workshop.intake.industries.civilService",
  education: "workshop.intake.industries.education",
  hospitality: "workshop.intake.industries.hospitality",
  selfEmployed: "workshop.intake.industries.selfEmployed",
  other: "workshop.intake.industries.other",
};

export const HOUSEHOLD_LABEL_KEYS: Record<WorkshopHouseholdKey, MessageKey> = {
  single: "workshop.intake.household.single",
  marriedNoKids: "workshop.intake.household.marriedNoKids",
  marriedWithKids: "workshop.intake.household.marriedWithKids",
  singleParent: "workshop.intake.household.singleParent",
};

/** Stable English labels for DeepSeek prompts (never translated). */
export const INDUSTRY_AI_LABELS: Record<WorkshopIndustryKey, string> = {
  tech: "Tech",
  finance: "Finance",
  healthcare: "Healthcare",
  legal: "Legal",
  realEstate: "Real Estate",
  civilService: "Civil Service",
  education: "Education",
  hospitality: "F&B/Hospitality",
  selfEmployed: "Self-Employed",
  other: "Other",
};

export const HOUSEHOLD_AI_LABELS: Record<WorkshopHouseholdKey, string> = {
  single: "Single",
  marriedNoKids: "Married no kids",
  marriedWithKids: "Married with kids",
  singleParent: "Single parent",
};

export function isWorkshopIndustryKey(
  value: string,
): value is WorkshopIndustryKey {
  return (WORKSHOP_INDUSTRY_KEYS as readonly string[]).includes(value);
}

export function isWorkshopHouseholdKey(
  value: string,
): value is WorkshopHouseholdKey {
  return (WORKSHOP_HOUSEHOLD_KEYS as readonly string[]).includes(value);
}

/**
 * Industry string for AI prompts. Known keys → English label;
 * `other` → free-text when provided, else "Other".
 */
export function formatIndustryForAi(
  key: WorkshopIndustryKey | string,
  otherText?: string | null,
): string {
  if (key === "other") {
    const trimmed = otherText?.trim();
    return trimmed || INDUSTRY_AI_LABELS.other;
  }
  if (isWorkshopIndustryKey(key)) {
    return INDUSTRY_AI_LABELS[key];
  }
  return key.trim() || INDUSTRY_AI_LABELS.other;
}

export function formatHouseholdForAi(
  key: WorkshopHouseholdKey | string | null | undefined,
): string {
  if (!key) {
    return "not specified";
  }
  if (isWorkshopHouseholdKey(key)) {
    return HOUSEHOLD_AI_LABELS[key];
  }
  return key.trim() || "not specified";
}
