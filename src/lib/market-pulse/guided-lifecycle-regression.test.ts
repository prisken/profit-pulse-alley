import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MarketPulseCard,
  MarketPulseCardReviewStatus,
  MarketPulseCardStatus,
  MarketPulseCardType,
  MarketPulseCycleStatus,
  MarketPulseSignal,
} from "@prisma/client";

import {
  approveGuidedMarketPulseCardPpaAction,
  createGuidedMarketPulseCycleAction,
  launchGuidedMarketPulseCycleAction,
  updateGuidedMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  getHubCycleActionLinks,
  getMarketPulseCycleNextAction,
} from "@/lib/market-pulse/admin-cycle-next-action";
import {
  buildGuidedHubProgressSummary,
  getGuidedCardDashboard,
} from "@/lib/market-pulse/guided-card-dashboard";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
} from "@/lib/market-pulse/cycle-card-defaults";
import { getGuidedLaunchPreview } from "@/lib/market-pulse/guided-launch-preview";
import { isGuidedLaunchAlreadyComplete } from "@/lib/market-pulse/guided-launch-readiness";
import {
  MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
  MARKET_PULSE_CARD_TEST_DEFAULTS,
} from "@/lib/market-pulse/market-pulse-test-fixtures";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import {
  sanitizeMarketPulseApiCardPayload,
  toMarketPulseSwipeCardData,
} from "@/lib/market-pulse/swipe-card";

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  cycleCreate: vi.fn(),
  cycleFindUnique: vi.fn(),
  cycleUpdate: vi.fn(),
  cardCreateMany: vi.fn(),
  cardFindUnique: vi.fn(),
  cardFindFirst: vi.fn(),
  cardFindMany: vi.fn(),
  cardUpdate: vi.fn(),
  gameSettingFindFirst: vi.fn(),
  gameSettingUpdate: vi.fn(),
  auditCreate: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

type StoreCycle = {
  id: string;
  name: string;
  status: MarketPulseCycleStatus;
  startsAt: Date;
  endsAt: Date;
  revealAt: Date;
  prizeLabel: string;
};

type StoreCard = {
  id: string;
  cycleId: string;
  dayIndex: number;
  sortOrder: number;
  cardType: MarketPulseCardType;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  headlineZhHant: string | null;
  newsBody: string | null;
  newsBodyZhHant: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: Date | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  cardImageAltZhHant: string | null;
  summary: string | null;
  summaryZhHant: string | null;
  userPrompt: string | null;
  userPromptZhHant: string | null;
  status: MarketPulseCardStatus;
  researchNotes: string | null;
  reviewStatus: MarketPulseCardReviewStatus;
  reviewedAt: Date | null;
  reviewNote: string | null;
  ppaSignal: MarketPulseSignal | null;
  ppaInsight: string | null;
  ppaInsightZhHant: string | null;
  ppaSignalLockedAt: Date | null;
  publishedAt: Date | null;
  revealAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { decisions: number };
};

type GuidedLifecycleStore = {
  cycles: Map<string, StoreCycle>;
  cards: Map<string, StoreCard>;
  settings: {
    id: string;
    activeCycleId: string | null;
    runtimeStatus: "OPEN" | "CLOSED";
    createdAt: Date;
  };
  nextCycleId: number;
  nextCardId: number;
};

