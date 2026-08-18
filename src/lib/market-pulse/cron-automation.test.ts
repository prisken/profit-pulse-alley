import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MarketPulseCard,
  MarketPulseCycle,
  MarketPulseGameRuntimeStatus,
} from "@prisma/client";

import {
  automationApprovePpa,
  automationCreateGuidedCycle,
  automationGetCardDetail,
  automationGetCycleStatus,
  automationLaunchCycle,
  automationPublishCard,
  automationPublishReadyCards,
  automationUnpublishCard,
  automationUpdateCard,
} from "@/lib/market-pulse/cron-automation";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

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
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
    marketPulseCycle: {
      create: prismaMocks.cycleCreate,
      findUnique: prismaMocks.cycleFindUnique,
      update: prismaMocks.cycleUpdate,
    },
    marketPulseCard: {
      createMany: prismaMocks.cardCreateMany,
      findUnique: prismaMocks.cardFindUnique,
      findFirst: prismaMocks.cardFindFirst,
      findMany: prismaMocks.cardFindMany,
      update: prismaMocks.cardUpdate,
    },
    marketPulseGameSetting: {
      findFirst: prismaMocks.gameSettingFindFirst,
      update: prismaMocks.gameSettingUpdate,
    },
  },
}));

// New server-only dependencies pulled in by the rollover/reveal automation
// (cron-automation.ts) — vitest cannot load `server-only` modules.
vi.mock("@/lib/market-pulse/reveal-ppa-validation.server", () => ({
  validateCycleReadyForReveal: vi.fn(),
}));
vi.mock("@/lib/notifications/reveal-email", () => ({
  sendRevealReadyEmailsForCycle: vi.fn(),
}));
vi.mock("@/lib/notifications/winner-email", () => ({
  sendWinnerEmailForCycle: vi.fn(),
}));
vi.mock("@/lib/market-pulse/server", () => ({
  calculateAndPersistCycleScores: vi.fn(),
}));

type StoreCard = MarketPulseCard & { _count: { decisions: number } };

type Store = {
  cycles: Map<string, MarketPulseCycle>;
  cards: Map<string, StoreCard>;
  settings: {
    id: string;
    activeCycleId: string | null;
    runtimeStatus: MarketPulseGameRuntimeStatus;
  };
  nextCycleId: number;
  nextCardId: number;
};

const FIXED_CREATED_AT = new Date("2026-08-01T00:00:00.000Z");

function createStore(): Store {
  return {
    cycles: new Map(),
    cards: new Map(),
    settings: {
      id: "settings-1",
      activeCycleId: null,
      runtimeStatus: "CLOSED",
    },
    nextCycleId: 0,
    nextCardId: 0,
  };
}

function prismaApi(store: Store) {
  return {
    marketPulseCycle: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `cycle-${store.nextCycleId++}`,
          createdAt: FIXED_CREATED_AT,
          updatedAt: FIXED_CREATED_AT,
          ...data,
        } as unknown as MarketPulseCycle;
        store.cycles.set(row.id, row);
        return row;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        store.cycles.get(where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<MarketPulseCycle>;
      }) => {
        const row = store.cycles.get(where.id)!;
        const next = { ...row, ...data } as MarketPulseCycle;
        store.cycles.set(where.id, next);
        return next;
      },
    },
    marketPulseCard: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        for (const item of data) {
          const row = {
            id: `card-${store.nextCardId++}`,
            createdAt: FIXED_CREATED_AT,
            updatedAt: FIXED_CREATED_AT,
            ...item,
            _count: { decisions: 0 },
          } as unknown as StoreCard;
          store.cards.set(row.id, row);
        }
        return { count: data.length };
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        store.cards.get(where.id) ?? null,
      findFirst: async ({
        where,
      }: {
        where: {
          cycleId?: string;
          dayIndex?: number;
          sortOrder?: number;
          NOT?: { id?: string };
        };
      }) => {
        for (const card of store.cards.values()) {
          if (where.cycleId && card.cycleId !== where.cycleId) continue;
          if (where.dayIndex !== undefined && card.dayIndex !== where.dayIndex) {
            continue;
          }
          if (where.sortOrder !== undefined && card.sortOrder !== where.sortOrder) {
            continue;
          }
          if (where.NOT?.id && card.id === where.NOT.id) continue;
          return card;
        }
        return null;
      },
      findMany: async ({ where }: { where: { cycleId: string } }) => {
        const rows = [...store.cards.values()].filter(
          (card) => card.cycleId === where.cycleId,
        );
        rows.sort(
          (a, b) =>
            a.dayIndex - b.dayIndex ||
            a.sortOrder - b.sortOrder ||
            a.createdAt.getTime() - b.createdAt.getTime(),
        );
        return rows;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<MarketPulseCard>;
      }) => {
        const row = store.cards.get(where.id)!;
        const next = { ...row, ...data } as StoreCard;
        store.cards.set(where.id, next);
        return next;
      },
    },
    marketPulseGameSetting: {
      findFirst: async () => store.settings,
      update: async ({
        data,
      }: {
        where: { id: string };
        data: Partial<Store["settings"]>;
      }) => {
        store.settings = { ...store.settings, ...data };
        return store.settings;
      },
    },
  };
}

