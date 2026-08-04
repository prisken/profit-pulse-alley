import { csvEscape } from "@/lib/admin/csv-download";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

export const WORKSHOP_LEADS_CSV_HEADERS = [
  "createdAt",
  "name",
  "email",
  "phone",
  "industry",
  "age",
  "weakestLayer",
  "riskProfile",
  "ratingScore",
  "selectedGoal",
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
      lead.weakestLayer ?? "",
      lead.riskProfile ?? "",
      lead.ratingScore == null ? "" : String(lead.ratingScore),
      lead.selectedGoal?.trim() ?? "",
    ]
      .map((value) => csvEscape(value))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