function createGuidedLifecycleStore(): GuidedLifecycleStore {
  return {
    cycles: new Map(),
    cards: new Map(),
    settings: {
      id: "settings-1",
      activeCycleId: null,
      runtimeStatus: "CLOSED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    nextCycleId: 0,
    nextCardId: 0,
  };
}

function cardDefaults(overrides: Partial<StoreCard> & Pick<StoreCard, "id" | "cycleId">): StoreCard {
  const now = new Date("2026-08-01T00:00:00.000Z");
  return {
    dayIndex: 1,
    sortOrder: 0,
    cardType: "SIGNAL",
    companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
    companyNameZh: null,
    ticker: QUICK_DRAFT_CARD_TICKER,
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: QUICK_DRAFT_CARD_HEADLINE,
    headlineZhHant: null,
    newsBody: null,
    newsBodyZhHant: null,
    sourceName: "Test Source",
    sourceUrl: "https://example.com/news/market-article-1",
    sourceDate: new Date("2026-08-01T01:00:00.000Z"),
    cardImageUrl: null,
    cardImageAlt: null,
    cardImageAltZhHant: null,
    summary: null,
    summaryZhHant: null,
    userPrompt: "Prompt",
    userPromptZhHant: null,
    status: "DRAFT",
    researchNotes: null,
    reviewStatus: "PENDING",
    reviewedAt: null,
    reviewNote: null,
    ppaSignal: null,
    ppaInsight: null,
    ppaInsightZhHant: null,
    ppaSignalLockedAt: null,
    publishedAt: null,
    revealAt: null,
    createdAt: now,
    updatedAt: now,
    _count: { decisions: 0 },
    ...overrides,
  };
}

function getCardsForCycle(store: GuidedLifecycleStore, cycleId: string): StoreCard[] {
  return [...store.cards.values()]
    .filter((card) => card.cycleId === cycleId)
    .sort((left, right) => {
      if (left.dayIndex !== right.dayIndex) {
        return left.dayIndex - right.dayIndex;
      }
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.createdAt.getTime() - right.createdAt.getTime();
    });
}

function toAdminRows(cards: StoreCard[]): MarketPulseAdminCardRow[] {
  return cards.map((card) => mapMarketPulseAdminCardRow(card));
}

function hubLinksForCycle(
  store: GuidedLifecycleStore,
  cycleId: string,
  cycleStatus: StoreCycle["status"],
  cards: StoreCard[],
) {
  const adminCards = toAdminRows(cards);
  const nextAction = getMarketPulseCycleNextAction({
    cycleId,
    cycleStatus,
    cards: adminCards,
    activeCycleId: store.settings.activeCycleId,
    runtimeStatus: store.settings.runtimeStatus,
  });
  const links = getHubCycleActionLinks(nextAction, cycleId, cycleStatus);

  return { nextAction, links, adminCards };
}

function wireGuidedLifecyclePrisma(store: GuidedLifecycleStore) {
  prismaMocks.cycleCreate.mockImplementation(async ({ data }) => {
    const id = `cycle-guided-${++store.nextCycleId}`;
    const cycle: StoreCycle = {
      id,
      name: data.name,
      status: data.status,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      revealAt: data.revealAt,
      prizeLabel: data.prizeLabel,
    };
    store.cycles.set(id, cycle);
    return cycle;
  });

  prismaMocks.cardCreateMany.mockImplementation(async ({ data }) => {
    for (const row of data) {
      const id = `card-guided-${++store.nextCardId}`;
      const card = cardDefaults({
        id,
        cycleId: row.cycleId,
        dayIndex: row.dayIndex,
        sortOrder: row.sortOrder ?? 0,
        cardType: row.cardType,
        companyName: row.companyName ?? "",
        ticker: row.ticker ?? "",
        headline: row.headline,
        headlineZhHant: row.headlineZhHant ?? null,
        newsBody: row.newsBody ?? null,
        newsBodyZhHant: row.newsBodyZhHant ?? null,
        userPrompt: row.userPrompt ?? "Prompt",
        status: row.status,
        sourceDate: row.sourceDate ?? null,
        ppaSignal: row.ppaSignal ?? null,
        ppaInsight: row.ppaInsight ?? null,
        publishedAt: row.publishedAt ?? null,
      });
      store.cards.set(id, card);
    }
    return { count: data.length };
  });

  prismaMocks.cycleFindUnique.mockImplementation(async ({ where }) => {
    const cycle = store.cycles.get(where.id);
    if (!cycle) {
      return null;
    }
    return {
      id: cycle.id,
      status: cycle.status,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
    };
  });

  prismaMocks.cycleUpdate.mockImplementation(async ({ where, data }) => {
    const cycle = store.cycles.get(where.id);
    if (!cycle) {
      throw new Error("CYCLE_NOT_FOUND");
    }
    store.cycles.set(where.id, { ...cycle, ...data });
    return store.cycles.get(where.id);
  });

  prismaMocks.cardFindUnique.mockImplementation(async ({ where }) => {
    return store.cards.get(where.id) ?? null;
  });

  prismaMocks.cardFindFirst.mockImplementation(async ({ where }) => {
    const excludeId =
      where.NOT && typeof where.NOT === "object" && "id" in where.NOT
        ? where.NOT.id
        : undefined;

    for (const card of store.cards.values()) {
      if (card.cycleId !== where.cycleId) {
        continue;
      }
      if (card.dayIndex !== where.dayIndex) {
        continue;
      }
      if (card.sortOrder !== where.sortOrder) {
        continue;
      }
      if (excludeId && card.id === excludeId) {
        continue;
      }
      return { id: card.id };
    }

    return null;
  });

  prismaMocks.cardFindMany.mockImplementation(async ({ where }) => {
    return getCardsForCycle(store, where.cycleId);
  });

  prismaMocks.cardUpdate.mockImplementation(async ({ where, data }) => {
    const card = store.cards.get(where.id);
    if (!card) {
      throw new Error("CARD_NOT_FOUND");
    }
    store.cards.set(where.id, {
      ...card,
      ...data,
      updatedAt: new Date(),
    });
    return store.cards.get(where.id);
  });

  prismaMocks.gameSettingFindFirst.mockImplementation(async () => store.settings);

  prismaMocks.gameSettingUpdate.mockImplementation(async ({ data }) => {
    store.settings = { ...store.settings, ...data };
    return store.settings;
  });

  prismaMocks.transaction.mockImplementation(async (callback) =>
    callback({
      marketPulseCycle: {
        create: prismaMocks.cycleCreate,
        findUnique: prismaMocks.cycleFindUnique,
        update: prismaMocks.cycleUpdate,
      },
      marketPulseCard: {
        createMany: prismaMocks.cardCreateMany,
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
      findFirst: prismaMocks.cardFindFirst,
      update: prismaMocks.cardUpdate,
    },
    marketPulseAuditLog: {
      create: prismaMocks.auditCreate,
    },
  },
}));

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const GUIDED_CREATE_INPUT = {
  name: "Lifecycle Regression Cycle",
  startDate: "2026-08-01",
  endDate: "2026-08-02",
  revealDate: "2026-08-03",
  defaultSignalCardsPerDay: 1,
  dayOverrides: [
    { dayIndex: 1, dayType: "SIGNAL" as const, signalCardCount: 1 },
    { dayIndex: 2, dayType: "REST" as const, signalCardCount: 1 },
  ],
};

function baseAdminCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    id: "card-1",
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
    newsBody: "Body",
    sourceName: "Test Source",
    sourceUrl: "https://example.com/news/market-article-1",
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: null,
    status: "DRAFT",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    ...overrides,
  };
}

