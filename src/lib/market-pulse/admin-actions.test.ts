import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cardFindFirst: vi.fn(),
  cardFindUnique: vi.fn(),
  cardFindMany: vi.fn(),
  cardCreate: vi.fn(),
  cardUpdate: vi.fn(),
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
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    marketPulseCard: {
      findFirst: prismaMocks.cardFindFirst,
      findUnique: prismaMocks.cardFindUnique,
      findMany: prismaMocks.cardFindMany,
      create: prismaMocks.cardCreate,
      update: prismaMocks.cardUpdate,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

import {
  createMarketPulseCardAction,
  lockMarketPulseCardPpaAction,
  publishMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const validCreateInput = {
  cycleId: "cycle-1",
  dayIndex: 1,
  sortOrder: 0,
  companyName: "Acme Corp",
  companyNameZh: "",
  ticker: "ACME",
  exchange: "",
  logoUrl: "",
  logoInitials: "",
  priceLabel: "",
  priceDirection: "",
  headline: "Acme reports earnings",
  headlineZhHant: "",
  newsBody: "",
  newsBodyZhHant: "",
  sourceName: "",
  sourceUrl: "",
  sourceDate: "",
  cardImageUrl: "",
  cardImageAlt: "",
  cardImageAltZhHant: "",
  summary: "Earnings beat expectations.",
  summaryZhHant: "",
  userPrompt: "What would you do?",
  userPromptZhHant: "",
  ppaSignal: null,
  ppaInsight: "",
  ppaInsightZhHant: "",
  status: "DRAFT" as const,
  publishedAt: "",
  revealAt: "",
};

describe("market-pulse admin-actions reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue({ id: "cycle-1" });
    prismaMocks.cardFindFirst.mockResolvedValue(null);
    prismaMocks.cardCreate.mockResolvedValue({ id: "card-1" });
    prismaMocks.cardUpdate.mockResolvedValue({ id: "card-1" });
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok true when a card is created", async () => {
    const result = await createMarketPulseCardAction(validCreateInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("Card saved.");
    }
    expect(prismaMocks.cardCreate).toHaveBeenCalledTimes(1);
  });

  it("returns ok true when publish succeeds even if audit log fails", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      id: "card-1",
      cycleId: "cycle-1",
      status: "READY",
      publishedAt: null,
      headline: "Headline",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
      ppaSignal: "BUY",
      ppaInsight: "Strong outlook",
      ppaSignalLockedAt: new Date(),
    });
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        id: "card-1",
        dayIndex: 1,
        sourceDate: null,
        status: "READY",
      },
    ]);
    prismaMocks.cycleFindUnique.mockResolvedValue({
      startsAt: new Date("2026-03-01T00:00:00+08:00"),
      endsAt: new Date("2026-03-10T00:00:00+08:00"),
    });
    prismaMocks.auditCreate.mockRejectedValue(new Error("audit failed"));

    const result = await publishMarketPulseCardAction("card-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("Card published.");
      expect(result.warning).toContain("audit log");
    }
    expect(prismaMocks.cardUpdate).toHaveBeenCalledTimes(1);
  });

  it("returns ok true when lock PPA succeeds even if cache refresh fails", async () => {
    const { revalidatePath } = await import("next/cache");
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error("revalidate failed");
    });

    prismaMocks.cardFindUnique.mockResolvedValue({
      id: "card-1",
      ppaSignal: "BUY",
      ppaInsight: "Strong outlook",
      ppaSignalLockedAt: null,
    });

    const result = await lockMarketPulseCardPpaAction("card-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("PPA signal locked.");
      expect(result.warning).toContain("cache refresh");
    }
    expect(prismaMocks.cardUpdate).toHaveBeenCalledTimes(1);
  });
});
