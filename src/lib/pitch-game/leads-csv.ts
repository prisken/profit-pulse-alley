import { csvEscape } from "@/lib/admin/csv-download";
import type { PitchAdminLeadRow } from "@/lib/pitch-game/admin-data";

export const PITCH_LEADS_CSV_HEADERS = [
  "createdAt",
  "name",
  "email",
  "phone",
  "company",
  "concern",
  "archetype",
  "metric",
  "round",
  "band",
  "posture",
  "inputs",
  "reaction",
  "condition",
  "automationFix",
] as const;

/**
 * Builds a CSV string for Pitch Meeting lead rows.
 * `inputs` is flattened as "Label: value" pairs joined by "; ".
 */
export function buildPitchLeadsCsv(leads: PitchAdminLeadRow[]): string {
  const header = PITCH_LEADS_CSV_HEADERS.join(",");

  const lines = leads.map((lead) =>
    [
      lead.createdAt,
      lead.name,
      lead.email,
      lead.phone.trim(),
      lead.company,
      lead.concern?.trim() ?? "",
      lead.archetypeLabel ?? "",
      lead.metricLabel ?? "",
      lead.roundLabel ?? "",
      lead.band ?? "",
      lead.postureLabel ?? "",
      lead.inputs.map((i) => `${i.label}: ${i.value}`).join("; "),
      lead.reaction?.trim() ?? "",
      lead.condition?.trim() ?? "",
      lead.automationFix?.trim() ?? "",
    ]
      .map((value) => csvEscape(value))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