describe("guided lifecycle regression — happy path", () => {
  let store: GuidedLifecycleStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createGuidedLifecycleStore();
    wireGuidedLifecyclePrisma(store);
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates, saves, approves PPA, previews, launches, and keeps runtime output PPA-safe", async () => {
    const createResult = await createGuidedMarketPulseCycleAction(GUIDED_CREATE_INPUT);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const cycleId = createResult.data?.cycleId;
    expect(cycleId).toBeTruthy();
    expect(store.settings.runtimeStatus).toBe("CLOSED");
    expect(store.settings.activeCycleId).toBeNull();

    const cycleCards = getCardsForCycle(store, cycleId!);
    expect(cycleCards).toHaveLength(2);

    const signalCard = cycleCards.find((card) => card.cardType === "SIGNAL");
    const restCard = cycleCards.find((card) => card.cardType === "REST");
    expect(signalCard).toBeDefined();
    expect(restCard).toBeDefined();

    const saveSignal = await updateGuidedMarketPulseCardAction({
      cardId: signalCard!.id,
      cardType: "SIGNAL",
      headline: "Signal headline",
      newsBody: "Signal body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Signal summary",
      dayIndex: 1,
    });
    expect(saveSignal.ok).toBe(true);

    const saveRest = await updateGuidedMarketPulseCardAction({
      cardId: restCard!.id,
      cardType: "REST",
      headline: "Rest title",
      newsBody: "Rest body",
      dayIndex: 2,
    });
    expect(saveRest.ok).toBe(true);

    const approvePpa = await approveGuidedMarketPulseCardPpaAction({
      cardId: signalCard!.id,
      ppaSignal: "BULLISH",
      ppaInsight: "Strong demand.",
    });
    expect(approvePpa.ok).toBe(true);

    const cycle = store.cycles.get(cycleId!)!;
    const adminCards = toAdminRows(getCardsForCycle(store, cycleId!));
    const preview = getGuidedLaunchPreview({
      cycle: { id: cycle.id, status: cycle.status },
      cards: adminCards,
    });

    expect(preview.launchAllowed).toBe(true);
    expect(preview.totalCards).toBe(2);
    expect(preview.signalCount).toBe(1);
    expect(preview.restCount).toBe(1);
    expect(preview.readyCount).toBe(2);
    expect(preview.publishedCount).toBe(0);
    expect(preview.blockingReasons).toEqual([]);

    const launchResult = await launchGuidedMarketPulseCycleAction(cycleId!);
    expect(launchResult.ok).toBe(true);
    if (launchResult.ok) {
      expect(launchResult.data?.publishedCount).toBe(2);
      expect(launchResult.data?.alreadyLaunched).toBe(false);
    }

    const launchedCycle = store.cycles.get(cycleId!)!;
    expect(launchedCycle.status).toBe("OPEN");
    expect(store.settings.activeCycleId).toBe(cycleId);
    expect(store.settings.runtimeStatus).toBe("OPEN");

    const launchedCards = getCardsForCycle(store, cycleId!);
    expect(launchedCards.every((card) => card.status === "PUBLISHED")).toBe(true);
    expect(launchedCards.every((card) => card.publishedAt)).toBe(true);

    const launchedSignal = launchedCards.find((card) => card.cardType === "SIGNAL")!;
    const marketPulseCard = {
      ...launchedSignal,
      ...MARKET_PULSE_CARD_TEST_DEFAULTS,
    } satisfies MarketPulseCard;

    const publicPayload = getMarketPulseCardPublicPayload(marketPulseCard, {
      cycle: {
        status: "OPEN",
        revealAt: launchedCycle.revealAt,
      },
      at: new Date("2026-08-02T00:00:00.000Z"),
    });

    const sanitized = sanitizeMarketPulseApiCardPayload({
      ...publicPayload,
      ppaSignalLockedAt: launchedSignal.ppaSignalLockedAt?.toISOString(),
    });
    const swipe = toMarketPulseSwipeCardData(sanitized);

    expect(sanitized).not.toHaveProperty("ppaSignal");
    expect(sanitized).not.toHaveProperty("ppaInsight");
    expect(sanitized).not.toHaveProperty("ppaSignalLockedAt");
    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
    expect(swipe).not.toHaveProperty("ppaSignalLockedAt");
  });
});

