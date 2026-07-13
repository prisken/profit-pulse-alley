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
    learningInterest: "market_outlook",
    nextStepPreference: null,
  },
  {
    name: "Bob User",
    email: "bob@example.com",
    contactNumber: null,
    role: "USER",
    learningInterest: null,
    nextStepPreference: "market_recap",
  },
  {
    name: "Carol User",
    email: "carol@example.com",
    contactNumber: "+85299998888",
    role: "USER",
    learningInterest: null,
    nextStepPreference: null,
  },
];

describe("filterAdminMembers", () => {
  it("returns all members when query and filters are empty", () => {
    expect(filterAdminMembers(members, "", "ALL")).toHaveLength(3);
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
    expect(filterAdminMembers(members, "", "USER")).toHaveLength(2);
  });

  it("combines search and role filter", () => {
    expect(filterAdminMembers(members, "alice", "USER")).toHaveLength(0);
    expect(filterAdminMembers(members, "alice", "ADMIN")).toHaveLength(1);
  });

  it("filters by learning interest slug", () => {
    expect(
      filterAdminMembers(members, "", "ALL", "market_outlook", "ALL"),
    ).toHaveLength(1);
    expect(
      filterAdminMembers(members, "", "ALL", "market_outlook", "ALL")[0]?.email,
    ).toBe("alice@example.com");
  });

  it("filters by next-step preference slug", () => {
    expect(
      filterAdminMembers(members, "", "ALL", "ALL", "market_recap"),
    ).toHaveLength(1);
    expect(
      filterAdminMembers(members, "", "ALL", "ALL", "market_recap")[0]?.email,
    ).toBe("bob@example.com");
  });

  it("filters unset learning interest and next step", () => {
    expect(
      filterAdminMembers(members, "", "ALL", "UNSET", "ALL"),
    ).toHaveLength(2);
    expect(
      filterAdminMembers(members, "", "ALL", "ALL", "UNSET"),
    ).toHaveLength(2);
  });

  it("keeps search working with acquisition filters", () => {
    expect(
      filterAdminMembers(members, "carol", "ALL", "UNSET", "UNSET"),
    ).toHaveLength(1);
    expect(
      filterAdminMembers(members, "99998888", "ALL", "UNSET", "UNSET"),
    ).toHaveLength(1);
  });
});
