import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cardFindUnique: vi.fn(),
  cardUpdate: vi.fn(),
  cardFindFirst: vi.fn(),
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
    marketPulseCard: {
      findUnique: prismaMocks.cardFindUnique,
      update: prismaMocks.cardUpdate,
      findFirst: prismaMocks.cardFindFirst,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

import {
  approveGuidedMarketPulseCardPpaAction,
  updateGuidedMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const SIGNAL_CARD = {
  id: "card-signal",
  cycleId: "cycle-1",
  cardType: "SIGNAL" as const,
  status: "DRAFT" as const,
  dayIndex: 1,
  sortOrder: 0,
  companyName: "Old Co",
  ticker: "OLD",
  headline: "Old headline",
  newsBody: "Old body",
  summary: "Old summary",
  priceLabel: null,
  cardImageUrl: null,
  cardImageAlt: null,
  ppaSignal: null,
  ppaInsight: null,
  ppaSignalLockedAt: null,
  publishedAt: null,
};

const REST_CARD = {
  ...SIGNAL_CARD,
  id: "card-rest",
  cardType: "REST" as const,
  companyName: "",
  ticker: "",
};

describe("updateGuidedMarketPulseCardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardFindFirst.mockResolvedValue(null);
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await updateGuidedMarketPulseCardAction({
      cardId: "card-signal",
      cardType: "SIGNAL",
      headline: "New",
      newsBody: "Body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
      dayIndex: 1,
    });

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("rejects saving published cards", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...SIGNAL_CARD,
      status: "PUBLISHED",
    });

    const result = await updateGuidedMarketPulseCardAction({
      cardId: "card-signal",
      cardType: "SIGNAL",
      headline: "New",
      newsBody: "Body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
      dayIndex: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("advanced builder");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("updates SIGNAL content fields without touching PPA", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...SIGNAL_CARD,
      ppaSignal: "BULLISH",
      ppaInsight: "Locked insight",
      ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const result = await updateGuidedMarketPulseCardAction({
      cardId: "card-signal",
      cardType: "SIGNAL",
      headline: "New headline",
      newsBody: "New body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "New summary",
      priceLabel: "$100",
      dayIndex: 2,
      cardImageUrl: "https://example.com/card.jpg",
      cardImageAlt: "Chart",
    });

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-signal" },
      data: {
        dayIndex: 2,
        headline: "New headline",
        newsBody: "New body",
        companyName: "Acme",
        ticker: "ACME",
        summary: "New summary",
        priceLabel: "$100",
        cardImageUrl: "https://example.com/card.jpg",
        cardImageAlt: "Chart",
      },
    });
  });

  it("updates REST title/body and mirrors summary from body", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(REST_CARD);

    const result = await updateGuidedMarketPulseCardAction({
      cardId: "card-rest",
      cardType: "REST",
      headline: "Rest title",
      newsBody: "Rest body",
      dayIndex: 3,
    });

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-rest" },
      data: {
        dayIndex: 3,
        headline: "Rest title",
        newsBody: "Rest body",
        summary: "Rest body",
        cardImageUrl: null,
        cardImageAlt: null,
      },
    });
  });
});

describe("approveGuidedMarketPulseCardPpaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("stores PPA fields and approval timestamp without change reason", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(SIGNAL_CARD);

    const result = await approveGuidedMarketPulseCardPpaAction({
      cardId: "card-signal",
      ppaSignal: "CAUTIOUS",
      ppaInsight: "Watch margins.",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("PPA approved.");
    }

    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-signal" },
      data: expect.objectContaining({
        ppaSignal: "CAUTIOUS",
        ppaInsight: "Watch margins.",
        ppaSignalLockedAt: expect.any(Date),
      }),
    });
  });

  it("re-approves PPA and refreshes the approval timestamp", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...SIGNAL_CARD,
      ppaSignal: "BULLISH",
      ppaInsight: "Old insight",
      ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const result = await approveGuidedMarketPulseCardPpaAction({
      cardId: "card-signal",
      ppaSignal: "CAUTIOUS",
      ppaInsight: "Updated insight",
    });

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardUpdate).toHaveBeenCalled();
  });

  it("rejects PPA approval for REST cards", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...SIGNAL_CARD,
      id: "card-rest",
      cardType: "REST" as const,
      companyName: "",
      ticker: "",
    });

    const result = await approveGuidedMarketPulseCardPpaAction({
      cardId: "card-rest",
      ppaSignal: "BULLISH",
      ppaInsight: "Nope",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Rest cards");
    }
  });
});