describe("guided lifecycle regression — workflow milestones", () => {
  let store: GuidedLifecycleStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createGuidedLifecycleStore();
    wireGuidedLifecyclePrisma(store);
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks hub, dashboard, and launch milestones from create through idempotent relaunch", async () => {
    const createResult = await createGuidedMarketPulseCycleAction(GUIDED_CREATE_INPUT);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const cycleId = createResult.data?.cycleId;
    expect(cycleId).toBeTruthy();
    if (!cycleId) {
      return;
    }

    const cycle = store.cycles.get(cycleId)!;
    let cycleCards = getCardsForCycle(store, cycleId);

    const afterCreate = hubLinksForCycle(store, cycleId, cycle.status, cycleCards);
    expect(afterCreate.nextAction.kind).toBe("fill_guided_cards");
    expect(afterCreate.links.showReviewAndLaunch).toBe(false);

    const createDashboard = getGuidedCardDashboard(afterCreate.adminCards);
    const createHubProgress = buildGuidedHubProgressSummary({
      cycleStatus: cycle.status,
      cards: afterCreate.adminCards,
    });
    expect(createDashboard.missingContentCount).toBeGreaterThan(0);
    expect(createHubProgress?.missingContentCount).toBe(createDashboard.missingContentCount);
    expect(createHubProgress?.nextSuggestedFocusReason).toBe("missing_content");

    const signalCard = cycleCards.find((card) => card.cardType === "SIGNAL")!;
    const restCard = cycleCards.find((card) => card.cardType === "REST")!;

    expect(
      await updateGuidedMarketPulseCardAction({
        cardId: signalCard.id,
        cardType: "SIGNAL",
        headline: "Signal headline",
        newsBody: "Signal body",
        companyName: "Acme",
        ticker: "ACME",
        summary: "Signal summary",
        dayIndex: 1,
      }),
    ).toMatchObject({ ok: true });

    expect(
      await updateGuidedMarketPulseCardAction({
        cardId: restCard.id,
        cardType: "REST",
        headline: "Rest title",
        newsBody: "Rest body",
        dayIndex: 2,
      }),
    ).toMatchObject({ ok: true });

    expect(
      await approveGuidedMarketPulseCardPpaAction({
        cardId: signalCard.id,
        ppaSignal: "BULLISH",
        ppaInsight: "Strong demand.",
      }),
    ).toMatchObject({ ok: true });

    cycleCards = getCardsForCycle(store, cycleId);
    const afterReady = hubLinksForCycle(store, cycleId, cycle.status, cycleCards);
    expect(afterReady.nextAction.kind).toBe("review_and_launch");
    expect(afterReady.links.showReviewAndLaunch).toBe(false);
    expect(afterReady.links.primaryHref).toContain("guided-launch");

    const readyDashboard = getGuidedCardDashboard(afterReady.adminCards);
    const readyHubProgress = buildGuidedHubProgressSummary({
      cycleStatus: cycle.status,
      cards: afterReady.adminCards,
    });
    expect(readyDashboard.readyCount).toBe(2);
    expect(readyDashboard.missingContentCount).toBe(0);
    expect(readyDashboard.missingPpaCount).toBe(0);
    expect(readyHubProgress?.readyCount).toBe(2);
    expect(readyHubProgress?.totalCards).toBe(2);

    const launchResult = await launchGuidedMarketPulseCycleAction(cycleId);
    expect(launchResult.ok).toBe(true);
    if (launchResult.ok) {
      expect(launchResult.data?.publishedCount).toBe(2);
      expect(launchResult.data?.alreadyLaunched).toBe(false);
    }

    const launchedCycle = store.cycles.get(cycleId)!;
    expect(launchedCycle.status).toBe("OPEN");
    cycleCards = getCardsForCycle(store, cycleId);
    const launchedAdminCards = toAdminRows(cycleCards);

    expect(
      isGuidedLaunchAlreadyComplete({
        cycleStatus: launchedCycle.status,
        activeCycleId: store.settings.activeCycleId,
        runtimeStatus: store.settings.runtimeStatus,
        cycleId,
        cards: launchedAdminCards,
      }),
    ).toBe(true);

    const postLaunchPreview = getGuidedLaunchPreview({
      cycle: { id: cycleId, status: launchedCycle.status },
      cards: launchedAdminCards,
    });
    expect(postLaunchPreview.publishedCount).toBe(postLaunchPreview.totalCards);

    const afterLaunch = hubLinksForCycle(
      store,
      cycleId,
      launchedCycle.status,
      cycleCards,
    );
    expect(afterLaunch.nextAction.kind).toBe("launched");
    expect(afterLaunch.links.showReviewAndLaunch).toBe(false);
    expect(afterLaunch.links.primaryHref).toBeNull();

    prismaMocks.auditCreate.mockClear();
    const relaunch = await launchGuidedMarketPulseCycleAction(cycleId);
    expect(relaunch.ok).toBe(true);
    if (relaunch.ok) {
      expect(relaunch.data?.alreadyLaunched).toBe(true);
    }
    expect(prismaMocks.auditCreate).not.toHaveBeenCalled();
  });
});

