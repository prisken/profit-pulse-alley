import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cycleDelete: vi.fn(),
  cardDeleteMany: vi.fn(),
  gameSettingFindFirst: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const revalidateMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidateMocks.revalidatePath,
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
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
      delete: prismaMocks.cycleDelete,
    },
    marketPulseCard: {
      deleteMany: prismaMocks.cardDeleteMany,
    },
    marketPulseGameSetting: {
      findFirst: prismaMocks.gameSettingFindFirst,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
    $transaction: prismaMocks.transaction,
  },
}));

import { removeMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";
import { CYCLE_REMOVAL_MESSAGES } from "@/lib/market-pulse/cycle-removal";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };
const CYCLE_ID = "cycle-1";

function cycleRow(
  overrides: {
    status?: "DRAFT" | "OPEN" | "CLOSED" | "REVEALED" | "ARCHIVED";
    decisions?: number;
    scores?: number;
    scoreEvents?: number;
    prizeClaims?: number;
    name?: string;
  } = {},
) {
  return {
    id: CYCLE_ID,
    name: overrides.name ?? "Draft Cycle",
    status: overrides.status ?? "DRAFT",
    _count: {
      decisions: overrides.decisions ?? 0,
      scores: overrides.scores ?? 0,
      scoreEvents: overrides.scoreEvents ?? 0,
      prizeClaims: overrides.prizeClaims ?? 0,
    },
  };
}

function setupTransaction() {
  prismaMocks.transaction.mockImplementation(async (callback) =>
    callback({
      marketPulseCard: {
        deleteMany: prismaMocks.cardDeleteMany,
      },
      marketPulseCycle: {
        delete: prismaMocks.cycleDelete,
      },
    }),
  );
}

describe("removeMarketPulseCycleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      id: "settings-1",
      activeCycleId: null,
    });
    prismaMocks.cardDeleteMany.mockResolvedValue({ count: 2 });
    prismaMocks.cycleDelete.mockResolvedValue({ id: CYCLE_ID });
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    setupTransaction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("returns a safe error for missing or unknown cycleId", async () => {
    const missing = await removeMarketPulseCycleAction("   ");
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error).toBe(CYCLE_REMOVAL_MESSAGES.notFound);
    }

    prismaMocks.cycleFindUnique.mockResolvedValue(null);
    const unknown = await removeMarketPulseCycleAction("missing-cycle");
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error).toBe(CYCLE_REMOVAL_MESSAGES.notFound);
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("cannot remove the active pinned cycle", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(cycleRow({ status: "OPEN" }));
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      id: "settings-1",
      activeCycleId: CYCLE_ID,
    });

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedActive);
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("cannot remove REVEALED cycles", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "REVEALED" }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedStatus);
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("cannot remove ARCHIVED cycles", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "ARCHIVED" }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedStatus);
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("cannot remove a cycle with decisions", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "CLOSED", decisions: 3 }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedData);
    }
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("cannot remove a cycle with MarketPulseScore rows", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "CLOSED", scores: 1 }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedData);
    }
  });

  it("cannot remove a cycle with MarketPulseScoreEvent rows", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "CLOSED", scoreEvents: 4 }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedData);
    }
  });

  it("cannot remove a cycle with MarketPulsePrizeClaim rows", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "CLOSED", prizeClaims: 1 }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.blockedData);
    }
  });

  it("can remove a DRAFT cycle with draft cards and no player data", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(cycleRow({ status: "DRAFT" }));

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe(CYCLE_REMOVAL_MESSAGES.success);
    }
    expect(prismaMocks.cardDeleteMany).toHaveBeenCalledWith({
      where: { cycleId: CYCLE_ID },
    });
    expect(prismaMocks.cycleDelete).toHaveBeenCalledWith({
      where: { id: CYCLE_ID },
    });
    expect(prismaMocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminUserId: ADMIN.userId,
          entityType: "MarketPulseCycle",
          entityId: CYCLE_ID,
          action: "DELETE",
        }),
      }),
    );
    expect(revalidateMocks.revalidatePath).toHaveBeenCalledWith("/admin/market-pulse");
    expect(revalidateMocks.revalidatePath).toHaveBeenCalledWith("/market-pulse");
    expect(revalidateMocks.revalidatePath).toHaveBeenCalledWith(
      "/market-pulse/play",
    );
    expect(revalidateMocks.revalidatePath).toHaveBeenCalledWith(
      "/market-pulse/leaderboard",
    );
    expect(revalidateMocks.revalidatePath).toHaveBeenCalledWith(
      "/market-pulse/reveal",
    );
  });

  it("can remove a CLOSED cycle with no player data and no active pin", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(
      cycleRow({ status: "CLOSED", name: "Closed clean cycle" }),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe(CYCLE_REMOVAL_MESSAGES.success);
    }
    expect(prismaMocks.cardDeleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMocks.cycleDelete).toHaveBeenCalledTimes(1);
  });

  it("never throws raw Prisma errors to the client", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(cycleRow());
    prismaMocks.transaction.mockRejectedValue(
      new Error("P2003 Foreign key constraint failed"),
    );

    const result = await removeMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CYCLE_REMOVAL_MESSAGES.failed);
      expect(result.error).not.toContain("P2003");
    }
  });
});
