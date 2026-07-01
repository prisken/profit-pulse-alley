import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
  cardCreate: vi.fn(),
  cardUpdate: vi.fn(),
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
      create: prismaMocks.cardCreate,
      update: prismaMocks.cardUpdate,
    },
  },
}));

import { quickCreateMarketPulseCardDraftAction, quickCreateMarketPulseRestCardDraftAction } from "@/lib/market-pulse/admin-actions";
import { isCardLiveForPlayers } from "@/lib/market-pulse/admin-card-ppa-status";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_HEADLINE_ZH,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
  QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH,
} from "@/lib/market-pulse/cycle-card-defaults";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const EXISTING_CARD = {
  id: "card-2",
  dayIndex: 2,
  userPrompt: "Reuse this prompt",
  exchange: "HKEX",
  sourceName: "Reuters",
  sourceUrl: "https://news.example.com/story",
  headline: "Existing headline",
  companyName: "Existing Co",
  ticker: "EXST",
};

describe("quickCreateMarketPulseCardDraftAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: "cycle-1",
      startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      revealAt: new Date("2026-04-01T12:00:00+08:00"),
      prizeLabel: "One Ocean Park ticket",
      cards: [{ dayIndex: 1 }, EXISTING_CARD],
    });
    prismaMocks.cardCreate.mockResolvedValue({ id: "card-new" });
    prismaMocks.cardUpdate.mockResolvedValue({});
  });

  it("rejects guests and non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await quickCreateMarketPulseCardDraftAction("cycle-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Unauthorized");
    }
    expect(prismaMocks.cardCreate).not.toHaveBeenCalled();
  });

  it("creates a draft card with values copied from the latest card", async () => {
    const result = await quickCreateMarketPulseCardDraftAction("cycle-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.cardId).toBe("card-new");
    }

    expect(prismaMocks.cardCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cycleId: "cycle-1",
        dayIndex: 1,
        sortOrder: 1,
        headline: QUICK_DRAFT_CARD_HEADLINE,
        companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
        ticker: QUICK_DRAFT_CARD_TICKER,
        userPrompt: "Reuse this prompt",
        exchange: "HKEX",
        sourceName: "Reuters",
        sourceUrl: "https://news.example.com/story",
        status: "DRAFT",
        publishedAt: null,
        ppaSignal: null,
        ppaInsight: null,
      }),
    });
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("uses a prompt override without updating existing cards", async () => {
    await quickCreateMarketPulseCardDraftAction("cycle-1", {
      promptOverride: "Override prompt",
    });

    expect(prismaMocks.cardCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userPrompt: "Override prompt",
      }),
    });
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("creates cards that are not live for players", async () => {
    await quickCreateMarketPulseCardDraftAction("cycle-1");

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

  it("creates a REST draft with default bilingual rest copy", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      id: "cycle-1",
      startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      endsAt: new Date("2026-04-10T12:00:00+08:00"),
      revealAt: new Date("2026-04-01T12:00:00+08:00"),
      prizeLabel: "One Ocean Park ticket",
      cards: [],
    });

    const result = await quickCreateMarketPulseRestCardDraftAction("cycle-1");

    expect(result.ok).toBe(true);
    expect(prismaMocks.cardCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cycleId: "cycle-1",
        cardType: "REST",
        headline: QUICK_REST_DRAFT_CARD_HEADLINE,
        headlineZhHant: QUICK_REST_DRAFT_CARD_HEADLINE_ZH,
        newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
        newsBodyZhHant: QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH,
        companyName: "",
        ticker: "",
        status: "DRAFT",
        ppaSignal: null,
        ppaInsight: null,
        publishedAt: null,
      }),
    });
  });
});
