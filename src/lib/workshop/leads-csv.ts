import { csvEscape } from "@/lib/admin/csv-download";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

export const WORKSHOP_LEADS_CSV_HEADERS = [
  "createdAt",
  "name",
  "email",
  "phone",
  "industry",
  "age",
  "retirementAge",
  "assetsDepletedAtAge",
  "weakestLayer",
  "riskProfile",
  "ratingScore",
  "selectedGoal",
  "stressTestVerdict",
  "profileBehaviorMismatch",
] as const;

/**
 * Builds a CSV string for Workshop Pyramid Lab lead rows.
 */
export function buildWorkshopLeadsCsv(leads: WorkshopAdminLeadRow[]): string {
  const header = WORKSHOP_LEADS_CSV_HEADERS.join(",");

  const lines = leads.map((lead) =>
    [
      lead.createdAt,
      lead.name,
      lead.email,
      lead.phone.trim(),
      lead.industry,
      String(lead.age),
      lead.retirementAge == null ? "" : String(lead.retirementAge),
      lead.assetsDepletedAtAge == null
        ? ""
        : String(lead.assetsDepletedAtAge),
      lead.weakestLayer ?? "",
      lead.riskProfile ?? "",
      lead.ratingScore == null ? "" : String(lead.ratingScore),
      lead.selectedGoal?.trim() ?? "",
      lead.stressTestVerdict ?? "",
      lead.profileBehaviorMismatch == null
        ? ""
        : lead.profileBehaviorMismatch
          ? "true"
          : "false",
    ]
      .map((value) => csvEscape(value))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
