import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import {
  handleGetMarketPulseLeaderboard,
  handleGetMarketPulseReveal,
  handleGetMarketPulseToday,
  handleSubmitMarketPulseDecision,
} from "@/lib/market-pulse/player-handlers";

const serverMocks = vi.hoisted(() => ({
  getTodayMarketPulseCardForUser: vi.fn(),
  submitMarketPulseDecision: vi.fn(),
  getMarketPulseRevealForUser: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/server", () => ({
  getTodayMarketPulseCardForUser: serverMocks.getTodayMarketPulseCardForUser,
  submitMarketPulseDecision: serverMocks.submitMarketPulseDecision,
  getMarketPulseRevealForUser: serverMocks.getMarketPulseRevealForUser,
  getMarketPulseLeaderboard: serverMocks.getMarketPulseLeaderboard,
}));

const cycleShell = {
  id: "cycle-1",
  name: "Cycle 01",
  startsAt: new Date("2026-07-01T00:00:00.000Z"),
  endsAt: new Date("2026-07-10T16:00:00.000Z"),
  revealAt: new Date("2026-07-10T16:00:00.000Z"),
  status: "OPEN" as const,
};

function buildRestCardPayload(
  overrides: Partial<MarketPulseCardPublicPayload> = {},
): MarketPulseCardPublicPayload {
  return {
    id: "rest-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    cardType: "REST",
    companyName: "",
    companyNameZh: null,
    ticker: "REST",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "市場休息日",
    newsBody: "今日沒有市場信號。",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: null,
    userPrompt: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-07-01T00:00:00.000Z"),
    revealAt: null,
    isRevealed: false,
    ...overrides,
  };
}

describe("handleGetMarketPulseToday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns REST today payload without PPA and with cardType", async () => {
    const restCard = buildRestCardPayload();
    serverMocks.getTodayMarketPulseCardForUser.mockResolvedValue({
      cycle: cycleShell,
      card: restCard,
      userDecision: null,
      cards: [{ card: restCard, userDecision: null }],
    });

    const result = await handleGetMarketPulseToday("user-1", "zh-Hant");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.card.cardType).toBe("REST");
    expect(result.data.card.headline).toBe("市場休息日");
    expect(result.data.card).not.toHaveProperty("ppaSignal");
    expect(result.data.card).not.toHaveProperty("ppaInsight");
    expect(result.data.cards).toHaveLength(1);
    expect(result.data.cards[0]?.card.cardType).toBe("REST");
  });

  it("preserves legacy primary card while exposing all cards for multi-card days", async () => {
    const signalCard = buildRestCardPayload({
      id: "signal-1",
      cardType: "SIGNAL",
      companyName: "Acme",
      ticker: "ACME",
      headline: "Signal headline",
    });
    const restCard = buildRestCardPayload({ id: "rest-1", dayIndex: 1 });

    serverMocks.getTodayMarketPulseCardForUser.mockResolvedValue({
      cycle: cycleShell,
      card: signalCard,
      userDecision: null,
      cards: [
        { card: signalCard, userDecision: null },
        { card: restCard, userDecision: null },
      ],
    });

    const result = await handleGetMarketPulseToday("user-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.card.id).toBe("signal-1");
    expect(result.data.cards).toHaveLength(2);
  });
});

describe("handleSubmitMarketPulseDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts ACKNOWLEDGED for REST cards", async () => {
    serverMocks.submitMarketPulseDecision.mockResolvedValue({
      ok: true,
      alreadySubmitted: false,
      decision: {
        id: "decision-1",
        decision: "ACKNOWLEDGED",
        decidedAt: new Date("2026-07-01T10:00:00.000Z"),
      },
    });

    const result = await handleSubmitMarketPulseDecision(
      "user-1",
      { cardId: "rest-1", decision: "ACKNOWLEDGED" },
      { ipHash: null, userAgentHash: null },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.decision.decision).toBe("ACKNOWLEDGED");
  });

  it("rejects invalid decision and cardType combinations", async () => {
    serverMocks.submitMarketPulseDecision.mockResolvedValueOnce({
      ok: false,
      error: "ACKNOWLEDGED is only valid for Market rest cards.",
    });
    serverMocks.submitMarketPulseDecision.mockResolvedValueOnce({
      ok: false,
      error: "BULLISH and CAUTIOUS are not valid for Market rest cards.",
    });
    serverMocks.submitMarketPulseDecision.mockResolvedValueOnce({
      ok: false,
      error: "Decision must be BULLISH or CAUTIOUS.",
    });

    const ackOnSignal = await handleSubmitMarketPulseDecision(
      "user-1",
      { cardId: "signal-1", decision: "ACKNOWLEDGED" },
      { ipHash: null, userAgentHash: null },
    );
    expect(ackOnSignal.ok).toBe(false);
    if (!ackOnSignal.ok) {
      expect(ackOnSignal.code).toBe("INVALID_DECISION");
    }

    const bullishOnRest = await handleSubmitMarketPulseDecision(
      "user-1",
      { cardId: "rest-1", decision: "BULLISH" },
      { ipHash: null, userAgentHash: null },
    );
    expect(bullishOnRest.ok).toBe(false);
    if (!bullishOnRest.ok) {
      expect(bullishOnRest.code).toBe("INVALID_DECISION");
    }

    const invalidChoice = await handleSubmitMarketPulseDecision(
      "user-1",
      { cardId: "signal-1", decision: "MAYBE" },
      { ipHash: null, userAgentHash: null },
    );
    expect(invalidChoice.ok).toBe(false);
    if (!invalidChoice.ok) {
      expect(invalidChoice.code).toBe("INVALID_DECISION");
    }
  });

  it("returns ALREADY_SUBMITTED for duplicate decisions", async () => {
    serverMocks.submitMarketPulseDecision.mockResolvedValue({
      ok: true,
      alreadySubmitted: true,
      decision: {
        id: "decision-1",
        decision: "ACKNOWLEDGED",
        decidedAt: new Date("2026-07-01T10:00:00.000Z"),
      },
    });

    const result = await handleSubmitMarketPulseDecision(
      "user-1",
      { cardId: "rest-1", decision: "ACKNOWLEDGED" },
      { ipHash: null, userAgentHash: null },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ALREADY_SUBMITTED");
    }
  });
});

describe("handleGetMarketPulseReveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes rest-card participation results after reveal without PPA fields", async () => {
    serverMocks.getMarketPulseRevealForUser.mockResolvedValue({
      cycleId: "cycle-1",
      cycleName: "Cycle 01",
      isRevealed: true,
      cards: [
        {
          cardId: "rest-1",
          dayIndex: 2,
          sortOrder: 0,
          cardsOnDay: 1,
          cardType: "REST",
          companyName: "",
          headline: "Market rest day",
          userDecision: "ACKNOWLEDGED",
          ppaSignal: null,
          ppaInsight: null,
          participationPoints: 10,
          matchBonus: 0,
          streakBonus: 0,
          totalPoints: 10,
        },
      ],
      totals: {
        participationPoints: 10,
        matchBonus: 0,
        streakBonus: 0,
        totalPoints: 10,
      },
    });

    const result = await handleGetMarketPulseReveal("user-1", "cycle-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.cards).toHaveLength(1);
    expect(result.data.cards[0]).toMatchObject({
      cardType: "REST",
      userDecision: "ACKNOWLEDGED",
      participationPoints: 10,
      matchBonus: 0,
      streakBonus: 0,
      totalPoints: 10,
    });
    expect(result.data.cards[0]).not.toHaveProperty("ppaSignal");
    expect(result.data.cards[0]).not.toHaveProperty("ppaInsight");
  });
});

describe("handleGetMarketPulseLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps locked leaderboard rows unrevealed before cycle reveal", async () => {
    serverMocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "user-1",
        playerName: "Player",
        image: null,
        score: 20,
        participationPoints: 20,
        bonusPoints: 0,
        isRevealed: false,
        cardsPlayed: 2,
      },
    ]);

    const result = await handleGetMarketPulseLeaderboard({
      mode: "current-cycle",
      cycleId: "cycle-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.entries[0]?.isRevealed).toBe(false);
    expect(result.entries[0]?.bonusPoints).toBe(0);
  });

  it("returns participation-only totals for rest cards after reveal via score events", async () => {
    serverMocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "user-1",
        playerName: "Player",
        image: null,
        score: 20,
        participationPoints: 20,
        bonusPoints: 0,
        isRevealed: true,
        cardsPlayed: 2,
      },
    ]);

    const result = await handleGetMarketPulseLeaderboard({
      mode: "current-cycle",
      cycleId: "cycle-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.entries[0]).toMatchObject({
      score: 20,
      participationPoints: 20,
      bonusPoints: 0,
      isRevealed: true,
    });
  });
});
