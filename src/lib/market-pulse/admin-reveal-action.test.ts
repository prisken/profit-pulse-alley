import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const validationMocks = vi.hoisted(() => ({
  validateCycleReadyForReveal: vi.fn(),
}));

const serverMocks = vi.hoisted(() => ({
  calculateAndPersistCycleScores: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/market-pulse/reveal-ppa-validation.server", () => ({
  validateCycleReadyForReveal: validationMocks.validateCycleReadyForReveal,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  calculateAndPersistCycleScores: serverMocks.calculateAndPersistCycleScores,
  getMarketPulseLeaderboard: vi.fn(),
  isMarketPulseCycleRevealed: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    $transaction: prismaMocks.transaction,
    marketPulseAuditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    },
  },
}));

import { revealMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };
const CYCLE_ID = "cycle-1";

describe("revealMarketPulseCycleAction PPA safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: CYCLE_ID,
      name: "Test Cycle",
      status: "OPEN",
      revealAt: new Date("2026-07-11T00:00:00.000Z"),
    });
    validationMocks.validateCycleReadyForReveal.mockResolvedValue({ ready: true });
    prismaMocks.transaction.mockImplementation(async (callback) =>
      callback({
        marketPulseCycle: {
          update: vi.fn().mockResolvedValue({}),
        },
        marketPulseCard: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }),
    );
    serverMocks.calculateAndPersistCycleScores.mockResolvedValue({
      cycleId: CYCLE_ID,
      decisionsScored: 5,
      usersScored: 3,
      eventsCreated: 5,
      topScore: 80,
      participationPoints: 50,
      matchBonusPoints: 30,
      streakBonusPoints: 0,
      totalPoints: 80,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails when PPA validation fails and does not reveal or score", async () => {
    validationMocks.validateCycleReadyForReveal.mockResolvedValue({
      ready: false,
      message:
        "Cannot reveal yet. 1 card(s) are missing locked PPA insight — day 2 (Beta).",
      missingCards: [
        {
          id: "card-2",
          dayIndex: 2,
          headline: "Beta headline",
          companyName: "Beta",
          missing: ["ppaInsight"],
        },
      ],
    });

    const result = await revealMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Cannot reveal yet/i);
      expect(result.data).toEqual({
        missingCards: [
          expect.objectContaining({
            id: "card-2",
            missing: ["ppaInsight"],
          }),
        ],
      });
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
    expect(serverMocks.calculateAndPersistCycleScores).not.toHaveBeenCalled();
  });

  it("reveals and scores when all published cards have complete locked PPA", async () => {
    const result = await revealMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    expect(validationMocks.validateCycleReadyForReveal).toHaveBeenCalledWith(
      CYCLE_ID,
    );
    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1);
    expect(serverMocks.calculateAndPersistCycleScores).toHaveBeenCalledWith(
      CYCLE_ID,
    );
  });
});
