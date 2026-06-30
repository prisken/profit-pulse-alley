import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  scoreEventCount: vi.fn(),
  scoreEventGroupBy: vi.fn(),
  cardFindMany: vi.fn(),
  userFindMany: vi.fn(),
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
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    marketPulseScoreEvent: {
      count: prismaMocks.scoreEventCount,
      groupBy: prismaMocks.scoreEventGroupBy,
    },
    marketPulseCard: {
      findMany: prismaMocks.cardFindMany,
    },
    user: {
      findMany: prismaMocks.userFindMany,
    },
  },
}));

import { getMarketPulseCycleBuilderData } from "@/lib/market-pulse/admin-builder-data";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

describe("getMarketPulseCycleBuilderData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    settingsMocks.getMarketPulseSettings.mockResolvedValue({
      id: "settings-1",
      runtimeStatus: "OPEN",
      activeCycleId: "cycle-1",
    });
    prismaMocks.scoreEventCount.mockResolvedValue(0);
    prismaMocks.scoreEventGroupBy.mockResolvedValue([]);
    prismaMocks.userFindMany.mockResolvedValue([]);
    prismaMocks.cardFindMany.mockResolvedValue([]);
  });

  it("returns null when admin session is missing", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    await expect(getMarketPulseCycleBuilderData("cycle-1")).resolves.toBeNull();
  });

  it("returns null when cycle is missing", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(null);

    await expect(getMarketPulseCycleBuilderData("cycle-1")).resolves.toBeNull();
  });

  it("loads cycle and cards for admins", async () => {
    const startsAt = new Date("2026-06-01T00:00:00.000Z");
    const endsAt = new Date("2026-06-07T00:00:00.000Z");
    const revealAt = new Date("2026-06-08T00:00:00.000Z");

    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: "cycle-1",
      name: "June cycle",
      status: "ACTIVE",
      startsAt,
      endsAt,
      revealAt,
      prizeLabel: "Prize",
      cards: [{ id: "card-1", ppaSignal: "BULLISH", ppaSignalLockedAt: new Date() }],
      decisions: [{ userId: "user-1" }],
      _count: { cards: 1, decisions: 1 },
    });

    prismaMocks.cardFindMany.mockResolvedValue([
      {
        id: "card-1",
        cycleId: "cycle-1",
        dayIndex: 1,
        companyName: "Acme",
        companyNameZh: null,
        ticker: "ACME",
        exchange: null,
        logoUrl: null,
        logoInitials: null,
        priceLabel: null,
        priceDirection: null,
        headline: "Headline",
        newsBody: null,
        sourceName: null,
        sourceUrl: null,
        sourceDate: null,
        cardImageUrl: null,
        cardImageAlt: null,
        summary: "Summary",
        userPrompt: null,
        status: "DRAFT",
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
        ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
        publishedAt: null,
        revealAt: null,
        _count: { decisions: 0 },
      },
    ]);

    const data = await getMarketPulseCycleBuilderData("cycle-1");

    expect(data).not.toBeNull();
    expect(data?.adminEmail).toBe("admin@example.com");
    expect(data?.cycle.id).toBe("cycle-1");
    expect(data?.cycle.isActive).toBe(true);
    expect(data?.cards).toHaveLength(1);
    expect(data?.cards[0]?.headline).toBe("Headline");
  });
});
