import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";

const AFTER_LAUNCH = new Date("2026-07-01T12:00:00.000Z");

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isDatabaseConfigured: vi.fn(),
  getMarketPulseSettings: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  getTodayMarketPulsePlaySessionSnapshot: vi.fn(),
  getTodayMarketPulsePlaySession: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  loadMarketPulseNextCycleStatus: vi.fn(),
  shouldShowLearningInterestPrompt: vi.fn(),
  getOrCreateUserNotificationPreference: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db-config", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured,
}));

vi.mock("@/lib/market-pulse/next-cycle", () => ({
  loadMarketPulseNextCycleStatus: mocks.loadMarketPulseNextCycleStatus,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: mocks.getMarketPulseSettings,
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
  getTodayMarketPulsePlaySessionSnapshot: mocks.getTodayMarketPulsePlaySessionSnapshot,
  getTodayMarketPulsePlaySession: mocks.getTodayMarketPulsePlaySession,
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed: vi.fn(() => false),
}));

vi.mock("@/lib/acquisition/profile", () => ({
  shouldShowLearningInterestPrompt: mocks.shouldShowLearningInterestPrompt,
}));

vi.mock("@/lib/notifications/notification-preferences", () => ({
  getOrCreateUserNotificationPreference:
    mocks.getOrCreateUserNotificationPreference,
}));

import { getMarketPulsePlayPageData } from "@/lib/market-pulse/play-data";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const cycleStart = new Date("2026-06-30T16:00:00.000Z");
const cycleEnd = new Date("2026-07-10T16:00:00.000Z");
const cycleReveal = new Date("2026-07-10T16:00:00.000Z");

const activeCycle = {
  id: "cycle-july",
  name: "July 2026 Market Pulse",
  prizeLabel: "One Ocean Park ticket",
  startsAt: cycleStart,
  endsAt: cycleEnd,
  revealAt: cycleReveal,
  status: "OPEN" as const,
  cards: [],
};

function buildDbCard(overrides: Partial<ReturnType<typeof buildMarketPulseTestCard>> = {}) {
  return buildMarketPulseTestCard({
    id: "card-day-1-a",
    cycleId: activeCycle.id,
    dayIndex: 1,
    sortOrder: 0,
    companyName: "Example Co",
    ticker: "EX",
    headline: "Headline A",
    summary: "Summary",
    userPrompt: "Prompt",
    ppaInsight: "Hidden insight",
    publishedAt: cycleStart,
    ppaSignalLockedAt: cycleStart,
    createdAt: cycleStart,
    updatedAt: cycleStart,
    ...overrides,
  });
}

function buildSessionSnapshot() {
  const cardA = buildDbCard({ id: "card-a", sortOrder: 0, headline: "Headline A" });
  const cardB = buildDbCard({ id: "card-b", sortOrder: 1, headline: "Headline B" });
  return {
    cycle: {
      id: activeCycle.id,
      name: activeCycle.name,
      startsAt: activeCycle.startsAt,
      endsAt: activeCycle.endsAt,
      revealAt: activeCycle.revealAt,
      status: activeCycle.status,
    },
    cards: [
      {
        card: getMarketPulseCardPublicPayload(cardA, {
          cycle: activeCycle,
          at: AFTER_LAUNCH,
        }),
        userDecision: null,
      },
      {
        card: getMarketPulseCardPublicPayload(cardB, {
          cycle: activeCycle,
          at: AFTER_LAUNCH,
        }),
        userDecision: null,
      },
    ],
  };
}

