import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketPulseCard } from "@prisma/client";

import {
  approveGuidedMarketPulseCardPpaAction,
  launchGuidedMarketPulseCycleAction,
  updateGuidedMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";
import { getMarketPulseCycleNextAction } from "@/lib/market-pulse/admin-cycle-next-action";
import { evaluateGuidedLaunchReadiness } from "@/lib/market-pulse/guided-launch-readiness";
import { MARKET_PULSE_CARD_TEST_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import {
  sanitizeMarketPulseApiCardPayload,
  stripPpaFromCardPayload,
  toMarketPulseSwipeCardData,
} from "@/lib/market-pulse/swipe-card";

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  cycleFindUnique: vi.fn(),
  cycleUpdate: vi.fn(),
  cardFindUnique: vi.fn(),
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
    marketPulseCard: {
      findUnique: prismaMocks.cardFindUnique,
      update: prismaMocks.cardUpdate,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

const ADMIN = { userId: "admin-1", email: "admin@example.com" };
const CYCLE_ID = "cycle-1";

const basePrismaCard = {
  id: "card-1",
  cycleId: CYCLE_ID,
  dayIndex: 1,
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
  updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  _count: { decisions: 0 },
};

const baseMarketPulseCard = {
  ...basePrismaCard,
  ...MARKET_PULSE_CARD_TEST_DEFAULTS,
} satisfies MarketPulseCard;

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

function readySignalCard(overrides: Record<string, unknown> = {}) {
  return { ...basePrismaCard, ...overrides };
}

function setupLaunchTransaction() {
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

describe("PPA privacy — play/today serialization", () => {
  const revealedCycle = {
    status: "REVEALED" as const,
    revealAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  it("stripPpaFromCardPayload removes ppaSignal, ppaInsight, and ppaSignalLockedAt", () => {
    const stripped = stripPpaFromCardPayload({
      id: "card-1",
      ppaSignal: "BULLISH",
      ppaInsight: "secret",
      ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(stripped).toEqual({ id: "card-1" });
  });

  it("sanitizeMarketPulseApiCardPayload strips PPA even when underlying card is revealed", () => {
    const payload = getMarketPulseCardPublicPayload(baseMarketPulseCard, {
      cycle: revealedCycle,
      at: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(payload.isRevealed).toBe(true);
    expect(payload.ppaSignal).toBe("BULLISH");

    const sanitized = sanitizeMarketPulseApiCardPayload({
      ...payload,
      ppaSignalLockedAt: baseMarketPulseCard.ppaSignalLockedAt?.toISOString(),
    });

    expect(sanitized).not.toHaveProperty("ppaSignal");
    expect(sanitized).not.toHaveProperty("ppaInsight");
    expect(sanitized).not.toHaveProperty("ppaSignalLockedAt");
  });

  it("toMarketPulseSwipeCardData never forwards PPA or lock metadata", () => {
    const swipe = toMarketPulseSwipeCardData({
      id: "card-1",
      cardType: "SIGNAL",
      companyName: "Acme",
      ticker: "ACME",
      headline: "Headline",
      ppaSignal: "BULLISH",
      ppaInsight: "secret",
      isRevealed: true,
      ...({ ppaSignalLockedAt: "2026-01-01T00:00:00.000Z" } as Record<string, unknown>),
    });

    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
    expect(swipe).not.toHaveProperty("ppaSignalLockedAt");
    expect(swipe).not.toHaveProperty("isRevealed");
  });
});

describe("PPA privacy — intentional reveal path", () => {
  it("includes ppaSignal and ppaInsight for revealed SIGNAL cards in public payload", () => {
    const payload = getMarketPulseCardPublicPayload(baseMarketPulseCard, {
      cycle: { status: "REVEALED", revealAt: new Date("2026-01-01T00:00:00.000Z") },
      at: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(payload.isRevealed).toBe(true);
    expect(payload.ppaSignal).toBe("BULLISH");
    expect(payload.ppaInsight).toBe("Insight");
    expect(payload).not.toHaveProperty("ppaSignalLockedAt");
  });
});

describe("guided mutation authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("approveGuidedMarketPulseCardPpaAction blocks non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const result = await approveGuidedMarketPulseCardPpaAction({
      cardId: "card-1",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
    });

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("approveGuidedMarketPulseCardPpaAction blocks PUBLISHED cards", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue({
      ...basePrismaCard,
      status: "PUBLISHED",
    });

    const result = await approveGuidedMarketPulseCardPpaAction({
      cardId: "card-1",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("advanced builder");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("updateGuidedMarketPulseCardAction rejects cardType mismatch", async () => {
    prismaMocks.cardFindUnique.mockResolvedValue(basePrismaCard);

    const result = await updateGuidedMarketPulseCardAction({
      cardId: "card-1",
      cardType: "REST",
      headline: "Headline",
      newsBody: "Body",
      dayIndex: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Card type does not match");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
  });
});

describe("guided launch state safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    prismaMocks.cycleUpdate.mockResolvedValue({});
    prismaMocks.cardUpdate.mockResolvedValue({});
    prismaMocks.gameSettingUpdate.mockResolvedValue({});
    setupLaunchTransaction();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks ARCHIVED cycles from launching", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "ARCHIVED",
    });
    prismaMocks.cardFindMany.mockResolvedValue([readySignalCard()]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Archived cycles cannot be launched");
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("does not mutate state when launch readiness fails", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardFindMany.mockResolvedValue([
      readySignalCard(),
      readySignalCard({
        id: "card-2",
        dayIndex: 2,
        newsBody: "",
        summary: "",
      }),
    ]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("rolls back guided launch when publish validation fails", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardFindMany.mockResolvedValue([
      readySignalCard({ dayIndex: 99 }),
    ]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const result = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(result.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });

  it("does not create audit rows on idempotent launch", async () => {
    prismaMocks.cycleFindUnique.mockResolvedValue({
      ...CYCLE,
      status: "OPEN",
    });
    prismaMocks.cardFindMany.mockResolvedValue([
      readySignalCard({
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T01:00:00.000Z"),
      }),
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
    }
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.auditCreate).not.toHaveBeenCalled();
  });
});

describe("hub next-action is advisory only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    setupLaunchTransaction();
  });

  const hubReadyCard = {
    id: "card-1",
    cycleId: CYCLE_ID,
    dayIndex: 1,
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
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    cardImageAltZhHant: null,
    summary: "Summary",
    summaryZhHant: null,
    userPrompt: null,
    userPromptZhHant: null,
    status: "DRAFT" as const,
    ppaSignal: "BULLISH" as const,
    ppaInsight: "Insight",
    ppaInsightZhHant: null,
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
  };

  it("hub may recommend review_and_launch while launch re-reads and blocks stale server state", async () => {
    const hubAction = getMarketPulseCycleNextAction({
      cycleId: CYCLE_ID,
      cycleStatus: "DRAFT",
      cards: [hubReadyCard],
      activeCycleId: null,
      runtimeStatus: "CLOSED",
    });

    expect(hubAction.kind).toBe("review_and_launch");

    const staleServerCard = readySignalCard({
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const serverReadiness = evaluateGuidedLaunchReadiness([
      {
        ...hubReadyCard,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      },
    ]);
    expect(serverReadiness.ready).toBe(false);

    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
    prismaMocks.cardFindMany.mockResolvedValue([staleServerCard]);
    prismaMocks.gameSettingFindFirst.mockResolvedValue(SETTINGS);

    const launchResult = await launchGuidedMarketPulseCycleAction(CYCLE_ID);

    expect(launchResult.ok).toBe(false);
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
  });
});
