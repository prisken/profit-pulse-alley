import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cardFindUnique: vi.fn(),
  cardFindFirst: vi.fn(),
  cardFindMany: vi.fn(),
  cardUpdate: vi.fn(),
  cycleFindUnique: vi.fn(),
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
      findUnique: prismaMocks.cardFindUnique,
      findFirst: prismaMocks.cardFindFirst,
      findMany: prismaMocks.cardFindMany,
      update: prismaMocks.cardUpdate,
    },
  },
}));

import {
  publishMarketPulseCardAction,
  updateMarketPulseCardDraftAction,
} from "@/lib/market-pulse/admin-actions";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const existingCard = {
  id: "card-1",
  cycleId: "cycle-1",
  dayIndex: 1,
  companyName: "Acme Corp",
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
  summary: null,
  userPrompt: "Prompt",
  ppaSignal: null,
  ppaInsight: null,
  ppaSignalLockedAt: null,
  status: "DRAFT" as const,
  publishedAt: null,
  revealAt: null,
};

const draftSaveInput = {
  cardId: "card-1",
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
  headline: "Updated headline",
  headlineZhHant: "",
  newsBody: "",
  newsBodyZhHant: "",
  sourceName: "",
  sourceUrl: "",
  sourceDate: "",
  cardImageUrl: "",
  cardImageAlt: "",
  cardImageAltZhHant: "",
  summary: "",
  summaryZhHant: "",
  userPrompt: "Prompt",
  userPromptZhHant: "",
  ppaSignal: null,
  ppaInsight: "",
  ppaInsightZhHant: "",
  status: "PUBLISHED" as const,
  publishedAt: "",
  revealAt: "",
};

describe("updateMarketPulseCardDraftAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardFindUnique.mockResolvedValue(existingCard);
    prismaMocks.cardFindMany.mockResolvedValue([]);
    prismaMocks.cardFindFirst.mockResolvedValue(null);
    prismaMocks.cardUpdate.mockResolvedValue({ id: "card-1" });
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await updateMarketPulseCardDraftAction(draftSaveInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
  });

  it("saves incomplete draft fields without requiring summary", async () => {
    const result = await updateMarketPulseCardDraftAction(draftSaveInput);

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardUpdate).toHaveBeenCalledWith({
      where: { id: "card-1" },
      data: expect.objectContaining({
        headline: "Updated headline",
        summary: null,
        status: "DRAFT",
        publishedAt: null,
      }),
    });
  });

  it("forces draft status even when publish status is submitted", async () => {
    await updateMarketPulseCardDraftAction(draftSaveInput);

    const updateArgs = prismaMocks.cardUpdate.mock.calls[0]?.[0];
    expect(updateArgs.data.status).toBe("DRAFT");
    expect(
      isCardLiveForPlayers(
        {
          status: updateArgs.data.status,
          publishedAt: updateArgs.data.publishedAt,
          dayIndex: 1,
        },
        MARKET_PULSE_PUBLIC_LAUNCH_AT,
      ),
    ).toBe(false);
  });
});

describe("publishMarketPulseCardAction guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardFindFirst.mockResolvedValue(null);
    prismaMocks.cardFindMany.mockResolvedValue([
      {
        id: "card-1",
        dayIndex: 1,
        sourceDate: null,
        status: "DRAFT",
      },
    ]);
    prismaMocks.cycleFindUnique.mockResolvedValue({
      startsAt: new Date("2026-03-01T00:00:00+08:00"),
      endsAt: new Date("2026-03-10T00:00:00+08:00"),
    });
  });

  it("blocks publish when required fields are missing", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...existingCard,
      summary: null,
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const result = await publishMarketPulseCardAction("card-1");

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("publishes when card meets validation requirements", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...existingCard,
      summary: "Summary",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: new Date(),
    });
    prismaMocks.cardUpdate.mockResolvedValue({ id: "card-1" });

    const result = await publishMarketPulseCardAction("card-1");

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardUpdate).toHaveBeenCalled();
  });
});