function wirePrisma(store: Store) {
  const api = prismaApi(store);
  prismaMocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(api),
  );
  prismaMocks.cycleCreate.mockImplementation(api.marketPulseCycle.create);
  prismaMocks.cycleFindUnique.mockImplementation(api.marketPulseCycle.findUnique);
  prismaMocks.cycleUpdate.mockImplementation(api.marketPulseCycle.update);
  prismaMocks.cardCreateMany.mockImplementation(api.marketPulseCard.createMany);
  prismaMocks.cardFindUnique.mockImplementation(api.marketPulseCard.findUnique);
  prismaMocks.cardFindFirst.mockImplementation(api.marketPulseCard.findFirst);
  prismaMocks.cardFindMany.mockImplementation(api.marketPulseCard.findMany);
  prismaMocks.cardUpdate.mockImplementation(api.marketPulseCard.update);
  prismaMocks.gameSettingFindFirst.mockImplementation(
    api.marketPulseGameSetting.findFirst,
  );
  prismaMocks.gameSettingUpdate.mockImplementation(
    api.marketPulseGameSetting.update,
  );
}

function seedCycle(store: Store, overrides: Partial<MarketPulseCycle> = {}): MarketPulseCycle {
  const cycle = {
    id: "cycle-1",
    name: "Test cycle",
    startsAt: new Date("2026-08-16T01:00:00.000Z"),
    endsAt: new Date("2026-08-25T13:00:00.000Z"),
    revealAt: new Date("2026-08-26T01:00:00.000Z"),
    status: "DRAFT",
    prizeLabel: "Ocean Park ticket",
    createdAt: FIXED_CREATED_AT,
    updatedAt: FIXED_CREATED_AT,
    ...overrides,
  } as MarketPulseCycle;
  store.cycles.set(cycle.id, cycle);
  return cycle;
}

function seedCard(store: Store, overrides: Partial<StoreCard> & Pick<StoreCard, "dayIndex">): StoreCard {
  const { id, _count, ...rest } = overrides;
  const row = {
    ...buildMarketPulseTestCard({
      id: id ?? `card-${store.nextCardId++}`,
      cycleId: "cycle-1",
      ...rest,
    }),
    _count: _count ?? { decisions: 0 },
  } as StoreCard;
  store.cards.set(row.id, row);
  return row;
}

describe("cron automation — guided cycle creation", () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
    wirePrisma(store);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a 16-25 Aug cycle with 14 signal + 3 weekend rest cards, DRAFT", async () => {
    const result = await automationCreateGuidedCycle({
      name: "Cycle Aug 16-25",
      startDate: "2026-08-16",
      endDate: "2026-08-25",
      revealDate: "2026-08-26",
      defaultSignalCardsPerDay: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.signalCardCount).toBe(14);
    expect(result.data.restCardCount).toBe(3);

    const cycle = store.cycles.get(result.data.cycleId)!;
    expect(cycle.status).toBe("DRAFT");
    expect(cycle.startsAt.toISOString()).toBe("2026-08-16T01:00:00.000Z");
    expect(cycle.endsAt.toISOString()).toBe("2026-08-25T13:00:00.000Z");
    expect(cycle.revealAt.toISOString()).toBe("2026-08-26T01:00:00.000Z");

    const cards = [...store.cards.values()];
    expect(cards).toHaveLength(17);

    const restDays = cards
      .filter((card) => card.cardType === "REST")
      .map((card) => card.dayIndex)
      .sort((a, b) => a - b);
    // Aug 16 (Sun), Aug 22 (Sat), Aug 23 (Sun)
    expect(restDays).toEqual([1, 7, 8]);

    const day2Cards = cards.filter((card) => card.dayIndex === 2);
    expect(day2Cards).toHaveLength(2);
    expect(day2Cards.map((card) => card.sortOrder).sort((a, b) => a - b)).toEqual([0, 1]);
    expect(day2Cards.every((card) => card.cardType === "SIGNAL")).toBe(true);
  });

  it("rejects an invalid date range", async () => {
    const result = await automationCreateGuidedCycle({
      name: "Bad cycle",
      startDate: "2026-08-16",
      endDate: "2026-08-25",
      revealDate: "2026-08-25", // must be strictly after endDate
      defaultSignalCardsPerDay: 2,
    });

    expect(result.ok).toBe(false);
  });
});

