import { describe, expect, it } from "vitest";

import { csvEscape } from "@/lib/admin/csv-download";
import type { MatchingPulseAdminRequestRow } from "@/lib/matching-pulse/admin-filters";
import {
  buildMatchingPulseRequestsCsv,
  MATCHING_PULSE_CSV_HEADERS,
} from "@/lib/matching-pulse/csv";

function row(
  overrides: Partial<MatchingPulseAdminRequestRow> = {},
): MatchingPulseAdminRequestRow {
  return {
    id: "req-1",
    title: "Need a marketing partner",
    company: "Acme Ltd",
    contactPhone: "+85212345678",
    contactMethod: "WhatsApp",
    requestType: "NEED_HELP",
    category: "BUSINESS",
    urgency: "HIGH",
    source: "direct",
    description: "Looking for a warm intro.",
    idealMatch: "HK marketer",
    status: "NEW",
    consentToContact: true,
    consentToShare: false,
    tags: "wework, marketing",
    createdAt: "2026-07-10T00:00:00.000Z",
    user: {
      id: "u1",
      name: "Alex Wong",
      email: "alex@example.com",
      contactNumber: null,
    },
    ...overrides,
  };
}

describe("csvEscape", () => {
  it("leaves plain values unchanged", () => {
    expect(csvEscape("simple")).toBe("simple");
    expect(csvEscape("")).toBe("");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("buildMatchingPulseRequestsCsv", () => {
  it("emits the expected header without adminNotes", () => {
    const csv = buildMatchingPulseRequestsCsv([row()]);
    const header = csv.split("\n")[0];

    expect(header).toBe(MATCHING_PULSE_CSV_HEADERS.join(","));
    expect(csv).not.toContain("adminNotes");
    expect(MATCHING_PULSE_CSV_HEADERS).not.toContain("adminNotes");
  });

  it("maps row fields including requester identity and tags", () => {
    const csv = buildMatchingPulseRequestsCsv([row()]);
    const dataLine = csv.split("\n")[1] ?? "";

    expect(dataLine).toContain("2026-07-10T00:00:00.000Z");
    expect(dataLine).toContain("NEW");
    expect(dataLine).toContain("Alex Wong");
    expect(dataLine).toContain("alex@example.com");
    expect(dataLine).toContain("Acme Ltd");
    expect(dataLine).toContain("Need a marketing partner");
    expect(dataLine).toContain("NEED_HELP");
    expect(dataLine).toContain("BUSINESS");
    expect(dataLine).toContain("HIGH");
    expect(dataLine).toContain("direct");
    expect(dataLine).toContain("+85212345678");
    expect(dataLine).toContain("WhatsApp");
    expect(dataLine).toContain("Looking for a warm intro.");
    expect(dataLine).toContain("HK marketer");
    expect(dataLine).toContain("true");
    expect(dataLine).toContain("false");
    expect(dataLine).toContain("wework, marketing");
  });

  it("escapes commas, quotes, and newlines in description and tags", () => {
    const csv = buildMatchingPulseRequestsCsv([
      row({
        description: 'Need help with "SEO", ads, and copy',
        tags: "tag1, tag2",
        idealMatch: "Someone\nremote",
        company: null,
        urgency: null,
        user: {
          id: "u2",
          name: null,
          email: "bob@example.com",
          contactNumber: null,
        },
      }),
    ]);
    const dataLine = csv.split("\n").slice(1).join("\n");

    expect(dataLine).toContain('"Need help with ""SEO"", ads, and copy"');
    expect(dataLine).toContain('"tag1, tag2"');
    expect(dataLine).toContain('"Someone\nremote"');
    expect(dataLine).toContain("bob@example.com");
    // Empty requesterName still occupies a column before email.
    expect(dataLine).toMatch(/,bob@example.com,/);
  });

  it("exports multiple filtered rows in order", () => {
    const csv = buildMatchingPulseRequestsCsv([
      row({ id: "a", title: "First" }),
      row({ id: "b", title: "Second", status: "REVIEWING" }),
    ]);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("First");
    expect(lines[2]).toContain("Second");
    expect(lines[2]).toContain("REVIEWING");
  });
});