describe("guided lifecycle regression — blocking paths", () => {
  it("blocks launch when SIGNAL content is incomplete", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseAdminCard({
          headline: QUICK_DRAFT_CARD_HEADLINE,
          companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
          ticker: QUICK_DRAFT_CARD_TICKER,
          newsBody: "",
          summary: "",
        }),
      ],
    });

    expect(preview.launchAllowed).toBe(false);
    expect(preview.missingContentCount).toBeGreaterThan(0);
    expect(preview.blockingReasons).toContain("Some signal cards are missing content.");
  });

  it("blocks launch when SIGNAL PPA is missing", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseAdminCard({
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.launchAllowed).toBe(false);
    expect(preview.missingPpaCount).toBe(1);
    expect(preview.blockingReasons).toContain(
      "Some signal cards still need PPA approval.",
    );
  });

  it("blocks launch when REST title/body is incomplete", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "OPEN" },
      cards: [
        baseAdminCard(),
        baseAdminCard({
          id: "card-rest",
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: QUICK_REST_DRAFT_CARD_HEADLINE,
          newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
          summary: QUICK_REST_DRAFT_CARD_NEWS_BODY,
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.launchAllowed).toBe(false);
    expect(preview.blockingReasons).toContain("Some rest cards are missing content.");
  });

  it("does not treat published cards as launch blockers when drafts are ready", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "OPEN" },
      cards: [
        baseAdminCard({
          id: "published",
          status: "PUBLISHED",
          publishedAt: "2026-08-01T01:00:00.000Z",
        }),
        baseAdminCard({
          id: "ready-rest",
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: "Rest day",
          newsBody: "Take a break.",
          summary: "Take a break.",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.launchAllowed).toBe(true);
    expect(preview.publishedCount).toBe(1);
    expect(preview.readyCount).toBe(1);
    expect(preview.blockingReasons).toEqual([]);
  });
});

