import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  canShowGuidedLaunchHubLink,
  evaluateGuidedLaunchEligibility,
  evaluateGuidedLaunchReadiness,
  isGuidedLaunchAlreadyComplete,
} from "@/lib/market-pulse/guided-launch-readiness";

function baseCard(
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
    sourceName: null,
    sourceUrl: null,
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

describe("evaluateGuidedLaunchEligibility", () => {
  it("allows DRAFT and OPEN cycles", () => {
    expect(evaluateGuidedLaunchEligibility({ status: "DRAFT" }).eligible).toBe(true);
    expect(evaluateGuidedLaunchEligibility({ status: "OPEN" }).eligible).toBe(true);
  });

  it("blocks CLOSED and REVEALED cycles", () => {
    const closed = evaluateGuidedLaunchEligibility({ status: "CLOSED" });
    expect(closed.eligible).toBe(false);
    expect(closed.reasons).toContain(
      "Closed cycles cannot be launched from the guided launcher.",
    );

    const revealed = evaluateGuidedLaunchEligibility({ status: "REVEALED" });
    expect(revealed.eligible).toBe(false);
    expect(revealed.reasons).toContain(
      "Revealed cycles cannot be launched from the guided launcher.",
    );
  });

  it("blocks ARCHIVED cycles", () => {
    const archived = evaluateGuidedLaunchEligibility({ status: "ARCHIVED" });
    expect(archived.eligible).toBe(false);
    expect(archived.reasons).toContain("Archived cycles cannot be launched.");
  });
});

describe("evaluateGuidedLaunchReadiness", () => {
  it("reports no cards reason", () => {
    const result = evaluateGuidedLaunchReadiness([]);
    expect(result.ready).toBe(false);
    expect(result.reasons).toContain("There are no cards in this cycle.");
  });

  it("reports signal missing content and missing PPA separately", () => {
    const result = evaluateGuidedLaunchReadiness([
      baseCard({ newsBody: "", summary: "" }),
      baseCard({
        id: "card-2",
        newsBody: "Body",
        summary: "Summary",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(result.ready).toBe(false);
    expect(result.reasons).toContain("Some signal cards are missing content.");
    expect(result.reasons).toContain("Some signal cards still need PPA approval.");
  });

  it("reports rest missing content", () => {
    const result = evaluateGuidedLaunchReadiness([
      baseCard({
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: "Rest",
        newsBody: "",
      }),
    ]);

    expect(result.ready).toBe(false);
    expect(result.reasons).toContain("Some rest cards are missing content.");
  });

  it("is ready when every card is launch-ready", () => {
    const result = evaluateGuidedLaunchReadiness([
      baseCard(),
      baseCard({
        id: "card-rest",
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: "Rest",
        newsBody: "Body",
        summary: "Body",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(result.ready).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("still blocks launch when a published card coexists with an incomplete draft", () => {
    const result = evaluateGuidedLaunchReadiness([
      baseCard({
        id: "published",
        status: "PUBLISHED",
        publishedAt: "2026-08-01T01:00:00.000Z",
      }),
      baseCard({
        id: "missing-draft",
        newsBody: "",
        summary: "",
      }),
    ]);

    expect(result.ready).toBe(false);
    expect(result.reasons).toContain("Some signal cards are missing content.");
    expect(result.summary.publishedCount).toBe(1);
  });
});

describe("isGuidedLaunchAlreadyComplete", () => {
  it("requires OPEN cycle, active pin, runtime OPEN, and all cards published", () => {
    const cards = [
      baseCard({ status: "PUBLISHED", publishedAt: "2026-01-02T00:00:00.000Z" }),
    ];

    expect(
      isGuidedLaunchAlreadyComplete({
        cycleStatus: "OPEN",
        activeCycleId: "cycle-1",
        runtimeStatus: "OPEN",
        cycleId: "cycle-1",
        cards,
      }),
    ).toBe(true);

    expect(
      isGuidedLaunchAlreadyComplete({
        cycleStatus: "DRAFT",
        activeCycleId: "cycle-1",
        runtimeStatus: "OPEN",
        cycleId: "cycle-1",
        cards,
      }),
    ).toBe(false);
  });
});

describe("canShowGuidedLaunchHubLink", () => {
  it("shows only for DRAFT and OPEN", () => {
    expect(canShowGuidedLaunchHubLink("DRAFT")).toBe(true);
    expect(canShowGuidedLaunchHubLink("OPEN")).toBe(true);
    expect(canShowGuidedLaunchHubLink("CLOSED")).toBe(false);
    expect(canShowGuidedLaunchHubLink("REVEALED")).toBe(false);
    expect(canShowGuidedLaunchHubLink("ARCHIVED")).toBe(false);
  });
});
