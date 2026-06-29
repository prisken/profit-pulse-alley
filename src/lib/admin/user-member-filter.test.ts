import { describe, expect, it } from "vitest";

import {
  filterAdminMembers,
  type AdminMemberFilterRow,
} from "@/lib/admin/user-member-filter";

const members: AdminMemberFilterRow[] = [
  {
    name: "Alice Admin",
    email: "alice@example.com",
    contactNumber: "+85211112222",
    role: "ADMIN",
  },
  {
    name: "Bob User",
    email: "bob@example.com",
    contactNumber: null,
    role: "USER",
  },
];

describe("filterAdminMembers", () => {
  it("returns all members when query and filter are empty", () => {
    expect(filterAdminMembers(members, "", "ALL")).toHaveLength(2);
  });

  it("filters by email substring", () => {
    expect(filterAdminMembers(members, "bob@", "ALL")).toHaveLength(1);
    expect(filterAdminMembers(members, "bob@", "ALL")[0]?.email).toBe(
      "bob@example.com",
    );
  });

  it("filters by contact number", () => {
    expect(filterAdminMembers(members, "11112222", "ALL")).toHaveLength(1);
  });

  it("filters by role", () => {
    expect(filterAdminMembers(members, "", "ADMIN")).toHaveLength(1);
    expect(filterAdminMembers(members, "", "USER")).toHaveLength(1);
  });

  it("combines search and role filter", () => {
    expect(filterAdminMembers(members, "alice", "USER")).toHaveLength(0);
    expect(filterAdminMembers(members, "alice", "ADMIN")).toHaveLength(1);
  });
});