describe("guided lifecycle regression — launch safety", () => {
  let store: GuidedLifecycleStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createGuidedLifecycleStore();
    wireGuidedLifecyclePrisma(store);
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not mutate launch state when readiness fails", async () => {
    const cycleId = "cycle-guided-1";
    store.cycles.set(cycleId, {
      id: cycleId,
      name: "Blocked cycle",
      status: "DRAFT",
      startsAt: new Date("2026-08-01T01:00:00.000Z"),
      endsAt: new Date("2026-08-10T13:00:00.000Z"),
      revealAt: new Date("2026-08-11T01:00:00.000Z"),
      prizeLabel: "Prize",
    });

    store.cards.set(
      "card-ready",
      cardDefaults({
        id: "card-ready",
        cycleId,
        headline: "Ready headline",
        newsBody: "Ready body",
        summary: "Ready summary",
        companyName: "Acme",
        ticker: "ACME",
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
        ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    store.cards.set(
      "card-missing",
      cardDefaults({
        id: "card-missing",
        cycleId,
        dayIndex: 2,
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: QUICK_REST_DRAFT_CARD_HEADLINE,
        newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
      }),
    );

    const result = await launchGuidedMarketPulseCycleAction(cycleId);

    expect(result.ok).toBe(false);
    expect(store.cycles.get(cycleId)?.status).toBe("DRAFT");
    expect(store.settings.runtimeStatus).toBe("CLOSED");
    expect(store.settings.activeCycleId).toBeNull();
    expect([...store.cards.values()].every((card) => card.status === "DRAFT")).toBe(
      true,
    );
  });

  it("returns idempotent success without mutating already-launched cycles", async () => {
    const cycleId = "cycle-guided-1";
    store.cycles.set(cycleId, {
      id: cycleId,
      name: "Launched cycle",
      status: "OPEN",
      startsAt: new Date("2026-08-01T01:00:00.000Z"),
      endsAt: new Date("2026-08-10T13:00:00.000Z"),
      revealAt: new Date("2026-08-11T01:00:00.000Z"),
      prizeLabel: "Prize",
    });
    store.settings = {
      ...store.settings,
      activeCycleId: cycleId,
      runtimeStatus: "OPEN",
    };

    const publishedAt = new Date("2026-08-01T01:00:00.000Z");
    store.cards.set(
      "card-published",
      cardDefaults({
        id: "card-published",
        cycleId,
        status: "PUBLISHED",
        publishedAt,
        headline: "Published headline",
        newsBody: "Published body",
        summary: "Published summary",
        companyName: "Acme",
        ticker: "ACME",
        ppaSignal: "BULLISH",
        ppaInsight: "Insight",
        ppaSignalLockedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );

    const result = await launchGuidedMarketPulseCycleAction(cycleId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.alreadyLaunched).toBe(true);
    }
    expect(store.cycles.get(cycleId)?.status).toBe("OPEN");
    expect(store.settings.activeCycleId).toBe(cycleId);
    expect(store.settings.runtimeStatus).toBe("OPEN");
    expect(prismaMocks.cardUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.cycleUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.gameSettingUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.auditCreate).not.toHaveBeenCalled();
  });
});
