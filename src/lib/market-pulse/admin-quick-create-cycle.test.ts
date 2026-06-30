import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindMany: vi.fn(),
  cycleCreate: vi.fn(),
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
    marketPulseCycle: {
      findMany: prismaMocks.cycleFindMany,
      create: prismaMocks.cycleCreate,
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

import { quickCreateMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";
import {
  MARKET_PULSE_FIRST_CYCLE_END_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
} from "@/lib/market-pulse/launch-config";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

describe("quickCreateMarketPulseCycleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindMany.mockResolvedValue([
      {
        name: "Cycle 01",
        startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
        endsAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
        revealAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
      },
    ]);
    prismaMocks.cycleCreate.mockResolvedValue({ id: "cycle-new" });
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await quickCreateMarketPulseCycleAction();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.cycleCreate).not.toHaveBeenCalled();
  });

  it("creates a draft cycle with defaults and builder redirect data", async () => {
    const result = await quickCreateMarketPulseCycleAction();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("Draft cycle created.");
      expect(result.data?.cycleId).toBe("cycle-new");
      expect(result.data?.redirectPath).toBe(
        "/admin/market-pulse/cycles/cycle-new/builder",
      );
    }

    expect(prismaMocks.cycleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Cycle 02",
        prizeLabel: "One Ocean Park ticket",
        status: "DRAFT",
        startsAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
      }),
    });
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("does not set the cycle active", async () => {
    await quickCreateMarketPulseCycleAction();

    expect(prismaMocks.gameSettingFindFirst).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });
});
