import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cardFindUnique: vi.fn(),
  cycleFindUnique: vi.fn(),
  cardCreate: vi.fn(),
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
      create: prismaMocks.cardCreate,
    },
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
  },
}));

import { duplicateMarketPulseCardAction } from "@/lib/market-pulse/admin-actions";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const sourceCard = {
  id: "card-source",
  cycleId: "cycle-1",
  cardType: "SIGNAL" as const,
  dayIndex: 1,
  companyName: "Acme Corp",
  companyNameZh: null,
  ticker: "ACME",
  exchange: null,
  logoUrl: null,
  logoInitials: null,
  priceLabel: null,
  priceDirection: null,
  headline: "Acme beats estimates",
  newsBody: "Body",
  sourceName: null,
  sourceUrl: null,
  sourceDate: MARKET_PULSE_PUBLIC_LAUNCH_AT,
  cardImageUrl: null,
  cardImageAlt: null,
  summary: "Summary",
  userPrompt: "Prompt",
  ppaSignal: "BULLISH" as const,
  ppaInsight: "Insight",
  ppaSignalLockedAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
  status: "PUBLISHED" as const,
  publishedAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
  revealAt: null,
  createdAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
  updatedAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
};

describe("duplicateMarketPulseCardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardFindUnique.mockResolvedValue(sourceCard);
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: "cycle-1",
      startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      cards: [
        { dayIndex: 1, sortOrder: 0 },
        { dayIndex: 2, sortOrder: 0 },
      ],
    });
    prismaMocks.cardCreate.mockResolvedValue({ id: "card-copy" });
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await duplicateMarketPulseCardAction({
      sourceCardId: "card-source",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.cardCreate).not.toHaveBeenCalled();
  });

  it("creates a draft duplicate in the target cycle on the current day with next sort order", async () => {
    const result = await duplicateMarketPulseCardAction({
      sourceCardId: "card-source",
      targetCycleId: "cycle-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.cardId).toBe("card-copy");
    }

    expect(prismaMocks.cardCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cycleId: "cycle-1",
        dayIndex: 1,
        sortOrder: 1,
        headline: sourceCard.headline,
        ticker: sourceCard.ticker,
        status: "DRAFT",
        publishedAt: null,
        ppaSignalLockedAt: null,
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
      }),
    });
  });

  it("does not modify the source card", async () => {
    await duplicateMarketPulseCardAction({ sourceCardId: "card-source" });

    expect(prismaMocks.cardFindUnique).toHaveBeenCalledWith({
      where: { id: "card-source" },
    });
    expect(prismaMocks.cardCreate).toHaveBeenCalledTimes(1);
  });

  it("creates duplicates that are not live for players", async () => {
    await duplicateMarketPulseCardAction({ sourceCardId: "card-source" });

    const createArgs = prismaMocks.cardCreate.mock.calls[0]?.[0];
    expect(
      isCardLiveForPlayers(
        {
          status: createArgs.data.status,
          publishedAt: createArgs.data.publishedAt,
          dayIndex: createArgs.data.dayIndex,
        },
        MARKET_PULSE_PUBLIC_LAUNCH_AT,
      ),
    ).toBe(false);
  });

  it("defaults to the source cycle when targetCycleId is omitted", async () => {
    await duplicateMarketPulseCardAction({ sourceCardId: "card-source" });

    expect(prismaMocks.cycleFindUnique).toHaveBeenCalledWith({
      where: { id: "cycle-1" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        cards: { select: { dayIndex: true, sortOrder: true, sourceDate: true } },
      },
    });
  });

  it("preserves REST card type and clears PPA on duplicate", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...sourceCard,
      cardType: "REST",
      companyName: "",
      ticker: "",
      headline: "Market rest day",
      newsBody: "Rest body",
      summary: null,
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    await duplicateMarketPulseCardAction({ sourceCardId: "card-source" });

    expect(prismaMocks.cardCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cardType: "REST",
        headline: "Market rest day",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
        status: "DRAFT",
        publishedAt: null,
      }),
    });
  });
});
