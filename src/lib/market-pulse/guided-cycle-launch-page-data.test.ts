import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  getMarketPulseSettings: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: settingsMocks.getMarketPulseSettings,
  calculateAndPersistCycleScores: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  isMarketPulseCycleRevealed: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
  },
}));

import { getGuidedCycleLaunchPageData } from "@/lib/market-pulse/guided-cycle-launch-page-data";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const CYCLE = {
  id: "cycle-1",
  name: "August 2026",
  status: "DRAFT" as const,
  startsAt: new Date("2026-08-01T01:00:00.000Z"),
  endsAt: new Date("2026-08-10T13:00:00.000Z"),
  revealAt: new Date("2026-08-11T01:00:00.000Z"),
  prizeLabel: "Prize",
  cards: [],
  decisions: [],
  _count: { cards: 0, decisions: 0 },
};

describe("getGuidedCycleLaunchPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    settingsMocks.getMarketPulseSettings.mockResolvedValue({
      activeCycleId: null,
      runtimeStatus: "CLOSED",
    });
  });

  it("returns null for guests", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const data = await getGuidedCycleLaunchPageData("cycle-1");

    expect(data).toBeNull();
  });

  it("returns eligibility and readiness for admin viewers", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);

    const data = await getGuidedCycleLaunchPageData("cycle-1");

    expect(data?.eligibility.eligible).toBe(true);
    expect(data?.readiness.ready).toBe(false);
    expect(data?.readiness.reasons).toContain("There are no cards in this cycle.");
    expect(data?.preview.totalCards).toBe(0);
    expect(data?.preview.launchAllowed).toBe(false);
  });

  it("reports ineligible CLOSED cycles while still loading page data", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "CLOSED",
    });

    const data = await getGuidedCycleLaunchPageData("cycle-1");

    expect(data?.eligibility.eligible).toBe(false);
    expect(data?.eligibility.reasons).toContain(
      "Closed cycles cannot be launched from the guided launcher.",
    );
  });

  it("reports alreadyLaunched with published preview counts for fully launched cycles", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "OPEN",
      cards: [
        {
          id: "card-1",
          cycleId: "cycle-1",
          dayIndex: 1,
          sortOrder: 0,
          cardType: "SIGNAL",
          companyName: "Acme",
          companyNameZh: null,
          ticker: "ACME",
          exchange: null,
          logoUrl: null,
          logoInitials: null,
          priceLabel: null,
          priceDirection: null,
          headline: "Headline",
          headlineZhHant: null,
          newsBody: "Body",
          newsBodyZhHant: null,
          sourceName: null,
          sourceUrl: null,
          sourceDate: new Date("2026-08-01T01:00:00.000Z"),
          cardImageUrl: null,
          cardImageAlt: null,
          cardImageAltZhHant: null,
          summary: "Summary",
          summaryZhHant: null,
          userPrompt: null,
          userPromptZhHant: null,
          status: "PUBLISHED",
          ppaSignal: "BULLISH",
          ppaInsight: "Insight",
          ppaInsightZhHant: null,
          ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
          publishedAt: new Date("2026-08-01T01:00:00.000Z"),
          revealAt: null,
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          updatedAt: new Date("2026-08-01T00:00:00.000Z"),
          _count: { decisions: 0 },
        },
      ],
    });
    settingsMocks.getMarketPulseSettings.mockResolvedValue({
      activeCycleId: "cycle-1",
      runtimeStatus: "OPEN",
    });

    const data = await getGuidedCycleLaunchPageData("cycle-1");

    expect(data?.alreadyLaunched).toBe(true);
    expect(data?.preview.publishedCount).toBe(1);
    expect(data?.preview.totalCards).toBe(1);
    expect(data?.preview.publishedCount).toBe(data?.preview.totalCards);
  });
});