describe("cron automation — card content and PPA", () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
    wirePrisma(store);
    seedCycle(store);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves SIGNAL card content including zh-Hant fields", async () => {
    const card = seedCard(store, { dayIndex: 2, status: "DRAFT" });

    const result = await automationUpdateCard({
      cardId: card.id,
      cardType: "SIGNAL",
      headline: "Nvidia hits record high",
      newsBody: "NVDA rallied after a strong earnings report.",
      companyName: "Nvidia",
      ticker: "NVDA",
      summary: "Chip giant beats expectations.",
      dayIndex: 2,
      headlineZhHant: "輝達創新高",
      newsBodyZhHant: "NVDA 在強勁業績後上漲。",
      summaryZhHant: "晶片巨頭業績勝預期。",
      sourceName: "Example Finance",
      sourceUrl: "https://example.com/nvda",
    });

    expect(result.ok).toBe(true);

    const updated = store.cards.get(card.id)!;
    expect(updated.headline).toBe("Nvidia hits record high");
    expect(updated.headlineZhHant).toBe("輝達創新高");
    expect(updated.summaryZhHant).toBe("晶片巨頭業績勝預期。");
    expect(updated.sourceUrl).toBe("https://example.com/nvda");
    expect(updated.status).toBe("DRAFT");
  });

  it("blocks content saves on published cards", async () => {
    const card = seedCard(store, { dayIndex: 2, status: "PUBLISHED" });

    const result = await automationUpdateCard({
      cardId: card.id,
      cardType: "SIGNAL",
      headline: "New headline",
      newsBody: "Body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
      dayIndex: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toMatch(/advanced builder/i);
  });

  it("locks PPA on a SIGNAL card", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "DRAFT",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const result = await automationApprovePpa({
      cardId: card.id,
      ppaSignal: "CAUTIOUS",
      ppaInsight: "Valuation is stretched after the run.",
      ppaInsightZhHant: "估值在急升後已偏高。",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const updated = store.cards.get(card.id)!;
    expect(updated.ppaSignal).toBe("CAUTIOUS");
    expect(updated.ppaInsightZhHant).toBe("估值在急升後已偏高。");
    expect(updated.ppaSignalLockedAt).toBeInstanceOf(Date);
  });

  it("rejects PPA approval on REST cards", async () => {
    const card = seedCard(store, { dayIndex: 1, cardType: "REST", status: "DRAFT" });

    const result = await automationApprovePpa({
      cardId: card.id,
      ppaSignal: "BULLISH",
      ppaInsight: "N/A",
    });

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toMatch(/rest cards/i);
  });
});

describe("cron automation — publish and launch", () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
    wirePrisma(store);
    seedCycle(store);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function readySignalCard(dayIndex: number, idOverride?: string): StoreCard {
    return seedCard(store, {
      id: idOverride,
      dayIndex,
      status: "DRAFT",
      summary: "Summary",
      newsBody: "Body",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: new Date("2026-08-10T00:00:00.000Z"),
    });
  }

  it("publishes ready cards and skips unready ones with reasons", async () => {
    readySignalCard(2);
    readySignalCard(3);
    // Missing PPA -> not publishable yet.
    seedCard(store, {
      dayIndex: 4,
      status: "DRAFT",
      summary: "Summary",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const result = await automationPublishReadyCards("cycle-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.published).toBe(2);
    expect(result.data.skipped).toHaveLength(1);

    const publishedCards = [...store.cards.values()].filter(
      (card) => card.status === "PUBLISHED",
    );
    expect(publishedCards).toHaveLength(2);
    expect(publishedCards.every((card) => card.publishedAt)).toBe(true);
  });

  it("launches a ready cycle: publishes, opens, pins active, runtime OPEN", async () => {
    readySignalCard(2);
    readySignalCard(3);

    const result = await automationLaunchCycle("cycle-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.publishedCount).toBe(2);
    expect(result.data.alreadyLaunched).toBe(false);

    expect(store.cycles.get("cycle-1")!.status).toBe("OPEN");
    expect(store.settings.activeCycleId).toBe("cycle-1");
    expect(store.settings.runtimeStatus).toBe("OPEN");

    const cards = [...store.cards.values()];
    expect(cards.every((card) => card.status === "PUBLISHED")).toBe(true);
    expect(cards.every((card) => card.publishedAt)).toBe(true);
  });

  it("is idempotent on relaunch", async () => {
    readySignalCard(2);
    readySignalCard(3);

    const first = await automationLaunchCycle("cycle-1");
    expect(first.ok).toBe(true);

    const again = await automationLaunchCycle("cycle-1");
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.alreadyLaunched).toBe(true);
    expect(again.data.publishedCount).toBe(0);
  });

  it("refuses to launch a cycle with incomplete PPA", async () => {
    readySignalCard(2);
    seedCard(store, {
      dayIndex: 3,
      status: "DRAFT",
      summary: "Summary",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const result = await automationLaunchCycle("cycle-1");

    expect(result.ok).toBe(false);
    expect(store.cycles.get("cycle-1")!.status).toBe("DRAFT");
  });

  it("returns a cycle snapshot with card ids for pipeline mapping", async () => {
    readySignalCard(2);
    seedCard(store, {
      dayIndex: 1,
      cardType: "REST",
      status: "DRAFT",
      ppaSignal: null,
      ppaSignalLockedAt: null,
    });

    const result = await automationGetCycleStatus("cycle-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.cycle.id).toBe("cycle-1");
    expect(result.data.cycle.status).toBe("DRAFT");
    expect(result.data.cards).toHaveLength(2);
    const rest = result.data.cards.find((card) => card.cardType === "REST")!;
    expect(rest.dayIndex).toBe(1);
    expect(rest.ppaLocked).toBe(false);
    const signal = result.data.cards.find((card) => card.cardType === "SIGNAL")!;
    expect(signal.id).toBeTruthy();
    expect(signal.dayIndex).toBe(2);
    expect(signal.sortOrder).toBe(0);
  });

  it("fails cycle status for an unknown cycle", async () => {
    const result = await automationGetCycleStatus("does-not-exist");
    expect(result.ok).toBe(false);
  });

  it("publishes a single ready card with schedule-derived publishedAt", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "DRAFT",
      summary: "Summary",
      newsBody: "Body",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: new Date("2026-08-10T00:00:00.000Z"),
      publishedAt: null,
    });
    expect(card.status).toBe("DRAFT");

    const result = await automationPublishCard(card.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.publishedAt).toBe("2026-08-17T01:00:00.000Z"); // 09:00 HKT day 2

    const updated = store.cards.get(card.id)!;
    expect(updated.status).toBe("PUBLISHED");
    expect(updated.publishedAt).toBeInstanceOf(Date);
  });

  it("rejects publishing a card missing PPA", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "DRAFT",
      summary: "Summary",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    const result = await automationPublishCard(card.id);
    expect(result.ok).toBe(false);
    expect(store.cards.get(card.id)!.status).toBe("DRAFT");
  });

  it("unpublishes a published card with no decisions", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "PUBLISHED",
      summary: "Summary",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: new Date(),
      _count: { decisions: 0 },
    });

    const result = await automationUnpublishCard(card.id);
    expect(result.ok).toBe(true);
    expect(store.cards.get(card.id)!.status).toBe("DRAFT");
    expect(store.cards.get(card.id)!.publishedAt).toBeNull();
  });

  it("blocks unpublish when players have decisions", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "PUBLISHED",
      summary: "Summary",
      _count: { decisions: 3 },
    });

    const result = await automationUnpublishCard(card.id);
    expect(result.ok).toBe(false);
    expect(store.cards.get(card.id)!.status).toBe("PUBLISHED");
  });

  it("blocks unpublish on a draft card", async () => {
    const card = seedCard(store, { dayIndex: 2, status: "DRAFT" });
    const result = await automationUnpublishCard(card.id);
    expect(result.ok).toBe(false);
  });

  it("returns full card detail incl image + PPA fields", async () => {
    const card = seedCard(store, {
      dayIndex: 2,
      status: "PUBLISHED",
      summary: "Summary",
      cardImageUrl: "https://example.com/img.jpg",
      cardImageAlt: "Example tower",
      cardImageAltZhHant: "範例大樓",
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: new Date(),
    });

    const result = await automationGetCardDetail(card.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.cardImageUrl).toBe("https://example.com/img.jpg");
    expect(result.data.cardImageAltZhHant).toBe("範例大樓");
    expect(result.data.ppaSignal).toBe("BULLISH");
    expect(result.data.ppaLocked).toBe(true);
    expect(result.data.status).toBe("PUBLISHED");
  });

  it("fails card detail for an unknown card", async () => {
    const result = await automationGetCardDetail("does-not-exist");
    expect(result.ok).toBe(false);
  });
});
