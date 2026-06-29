export type AdminMemberRoleFilter = "ALL" | "USER" | "ADMIN";

export type AdminMemberFilterRow = {
  name: string | null;
  email: string;
  contactNumber: string | null;
  role: "USER" | "ADMIN";
};

export function filterAdminMembers<T extends AdminMemberFilterRow>(
  members: T[],
  query: string,
  roleFilter: AdminMemberRoleFilter,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return members.filter((member) => {
    if (roleFilter !== "ALL" && member.role !== roleFilter) {
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
