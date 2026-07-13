import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { evaluateActiveCycleOperationalWarnings } from "@/lib/market-pulse/admin-operational-warnings";

function buildCycle(
  overrides: Partial<MarketPulseAdminCycleRow> = {},
): MarketPulseAdminCycleRow {
  return {
    id: "cycle-1",
    name: "Cycle 01",
    status: "OPEN",
    startsAt: "2026-07-01T00:00:00.000Z",
    endsAt: "2026-07-10T16:00:00.000Z",
    revealAt: "2026-07-10T16:00:00.000Z",
    prizeLabel: "One Ocean Park ticket",
    isActive: true,
    isPlayableNow: true,
    playabilityIssue: null,
    cardCount: 1,
    decisionCount: 0,
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
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

function buildCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    companyName: "Test Co",
    companyNameZh: null,
    ticker: "TEST",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
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
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-07-01T00:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("evaluateActiveCycleOperationalWarnings", () => {
  it("returns no warnings for a healthy active setup", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      cards: [buildCard()],
    });

    expect(result.warnings).toEqual([]);
  });

  it("warns when runtime is closed", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "CLOSED",
      activeCycle: buildCycle(),
      cards: [buildCard()],
    });

    expect(result.warnings[0]).toContain("runtime is CLOSED");
  });

  it("warns when the active cycle is not playable", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle({
        isPlayableNow: false,
        playabilityIssue: "This challenge is not open for play yet.",
      }),
      cards: [buildCard()],
    });

    expect(result.warnings).toContain("This challenge is not open for play yet.");
  });

  it("does not require July 2026 launch-window dates", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle({
        startsAt: "2026-08-01T00:00:00.000Z",
        endsAt: "2026-08-10T00:00:00.000Z",
        revealAt: "2026-08-10T00:00:00.000Z",
      }),
      cards: [buildCard()],
    });

    expect(result.warnings.some((warning) => warning.includes("July 1"))).toBe(
      false,
    );
    expect(result.warnings.some((warning) => warning.includes("public launch"))).toBe(
      false,
    );
  });

  it("warns about unpublished cards", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      cards: [buildCard({ status: "DRAFT" })],
    });

    expect(result.warnings.some((warning) => warning.includes("PUBLISHED"))).toBe(
      true,
    );
  });
});
