import { csvEscape } from "@/lib/admin/csv-download";
import type { MatchingPulseAdminRequestRow } from "@/lib/matching-pulse/admin-filters";

/** CSV header order for Matching Pulse admin export. adminNotes intentionally omitted. */
export const MATCHING_PULSE_CSV_HEADERS = [
  "createdAt",
  "status",
  "requesterName",
  "requesterEmail",
  "company",
  "title",
  "requestType",
  "category",
  "urgency",
  "source",
  "contactPhone",
  "contactMethod",
  "description",
  "idealMatch",
  "consentToContact",
  "consentToShare",
  "tags",
] as const;

function csvBool(value: boolean): string {
  return value ? "true" : "false";
}

function csvOptional(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/**
 * Builds a CSV string for Matching Pulse admin list rows.
 * Includes tags (admin-only). Does not include adminNotes (MVP: avoid accidental sharing).
 */
export function buildMatchingPulseRequestsCsv(
  rows: MatchingPulseAdminRequestRow[],
): string {
  const header = MATCHING_PULSE_CSV_HEADERS.join(",");

  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.status,
      csvOptional(row.user.name),
      row.user.email,
      csvOptional(row.company),
      row.title,
      row.requestType,
      row.category,
      csvOptional(row.urgency),
      csvOptional(row.source),
      csvOptional(row.contactPhone),
      csvOptional(row.contactMethod),
      row.description,
      csvOptional(row.idealMatch),
      csvBool(row.consentToContact),
      csvBool(row.consentToShare),
      csvOptional(row.tags),
    ]
      .map((value) => csvEscape(value))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
