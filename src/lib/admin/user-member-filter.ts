export type AdminMemberRoleFilter = "ALL" | "USER" | "ADMIN";

export type AdminAcquisitionFilter = "ALL" | "UNSET" | string;

export type AdminMemberFilterRow = {
  name: string | null;
  email: string;
  contactNumber: string | null;
  role: "USER" | "ADMIN";
  learningInterest: string | null;
  nextStepPreference: string | null;
};

function matchesAcquisitionFilter(
  value: string | null,
  filter: AdminAcquisitionFilter,
): boolean {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "UNSET") {
    return !value;
  }

  return value === filter;
}

export function filterAdminMembers<T extends AdminMemberFilterRow>(
  members: T[],
  query: string,
  roleFilter: AdminMemberRoleFilter,
  learningInterestFilter: AdminAcquisitionFilter = "ALL",
  nextStepPreferenceFilter: AdminAcquisitionFilter = "ALL",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return members.filter((member) => {
    if (roleFilter !== "ALL" && member.role !== roleFilter) {
      return false;
    }

    if (!matchesAcquisitionFilter(member.learningInterest, learningInterestFilter)) {
      return false;
    }

    if (!matchesAcquisitionFilter(member.nextStepPreference, nextStepPreferenceFilter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [member.name, member.email, member.contactNumber]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
