import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  cycleCreate: vi.fn(),
  cardCreateMany: vi.fn(),
  auditCreate: vi.fn(),
  gameSettingUpdate: vi.fn(),
  gameSettingFindFirst: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  calculateAndPersistCycleScores: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  isMarketPulseCycleRevealed: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
    marketPulseCycle: {
      create: prismaMocks.cycleCreate,
    },
    marketPulseCard: {
      createMany: prismaMocks.cardCreateMany,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
    marketPulseGameSetting: {
      findFirst: prismaMocks.gameSettingFindFirst,
      update: prismaMocks.gameSettingUpdate,
    },
  },
}));

import { createGuidedMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const GUIDED_INPUT = {
  name: "August 2026 Cycle",
  startDate: "2026-08-01",
  endDate: "2026-08-10",
  revealDate: "2026-08-11",
  defaultSignalCardsPerDay: 2,
  dayOverrides: [
    { dayIndex: 1, dayType: "SIGNAL" as const, signalCardCount: 2 },
    { dayIndex: 2, dayType: "REST" as const, signalCardCount: 1 },
  ],
};

describe("createGuidedMarketPulseCycleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleCreate.mockResolvedValue({ id: "cycle-guided" });
    prismaMocks.cardCreateMany.mockResolvedValue({ count: 3 });
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    prismaMocks.transaction.mockImplementation(async (callback) =>
      callback({
        marketPulseCycle: { create: prismaMocks.cycleCreate },
        marketPulseCard: { createMany: prismaMocks.cardCreateMany },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await createGuidedMarketPulseCycleAction(GUIDED_INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("creates a DRAFT cycle with generated draft cards", async () => {
    const result = await createGuidedMarketPulseCycleAction({
      ...GUIDED_INPUT,
      dayOverrides: Array.from({ length: 10 }, (_, index) => ({
        dayIndex: index + 1,
        dayType: index === 1 ? ("REST" as const) : ("SIGNAL" as const),
        signalCardCount: 2,
      })),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.cycleId).toBe("cycle-guided");
      expect(result.data?.signalCardCount).toBe(18);
      expect(result.data?.restCardCount).toBe(1);
      expect(result.data?.builderPath).toBe(
        "/admin/market-pulse/cycles/cycle-guided/builder",
      );
      expect(result.data?.guidedCardsPath).toBe(
        "/admin/market-pulse/cycles/cycle-guided/guided-cards",
      );
    }

    expect(prismaMocks.cycleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "August 2026 Cycle",
        status: "DRAFT",
        startsAt: new Date("2026-08-01T01:00:00.000Z"),
        endsAt: new Date("2026-08-10T13:00:00.000Z"),
        revealAt: new Date("2026-08-11T01:00:00.000Z"),
      }),
    });

    expect(prismaMocks.cardCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          cycleId: "cycle-guided",
          cardType: "SIGNAL",
          dayIndex: 1,
          sortOrder: 0,
          status: "DRAFT",
          publishedAt: null,
        }),
        expect.objectContaining({
          cycleId: "cycle-guided",
          cardType: "REST",
          dayIndex: 2,
          sortOrder: 0,
          companyName: "",
          ticker: "",
          publishedAt: null,
        }),
      ]),
    });
  });

  it("does not pin the cycle active or change runtime settings", async () => {
    await createGuidedMarketPulseCycleAction({
      ...GUIDED_INPUT,
      endDate: "2026-08-01",
      revealDate: "2026-08-02",
      dayOverrides: [{ dayIndex: 1, dayType: "SIGNAL", signalCardCount: 1 }],
    });

    expect(prismaMocks.gameSettingFindFirst).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("rejects reveal date on the same day as end date", async () => {
    const result = await createGuidedMarketPulseCycleAction({
      ...GUIDED_INPUT,
      revealDate: "2026-08-10",
      dayOverrides: [{ dayIndex: 1, dayType: "SIGNAL", signalCardCount: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("after end date");
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });
});
