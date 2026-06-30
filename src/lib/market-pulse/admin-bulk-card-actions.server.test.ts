import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cardFindMany: vi.fn(),
  cardFindUnique: vi.fn(),
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
      findMany: prismaMocks.cardFindMany,
      findUnique: prismaMocks.cardFindUnique,
      update: prismaMocks.cardUpdate,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

import {
  bulkPublishMarketPulseCardsAction,
  bulkUnpublishMarketPulseCardsAction,
} from "@/lib/market-pulse/admin-actions";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const readyCard = {
  id: "card-ready",
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
  userPrompt: "Prompt",
  status: "DRAFT" as const,
  ppaSignal: "BULLISH" as const,
  ppaInsight: "Insight",
  ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
  publishedAt: null,
  revealAt: null,
  _count: { decisions: 0 },
};

const invalidCard = {
  ...readyCard,
  id: "card-invalid",
  dayIndex: 2,
  summary: null,
  ppaSignal: null,
  ppaInsight: null,
  ppaSignalLockedAt: null,
};

describe("bulkPublishMarketPulseCardsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue({ id: "cycle-1" });
    prismaMocks.cardFindMany.mockResolvedValue([readyCard, invalidCard]);
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.auditCreate.mockResolvedValue({});
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await bulkPublishMarketPulseCardsAction({
      cycleId: "cycle-1",
      cardIds: ["card-ready"],
    });

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("publishes only valid selected cards", async () => {
    const result = await bulkPublishMarketPulseCardsAction({
      cycleId: "cycle-1",
      cardIds: ["card-ready", "card-invalid"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.publishedCount).toBe(1);
      expect(result.data?.skippedCount).toBe(1);
      expect(result.data?.publishedCardIds).toEqual(["card-ready"]);
    }

    expect(prismaMocks.cardUpdate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-ready" },
      data: expect.objectContaining({ status: "PUBLISHED" }),
    });
  });

  it("never publishes invalid cards", async () => {
    await bulkPublishMarketPulseCardsAction({
      cycleId: "cycle-1",
      cardIds: ["card-invalid"],
    });

    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });
});

describe("bulkUnpublishMarketPulseCardsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue({ id: "cycle-1" });
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.auditCreate.mockResolvedValue({});
  });

  it("blocks unpublish when decisions exist", async () => {
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        ...readyCard,
        id: "card-live",
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
        _count: { decisions: 3 },
      },
    ]);

    const result = await bulkUnpublishMarketPulseCardsAction({
      cycleId: "cycle-1",
      cardIds: ["card-live"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.unpublishedCount).toBe(0);
      expect(result.data?.skippedCount).toBe(1);
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("unpublishes published cards without decisions", async () => {
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        ...readyCard,
        id: "card-live",
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
        _count: { decisions: 0 },
      },
    ]);

    const result = await bulkUnpublishMarketPulseCardsAction({
      cycleId: "cycle-1",
      cardIds: ["card-live"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.unpublishedCount).toBe(1);
    }

    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-live" },
      data: { status: "DRAFT", publishedAt: null },
    });

    expect(
      isCardLiveForPlayers({
        status: "DRAFT",
        publishedAt: null,
      }),
    ).toBe(false);
  });
});
