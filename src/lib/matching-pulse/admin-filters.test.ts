import { describe, expect, it } from "vitest";

import {
  filterMatchingPulseAdminRequests,
  type MatchingPulseAdminRequestRow,
} from "@/lib/matching-pulse/admin-filters";

function row(
  overrides: Partial<MatchingPulseAdminRequestRow> &
    Pick<MatchingPulseAdminRequestRow, "id" | "title" | "status" | "category">,
): MatchingPulseAdminRequestRow {
  return {
    company: null,
    contactPhone: null,
    contactMethod: null,
    requestType: "NEED_HELP",
    urgency: null,
    source: "direct",
    description: "Sample description",
    idealMatch: null,
    consentToContact: true,
    consentToShare: false,
    tags: null,
    createdAt: "2026-07-10T00:00:00.000Z",
    user: {
      id: "u1",
      name: "Alex",
      email: "alex@example.com",
      contactNumber: null,
    },
    ...overrides,
  };
}

describe("filterMatchingPulseAdminRequests", () => {
  const requests = [
    row({
      id: "1",
      title: "Marketing partner",
      status: "NEW",
      category: "BUSINESS",
      company: "Acme",
      user: {
        id: "u1",
        name: "Alex Wong",
        email: "alex@example.com",
        contactNumber: null,
      },
    }),
    row({
      id: "2",
      title: "Career intro",
      status: "REVIEWING",
      category: "CAREER",
      source: "events",
      user: {
        id: "u2",
        name: "Sam",
        email: "sam@ppa.com",
        contactNumber: null,
      },
    }),
  ];

  it("filters by status and category", () => {
    expect(
      filterMatchingPulseAdminRequests(requests, {
        status: "NEW",
        category: "ALL",
        query: "",
      }),
    ).toHaveLength(1);

    expect(
      filterMatchingPulseAdminRequests(requests, {
        status: "ALL",
        category: "CAREER",
        query: "",
      }).map((r) => r.id),
    ).toEqual(["2"]);
  });

  it("searches title, company, name, and email", () => {
    expect(
      filterMatchingPulseAdminRequests(requests, {
        status: "ALL",
        category: "ALL",
        query: "acme",
      }).map((r) => r.id),
    ).toEqual(["1"]);

    expect(
      filterMatchingPulseAdminRequests(requests, {
        status: "ALL",
        category: "ALL",
        query: "sam@ppa",
      }).map((r) => r.id),
    ).toEqual(["2"]);
  });
});
