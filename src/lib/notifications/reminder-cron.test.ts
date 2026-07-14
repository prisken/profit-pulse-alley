import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMarketPulseSettings: vi.fn(),
  getActiveMarketPulseCycle: vi.fn(),
  findPlayableCardsForToday: vi.fn(),
  loadMarketPulseNextCycleStatus: vi.fn(),
  preferenceFindMany: vi.fn(),
  decisionFindMany: vi.fn(),
  sendMarketPulseReminderEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseSettings: mocks.getMarketPulseSettings,
  getActiveMarketPulseCycle: mocks.getActiveMarketPulseCycle,
}));

vi.mock("@/lib/market-pulse/playable-card", () => ({
  findPlayableCardsForToday: mocks.findPlayableCardsForToday,
}));

vi.mock("@/lib/market-pulse/next-cycle", () => ({
  loadMarketPulseNextCycleStatus: mocks.loadMarketPulseNextCycleStatus,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userNotificationPreference: {
      findMany: mocks.preferenceFindMany,
    },
    marketPulseDecision: {
      findMany: mocks.decisionFindMany,
    },
  },
}));

vi.mock("@/lib/notifications/reminder-email", () => ({
  REMINDER_EMAIL_TYPE: "market_pulse_reminder",
  sendMarketPulseReminderEmail: mocks.sendMarketPulseReminderEmail,
}));

import {
  resolveMarketPulseReminderOpportunity,
  runMarketPulseReminderCron,
} from "@/lib/notifications/reminder-cron";

const NOW = new Date("2026-07-05T04:00:00.000Z");

describe("resolveMarketPulseReminderOpportunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns playable card opportunity when runtime is open and cards exist", async () => {
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue({ id: "cycle-1" });
    mocks.findPlayableCardsForToday.mockReturnValue([
      { id: "card-1" },
      { id: "card-2" },
    ]);

    await expect(resolveMarketPulseReminderOpportunity(NOW)).resolves.toEqual({
      kind: "playable_card",
      cycleId: "cycle-1",
      cardIds: ["card-1", "card-2"],
    });
  });

  it("returns next-cycle opportunity within 24 hours when no playable cards", async () => {
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-next",
      name: "Next",
      startsAtIso: new Date(NOW.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      endsAtIso: null,
      revealAtIso: null,
      firstCardReleaseAtIso: null,
    });

    await expect(resolveMarketPulseReminderOpportunity(NOW)).resolves.toEqual({
      kind: "next_cycle",
      cycleId: "cycle-next",
      startsAtIso: expect.any(String),
    });
  });
});

describe("runMarketPulseReminderCron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "OPEN" });
    mocks.getActiveMarketPulseCycle.mockResolvedValue({ id: "cycle-1" });
    mocks.findPlayableCardsForToday.mockReturnValue([{ id: "card-1" }]);
    mocks.sendMarketPulseReminderEmail.mockResolvedValue({ ok: true });
  });

  it("sends only to opted-in candidates and skips already-played users", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
      { userId: "user-opted", user: { email: "a@example.com" } },
      { userId: "user-played", user: { email: "b@example.com" } },
    ]);
    mocks.decisionFindMany.mockResolvedValue([
      { userId: "user-played", cardId: "card-1" },
    ]);

    const summary = await runMarketPulseReminderCron(NOW);

    expect(summary.opportunity).toBe("playable_card");
    expect(summary.candidates).toBe(2);
    expect(summary.attempted).toBe(2);
    expect(summary.sent).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(mocks.sendMarketPulseReminderEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMarketPulseReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-opted",
        cardId: "card-1",
        kind: "playable_card",
      }),
    );
  });

  it("does not query decisions for next-cycle opportunity", async () => {
    mocks.getActiveMarketPulseCycle.mockResolvedValue(null);
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({
      status: "available",
      cycleId: "cycle-next",
      name: "Next",
      startsAtIso: new Date(NOW.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      endsAtIso: null,
      revealAtIso: null,
      firstCardReleaseAtIso: null,
    });
    mocks.preferenceFindMany.mockResolvedValue([
      { userId: "user-1", user: { email: "a@example.com" } },
    ]);

    const summary = await runMarketPulseReminderCron(NOW);

    expect(summary.opportunity).toBe("next_cycle");
    expect(mocks.decisionFindMany).not.toHaveBeenCalled();
    expect(mocks.sendMarketPulseReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "next_cycle",
        cycleId: "cycle-next",
      }),
    );
  });

  it("loads only opted-in, subscribed users with email", async () => {
    mocks.preferenceFindMany.mockResolvedValue([]);
    mocks.decisionFindMany.mockResolvedValue([]);

    await runMarketPulseReminderCron(NOW);

    expect(mocks.preferenceFindMany).toHaveBeenCalledWith({
      where: {
        marketPulseRemindersEnabled: true,
        unsubscribedAt: null,
      },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  });

  it("returns none when there is no opportunity", async () => {
    mocks.getMarketPulseSettings.mockResolvedValue({ runtimeStatus: "CLOSED" });
    mocks.loadMarketPulseNextCycleStatus.mockResolvedValue({ status: "tbc" });

    const summary = await runMarketPulseReminderCron(NOW);

    expect(summary).toEqual({
      opportunity: "none",
      candidates: 0,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    });
    expect(mocks.preferenceFindMany).not.toHaveBeenCalled();
  });
});
