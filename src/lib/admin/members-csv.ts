import { csvEscape } from "@/lib/admin/csv-download";
import type { AdminMemberRow } from "@/lib/admin/members-types";

export function buildAcquisitionMembersCsv(members: AdminMemberRow[]): string {
  const header = [
    "name",
    "email",
    "contactNumber",
    "role",
    "learningInterest",
    "learningInterestCapturedAt",
    "learningInterestPromptDismissedAt",
    "nextStepPreference",
    "nextStepCapturedAt",
    "nextStepPromptDismissedAt",
  ].join(",");

  const lines = members.map((member) => {
    const acquisition = member.acquisition;

    return [
      member.name?.trim() ?? "",
      member.email,
      member.contactNumber?.trim() ?? "",
      member.role,
      acquisition?.learningInterest ?? "",
      acquisition?.learningInterestCapturedAt ?? "",
      acquisition?.learningInterestPromptDismissedAt ?? "",
      acquisition?.nextStepPreference ?? "",
      acquisition?.nextStepCapturedAt ?? "",
      acquisition?.nextStepPromptDismissedAt ?? "",
    ]
      .map((value) => csvEscape(value))
      .join(",");
  });

  return [header, ...lines].join("\n");
}