describe("getMarketPulsePlayPageData — multiple cards per day", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AFTER_LAUNCH);
    vi.clearAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.getMarketPulseSettings.mockResolvedValue({
      runtimeStatus: "OPEN",
      activeCycle,
    });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(activeCycle);
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(buildSessionSnapshot());
    mocks.shouldShowLearningInterestPrompt.mockResolvedValue(false);
    mocks.getOrCreateUserNotificationPreference.mockResolvedValue({
      marketPulseRemindersEnabled: false,
      revealNotificationsEnabled: true,
      eventUpdatesEnabled: false,
      learningDigestEnabled: false,
      unsubscribedAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns playable with the first unplayed card when user has a decision on card 1", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const snapshot = buildSessionSnapshot();
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue({
      cycle: snapshot.cycle,
      cards: [
        {
          ...snapshot.cards[0]!,
          userDecision: {
            id: "dec-1",
            decision: "BULLISH" as const,
            decidedAt: AFTER_LAUNCH,
          },
        },
        snapshot.cards[1]!,
      ],
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.cardsToday).toHaveLength(2);
    expect(data.card?.id).toBe("card-b");
    expect(data.cardProgress).toEqual({ current: 2, total: 2 });
    expect(data.lockedDecision).toBeNull();
  });

  it("returns locked when all available cards have decisions", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const snapshot = buildSessionSnapshot();
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue({
      cycle: snapshot.cycle,
      cards: snapshot.cards.map((slot, index) => ({
        ...slot,
        userDecision: {
          id: `dec-${index}`,
          decision: index === 0 ? ("BULLISH" as const) : ("CAUTIOUS" as const),
          decidedAt: AFTER_LAUNCH,
        },
      })),
    });

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("locked");
    expect(data.cardsToday.every((slot) => slot.userDecision)).toBe(true);
    expect(data.lockedDecision).toBe("CAUTIOUS");
    expect(data.cardProgress).toEqual({ current: 2, total: 2 });
  });

  it("returns no_card_today when no playable cards exist", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(null);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("no_card_today");
    expect(data.cardsToday).toHaveLength(0);
  });

  it("keeps single-card behavior without card progress", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const snapshot = buildSessionSnapshot();
    const single = {
      cycle: snapshot.cycle,
      cards: [snapshot.cards[0]!],
    };
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue(single);
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(single);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.cardsToday).toHaveLength(1);
    expect(data.cardProgress).toBeNull();
  });

  it("returns sign_in_required for guests with card preview", async () => {
    mocks.auth.mockResolvedValue(null);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("sign_in_required");
    expect(data.card?.headline).toBe("Headline A");
    expect(data.cardsToday).toHaveLength(2);
  });

  it("advances to signal card after rest card is acknowledged", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const restDb = buildDbCard({
      id: "card-rest",
      cardType: "REST",
      sortOrder: 0,
      headline: "Rest day",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });
    const signalDb = buildDbCard({
      id: "card-signal",
      cardType: "SIGNAL",
      sortOrder: 1,
      headline: "Signal day",
    });
    const snapshot = {
      cycle: {
        id: activeCycle.id,
        name: activeCycle.name,
        startsAt: activeCycle.startsAt,
        endsAt: activeCycle.endsAt,
        revealAt: activeCycle.revealAt,
        status: activeCycle.status,
      },
      cards: [
        {
          card: getMarketPulseCardPublicPayload(restDb, {
            cycle: activeCycle,
            at: AFTER_LAUNCH,
          }),
          userDecision: {
            id: "dec-rest",
            decision: "ACKNOWLEDGED" as const,
            decidedAt: AFTER_LAUNCH,
          },
        },
        {
          card: getMarketPulseCardPublicPayload(signalDb, {
            cycle: activeCycle,
            at: AFTER_LAUNCH,
          }),
          userDecision: null,
        },
      ],
    };
    mocks.getTodayMarketPulsePlaySessionSnapshot.mockResolvedValue({
      cycle: snapshot.cycle,
      cards: snapshot.cards.map((slot) => ({ ...slot, userDecision: null })),
    });
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(snapshot);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("playable");
    expect(data.card?.id).toBe("card-signal");
    expect(data.card?.cardType).toBe("SIGNAL");
    expect(data.cardProgress).toEqual({ current: 2, total: 2 });
  });

  it("counts acknowledged rest cards toward all-completed state", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const restDb = buildDbCard({
      id: "card-rest",
      cardType: "REST",
      sortOrder: 0,
      headline: "Rest day",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });
    const signalDb = buildDbCard({
      id: "card-signal",
      cardType: "SIGNAL",
      sortOrder: 1,
      headline: "Signal day",
    });
    const snapshot = {
      cycle: {
        id: activeCycle.id,
        name: activeCycle.name,
        startsAt: activeCycle.startsAt,
        endsAt: activeCycle.endsAt,
        revealAt: activeCycle.revealAt,
        status: activeCycle.status,
      },
      cards: [
        {
          card: getMarketPulseCardPublicPayload(restDb, {
            cycle: activeCycle,
            at: AFTER_LAUNCH,
          }),
          userDecision: {
            id: "dec-rest",
            decision: "ACKNOWLEDGED" as const,
            decidedAt: AFTER_LAUNCH,
          },
        },
        {
          card: getMarketPulseCardPublicPayload(signalDb, {
            cycle: activeCycle,
            at: AFTER_LAUNCH,
          }),
          userDecision: {
            id: "dec-signal",
            decision: "CAUTIOUS" as const,
            decidedAt: AFTER_LAUNCH,
          },
        },
      ],
    };
    mocks.getTodayMarketPulsePlaySession.mockResolvedValue(snapshot);

    const data = await getMarketPulsePlayPageData();

    expect(data.status).toBe("locked");
    expect(data.cardsToday).toHaveLength(2);
    expect(data.cardsToday.every((slot) => slot.userDecision)).toBe(true);
    expect(data.lockedDecision).toBe("CAUTIOUS");
  });
});
