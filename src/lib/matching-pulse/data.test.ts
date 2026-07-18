import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    matchingPulseRequest: {
      findMany: mocks.findMany,
      count: mocks.count,
      findFirst: mocks.findFirst,
    },
  },
}));

import {
  excerptMatchingPulseDescription,
  getMatchingPulseProfileSummary,
  getMatchingPulseRequestsForUser,
} from "@/lib/matching-pulse/data";

describe("getMatchingPulseRequestsForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only the current user’s requests, newest first", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "req-1",
        userId: "user-1",
        title: "Need a partner",
        status: "NEW",
        requestType: "NEED_HELP",
        category: "BUSINESS",
        urgency: "HIGH",
        description: "Looking for help.",
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
      },
    ]);

    const rows = await getMatchingPulseRequestsForUser("user-1");

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        requestType: true,
        category: true,
        urgency: true,
        description: true,
        createdAt: true,
      },
    });
    expect(mocks.findMany.mock.calls[0]?.[0]?.where).toEqual({
      userId: "user-1",
    });
    expect(mocks.findMany.mock.calls[0]?.[0]?.where).not.toEqual({});
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe("user-1");
    expect(rows[0]).not.toHaveProperty("adminNotes");
  });

  it("does not select adminNotes or tags", async () => {
    mocks.findMany.mockResolvedValue([]);

    await getMatchingPulseRequestsForUser("user-2");

    const select = mocks.findMany.mock.calls[0]?.[0]?.select as Record<
      string,
      boolean
    >;
    expect(select).toBeDefined();
    expect(select).not.toHaveProperty("adminNotes");
    expect(select).not.toHaveProperty("tags");
    expect(Object.keys(select)).not.toContain("adminNotes");
    expect(Object.keys(select)).not.toContain("tags");
  });

  it("returns an empty list for blank userId without querying", async () => {
    await expect(getMatchingPulseRequestsForUser("   ")).resolves.toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

describe("excerptMatchingPulseDescription", () => {
  it("truncates long descriptions", () => {
    const long = "a".repeat(200);
    const excerpt = excerptMatchingPulseDescription(long, 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});

describe("getMatchingPulseProfileSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes to the current user and never selects adminNotes", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.findFirst.mockResolvedValue({
      title: "Need a partner",
      status: "NEW",
    });

    const summary = await getMatchingPulseProfileSummary("user-9");

    expect(mocks.count).toHaveBeenCalledWith({
      where: { userId: "user-9" },
    });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-9" },
      orderBy: { createdAt: "desc" },
      select: { title: true, status: true },
    });
    const select = mocks.findFirst.mock.calls[0]?.[0]?.select as Record<
      string,
      boolean
    >;
    expect(select).not.toHaveProperty("adminNotes");
    expect(summary).toEqual({
      totalCount: 2,
      latest: { title: "Need a partner", status: "NEW" },
    });
  });
});
