import { describe, expect, it } from "vitest";

import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  sanitizeMarketPulseAnalyticsPayload,
} from "@/lib/market-pulse/analytics";

describe("sanitizeMarketPulseAnalyticsPayload", () => {
  it("keeps allowed public fields", () => {
    expect(
      sanitizeMarketPulseAnalyticsPayload({
        cardId: "card-1",
        cycleId: "cycle-1",
        dayIndex: 3,
        decision: "BULLISH",
        tab: "current",
        status: "revealed",
        cta: "profile",
        rank: 2,
        surface: "hub",
        route: "/market-pulse/play",
      }),
    ).toEqual({
      cardId: "card-1",
      cycleId: "cycle-1",
      dayIndex: 3,
      decision: "BULLISH",
      tab: "current",
      status: "revealed",
      cta: "profile",
      rank: 2,
      surface: "hub",
      route: "/market-pulse/play",
    });
  });

  it("drops private and pre-reveal PPA fields", () => {
    expect(
      sanitizeMarketPulseAnalyticsPayload({
        cardId: "card-1",
        email: "user@example.com",
        ppaSignal: "BULLISH",
        ppaInsight: "Hidden insight",
        userEmail: "secret@example.com",
      }),
    ).toEqual({ cardId: "card-1" });
  });

  it("drops unknown keys", () => {
    expect(
      sanitizeMarketPulseAnalyticsPayload({
        playerName: "Alice",
        userId: "user-1",
      }),
    ).toEqual({});
  });
});

describe("MARKET_PULSE_ANALYTICS_EVENTS", () => {
  it("includes required event names", () => {
    expect(Object.values(MARKET_PULSE_ANALYTICS_EVENTS)).toEqual(
      expect.arrayContaining([
        "market_pulse_viewed",
        "hero_cta_clicked",
        "how_it_works_cta_clicked",
        "hub_cta_clicked",
        "card_viewed",
        "decision_selected",
        "decision_confirmation_opened",
        "decision_submitted",
        "decision_locked",
        "leaderboard_viewed",
        "reveal_viewed",
        "profile_cta_clicked",
        "report_downloaded",
        "webinar_cta_clicked",
        "prize_claim_started",
      ]),
    );
  });
});
