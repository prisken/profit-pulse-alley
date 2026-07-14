import { describe, expect, it } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { MARKET_PULSE_CARD_TYPE_REST } from "@/lib/market-pulse/card-type";
import {
  buildMarketPulsePlayabilityAlerts,
  buildMarketPulseStatusSnapshot,
  getTodayCardStatus,
} from "@/lib/market-pulse/admin-mp-status";

const baseCycle: MarketPulseAdminCycleRow = {
  id: "cycle-1",
  name: "Test Cycle",
  status: "OPEN",
  startsAt: "2026-06-01T00:00:00.000Z",
  endsAt: "2026-06-10T00:00:00.000Z",
  revealAt: "2026-06-11T00:00:00.000Z",
  prizeLabel: "Prize",
  isActive: true,
  isPlayableNow: true,
  playabilityIssue: null,
  cardCount: 1,
  decisionCount: 0,
  scoreCount: 0,
  prizeClaimCount: 0,
  usersPlayed: 0,
  missingSignalCount: 0,
  unlockedCount: 0,
  averageDecisionsPerParticipant: 0,
  completionRatePercent: null,
  scoreEventCount: 0,
  scoresGenerated: false,
  topWinnerName: null,
  topWinnerScore: null,
  guidedProgress: null,
  signalCardCount: 1,
  restCardCount: 0,
};

function buildCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
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
    headline: "News",
    newsBody: null,
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: null,
    userPrompt: null,
    status: "PUBLISHED",
    ppaSignal: "BULLISH",
    ppaInsight: null,
    ppaSignalLockedAt: "2026-05-31T00:00:00.000Z",
    publishedAt: "2026-06-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("buildMarketPulseStatusSnapshot", () => {
  it("marks player visible when runtime and cycle are playable", () => {
    const snapshot = buildMarketPulseStatusSnapshot({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [buildCard()],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(snapshot.playerVisible).toBe(true);
    expect(snapshot.activeCycleName).toBe("Test Cycle");
    expect(snapshot.prizeLabel).toBe("Prize");
  });

  it("explains when runtime is not open", () => {
    const snapshot = buildMarketPulseStatusSnapshot({
      runtimeStatus: "MAINTENANCE",
      activeCycle: baseCycle,
      activeCycleCards: [],
    });

    expect(snapshot.playerVisible).toBe(false);
    expect(snapshot.playerVisibilityReason).toMatch(/MAINTENANCE/);
  });
});

describe("buildMarketPulsePlayabilityAlerts", () => {
  it("reports missing active cycle and runtime issues", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "CLOSED",
      activeCycle: null,
      activeCycleCards: [],
    });

    expect(alerts.map((alert) => alert.id)).toEqual([
      "runtime-not-open",
      "no-active-cycle",
    ]);
  });

  it("reports unpublished cards and PPA setup when reveal is far away", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [
        buildCard({ status: "DRAFT", ppaSignalLockedAt: null }),
        buildCard({
          id: "card-2",
          status: "PUBLISHED",
          ppaInsight: null,
        }),
      ],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "unpublished-cards")).toBe(true);
    expect(alerts.some((alert) => alert.id === "ppa-setup")).toBe(true);
    expect(alerts.some((alert) => alert.id === "ppa-urgent")).toBe(false);
  });

  it("reports urgent PPA alert within 72 hours of reveal", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [buildCard({ ppaSignalLockedAt: null })],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "ppa-urgent")).toBe(true);
    expect(alerts.some((alert) => alert.id === "ppa-setup")).toBe(false);
  });

  it("reports missing today card", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "today-card-issue")).toBe(true);
  });

  it("does not warn about demo seed data for normal production cycles", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [buildCard()],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "demo-cycle-active")).toBe(
      false,
    );
  });

  it("warns when the active cycle is demo-marked", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: {
        ...baseCycle,
        name: "[DEMO] Market Pulse Local Seed",
      },
      activeCycleCards: [buildCard()],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    const demoAlert = alerts.find((alert) => alert.id === "demo-cycle-active");
    expect(demoAlert).toBeDefined();
    expect(demoAlert?.message).toMatch(/\[DEMO\]/i);
  });
});

describe("getTodayCardStatus", () => {
  it("returns playable card for the current day", () => {
    const status = getTodayCardStatus(
      baseCycle,
      [buildCard({ dayIndex: 1 })],
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(status?.tone).toBe("ok");
    expect(status?.companyName).toBe("Acme");
    expect(status?.shellMessage.key).toBe("auth.admin.mp.shell.todaySignalCardLive");
  });

  it("labels a live market rest card without implying missing PPA", () => {
    const status = getTodayCardStatus(
      baseCycle,
      [
        buildCard({
          id: "rest-1",
          cardType: MARKET_PULSE_CARD_TYPE_REST,
          companyName: "",
          ticker: "REST",
          headline: "Market rest day",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(status?.tone).toBe("ok");
    expect(status?.restCount).toBe(1);
    expect(status?.signalCount).toBe(0);
    expect(status?.shellMessage.key).toBe("auth.admin.mp.shell.todayRestCardLive");
  });

  it("labels multiple live cards for today", () => {
    const status = getTodayCardStatus(
      baseCycle,
      [
        buildCard({ id: "signal-1", dayIndex: 1 }),
        buildCard({
          id: "rest-1",
          dayIndex: 1,
          sortOrder: 1,
          cardType: MARKET_PULSE_CARD_TYPE_REST,
          companyName: "",
          ticker: "REST",
          headline: "Market rest day",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(status?.tone).toBe("ok");
    expect(status?.liveCount).toBe(2);
    expect(status?.shellMessage.key).toBe("auth.admin.mp.shell.todayMixedCardsLive");
  });
});

describe("rest card admin alerts", () => {
  const restCard = buildCard({
    id: "rest-1",
    cardType: MARKET_PULSE_CARD_TYPE_REST,
    companyName: "",
    ticker: "REST",
    headline: "Market rest day",
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
  });

  it("does not emit today-card-issue when a rest card is live", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [restCard],
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "today-card-issue")).toBe(false);
  });

  it("ignores rest cards for urgent PPA warnings", () => {
    const alerts = buildMarketPulsePlayabilityAlerts({
      runtimeStatus: "OPEN",
      activeCycle: baseCycle,
      activeCycleCards: [restCard],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.id === "ppa-urgent")).toBe(false);
    expect(alerts.some((alert) => alert.id === "ppa-setup")).toBe(false);
  });
});
