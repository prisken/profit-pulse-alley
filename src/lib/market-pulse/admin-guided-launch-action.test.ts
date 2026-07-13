import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  cycleFindUnique: vi.fn(),
  cycleUpdate: vi.fn(),
  cardFindMany: vi.fn(),
  cardUpdate: vi.fn(),
  gameSettingFindFirst: vi.fn(),
  gameSettingUpdate: vi.fn(),
  auditCreate: vi.fn(),
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
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

import { launchGuidedMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const CYCLE_ID = "cycle-1";

const CYCLE = {
  id: CYCLE_ID,
  status: "DRAFT" as const,
  startsAt: new Date("2026-08-01T01:00:00.000Z"),
  endsAt: new Date("2026-08-10T13:00:00.000Z"),
};

const SETTINGS = {
  id: "settings-1",
  activeCycleId: null as string | null,
  runtimeStatus: "CLOSED" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function readySignalCard(id: string, dayIndex = 1) {
  return {
    id,
    cycleId: CYCLE_ID,
    dayIndex,
    sortOrder: 0,
    cardType: "SIGNAL" as const,
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
    userPrompt: "Prompt",
    userPromptZhHant: null,
    status: "DRAFT" as const,
    ppaSignal: "BULLISH" as const,
    ppaInsight: "Insight",
    ppaInsightZhHant: null,
    ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
    publishedAt: null,
    revealAt: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    _count: { decisions: 0 },
  };
}

function setupTransaction() {
  prismaMocks.transaction.mockImplementation(async (callback) =>
    callback({
      marketPulseCycle: {
        findUnique: prismaMocks.cycleFindUnique,
        update: prismaMocks.cycleUpdate,
      },
      marketPulseCard: {
        findMany: prismaMocks.cardFindMany,
        update: prismaMocks.cardUpdate,
      },
      marketPulseGameSetting: {
        findFirst: prismaMocks.gameSettingFindFirst,
        update: prismaMocks.gameSettingUpdate,
      },
    }),
  );
}

describe("launchGuidedMarketPulseCycleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    prismaMocks.cycleUpdate.mockResolvedValue({});
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.gameSettingUpdate.mockResolvedValue({});
    setupTransaction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  it("blocks CLOSED and REVEALED cycles from launching", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "CLOSED",
    });
    prismaMocks.cardFindMany.mockResolvedValue([readySignalCard("card-1")]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const closed = await launchGuidedMarketPulseCycleAction(CYCLE_ID);
    expect(closed.ok).toBe(false);
    if (!closed.ok) {
      expect(closed.error).toContain("Closed cycles cannot be launched");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();

    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "REVEALED",
    });

    const revealed = await launchGuidedMarketPulseCycleAction(CYCLE_ID);
    expect(revealed.ok).toBe(false);
    if (!revealed.ok) {
      expect(revealed.error).toContain("Revealed cycles cannot be launched");
    }
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("fails safely when OPEN cycle is not launch-ready without changing settings", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "OPEN",
    });
    prismaMocks.cardFindMany.mockResolvedValue([
      readySignalCard("card-1"),
      {
        ...readySignalCard("card-2", 2),
        newsBody: "",
        summary: "",
      },
    ]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      ...SETTINGS,
      activeCycleId: CYCLE_ID,
      runtimeStatus: "OPEN",
    });

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("missing content");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("publishes remaining cards, opens cycle, pins active, and sets runtime OPEN", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardFindMany.mockResolvedValue([readySignalCard("card-1")]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.publishedCount).toBe(1);
      expect(result.data?.alreadyLaunched).toBe(false);
    }

    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-1" },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
      },
    });
    expect(prismaMocks.cycleUpdate).toHaveBeenCalledWith({
      where: { id: CYCLE_ID },
      data: { status: "OPEN" },
    });
    expect(prismaMocks.gameSettingUpdate).toHaveBeenCalledWith({
      where: { id: "settings-1" },
      data: {
        activeCycleId: CYCLE_ID,
        runtimeStatus: "OPEN",
      },
    });
    expect(prismaMocks.auditCreate).toHaveBeenCalledTimes(3);
    const publishAudit = prismaMocks.auditCreate.mock.calls[0]?.[0]?.data;
    expect(publishAudit?.reason).toContain("cycleId=cycle-1");
    expect(publishAudit?.reason).toContain("publishedCount=1");
    expect(publishAudit?.reason).toContain("runtimeStatus=OPEN");
    expect(publishAudit?.reason).toContain("activeCycleId=cycle-1");
    expect(publishAudit?.reason).not.toContain("ppaSignal");
    expect(publishAudit?.reason).not.toContain("ppaInsight");
    expect(publishAudit?.reason).not.toContain("ppaSignalLockedAt");
    const auditReasons = prismaMocks.auditCreate.mock.calls.map(
      (call) => call[0]?.data?.reason as string,
    );
    expect(auditReasons).toHaveLength(3);
    for (const reason of auditReasons) {
      expect(reason).toContain("cycleId=cycle-1");
      expect(reason).toContain("publishedCount=1");
      expect(reason).not.toContain("ppaSignal");
    }
  });

  it("returns idempotent success when cycle is already fully launched", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "OPEN",
    });
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        ...readySignalCard("card-1"),
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
      },
    ]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      ...SETTINGS,
      activeCycleId: CYCLE_ID,
      runtimeStatus: "OPEN",
    });

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.alreadyLaunched).toBe(true);
      expect(result.message).toContain("already launched");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.auditCreate).not.toHaveBeenCalled();
  });

  it("publishes remaining ready cards when cycle is already OPEN", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "OPEN",
    });
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        ...readySignalCard("card-published"),
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
      },
      readySignalCard("card-draft", 2),
    ]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue({
      ...SETTINGS,
      activeCycleId: null,
      runtimeStatus: "CLOSED",
    });

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.publishedCount).toBe(1);
    }
    expect(prismaMocks.cardUpdate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).toHaveBeenCalled();
  });
});
