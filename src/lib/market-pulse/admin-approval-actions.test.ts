import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cardFindUnique: vi.fn(),
  cardUpdate: vi.fn(),
  cardFindMany: vi.fn(),
  cycleFindUnique: vi.fn(),
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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCard: {
      findUnique: prismaMocks.cardFindUnique,
      update: prismaMocks.cardUpdate,
      findMany: prismaMocks.cardFindMany,
    },
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

import {
  approveAndPublishMarketPulseCardAction,
  rejectMarketPulseCardAction,
} from "@/lib/market-pulse/admin-approval-actions";

function makeCard(overrides: Record<string, unknown> = {}) {
  return {
    id: "card_1",
    cycleId: "cycle_1",
    dayIndex: 3,
    sortOrder: 0,
    cardType: "SIGNAL",
    companyName: "Advanced Micro Devices",
    companyNameZh: null,
    ticker: "AMD",
    exchange: "NASDAQ",
    headline: "AMD gains on AI accelerator demand",
    headlineZhHant: "AMD受惠AI加速器需求",
    newsBody: "Data-center revenue hit a record on MI300 demand.",
    newsBodyZhHant: null,
    summary: "AMD data-center momentum continues.",
    summaryZhHant: null,
    userPrompt: null,
    userPromptZhHant: null,
    sourceName: "Reuters",
    sourceUrl: "https://example.com/story",
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    cardImageAltZhHant: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    ppaSignal: null,
    ppaInsight: null,
    ppaInsightZhHant: null,
    ppaSignalLockedAt: null,
    status: "DRAFT",
    publishedAt: null,
    revealAt: null,
    researchNotes: "Research pass notes.",
    reviewStatus: "PENDING",
    reviewedAt: null,
    reviewNote: null,
    createdAt: new Date("2026-08-08T00:00:00.000Z"),
    updatedAt: new Date("2026-08-08T00:00:00.000Z"),
    ...overrides,
  };
}

const CYCLE = { startsAt: new Date("2026-08-10T00:00:00.000Z"), endsAt: new Date("2026-08-19T00:00:00.000Z") };

describe("admin approval actions", () => {
  beforeEach(() => {
    prismaMocks.cardFindUnique.mockReset();
    prismaMocks.cardUpdate.mockReset();
    prismaMocks.cardFindMany.mockReset();
    prismaMocks.cycleFindUnique.mockReset();
    prismaMocks.auditCreate.mockReset();
    authMocks.requireAdminSession.mockReset();
    authMocks.requireAdminSession.mockResolvedValue({
      userId: "admin_1",
      email: "admin@ppa.test",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns Unauthorized when there is no admin session", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);
    const result = await approveAndPublishMarketPulseCardAction({
      cardId: "card_1",
      ppaSignal: "BULLISH",
      ppaInsight: "Demand is strong.",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("approves and publishes a SIGNAL card with a PPA decision", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(makeCard());
    prismaMocks.cardFindMany.mockResolvedValue([]);
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardUpdate.mockResolvedValue(makeCard({ status: "PUBLISHED" }));

    const result = await approveAndPublishMarketPulseCardAction({
      cardId: "card_1",
      ppaSignal: "BULLISH",
      ppaInsight: "AI demand backlog gives revenue visibility.",
      ppaInsightZhHant: "AI需求積壓提供收入能見度。",
    });

    expect(result.ok).toBe(true);
    const updateData = prismaMocks.cardUpdate.mock.calls[0][0].data;
    expect(updateData.reviewStatus).toBe("APPROVED");
    expect(updateData.status).toBe("PUBLISHED");
    expect(updateData.ppaSignal).toBe("BULLISH");
    expect(updateData.ppaSignalLockedAt).toBeInstanceOf(Date);
    expect(updateData.publishedAt).toBeInstanceOf(Date);
    expect(prismaMocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "APPROVE_AND_PUBLISH" }),
      }),
    );
  });

  it("approves and publishes a REST card without PPA", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(
      makeCard({ cardType: "REST", headline: "週末小歇", newsBody: "休息一下" }),
    );
    prismaMocks.cardFindMany.mockResolvedValue([]);
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardUpdate.mockResolvedValue(makeCard({ status: "PUBLISHED" }));

    const result = await approveAndPublishMarketPulseCardAction({
      cardId: "card_1",
    });

    expect(result.ok).toBe(true);
    const updateData = prismaMocks.cardUpdate.mock.calls[0][0].data;
    expect(updateData.reviewStatus).toBe("APPROVED");
    expect(updateData.status).toBe("PUBLISHED");
    expect(updateData.ppaSignalLockedAt).toBeUndefined();
    expect(prismaMocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "APPROVE_AND_PUBLISH_REST" }),
      }),
    );
  });

  it("fails when a SIGNAL card has no PPA decision", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(makeCard());

    const result = await approveAndPublishMarketPulseCardAction({
      cardId: "card_1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/PPA/i);
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("fails when the card is already published", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(
      makeCard({ status: "PUBLISHED" }),
    );

    const result = await approveAndPublishMarketPulseCardAction({
      cardId: "card_1",
      ppaSignal: "BULLISH",
      ppaInsight: "x",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/draft/i);
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("rejects a draft card with a note", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(makeCard());
    prismaMocks.cardUpdate.mockResolvedValue(
      makeCard({ reviewStatus: "REJECTED" }),
    );

    const result = await rejectMarketPulseCardAction({
      cardId: "card_1",
      reviewNote: "Headline needs a hook.",
    });

    expect(result.ok).toBe(true);
    const updateData = prismaMocks.cardUpdate.mock.calls[0][0].data;
    expect(updateData.reviewStatus).toBe("REJECTED");
    expect(updateData.reviewNote).toBe("Headline needs a hook.");
    expect(prismaMocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "REJECT_CARD" }),
      }),
    );
  });

  it("cannot reject a published card", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(
      makeCard({ status: "PUBLISHED" }),
    );

    const result = await rejectMarketPulseCardAction({ cardId: "card_1" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/published/i);
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });
});
