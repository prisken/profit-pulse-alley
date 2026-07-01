import { describe, expect, it } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { PPA_REVEAL_WARNING_HOURS } from "@/lib/market-pulse/constants";
import {
  evaluatePpaRevealWarning,
  getHoursUntilReveal,
  getMissingPpaForCycle,
  isRevealWithinPpaWarningWindow,
} from "@/lib/market-pulse/admin-ppa-reveal-warning";

const CYCLE_ID = "cycle-1";
const REVEAL_AT = "2026-07-11T00:00:00.000Z";

const baseCycle: MarketPulseAdminCycleRow = {
  id: CYCLE_ID,
  name: "Test Cycle",
  status: "OPEN",
  startsAt: "2026-06-01T00:00:00.000Z",
  endsAt: "2026-06-10T00:00:00.000Z",
  revealAt: REVEAL_AT,
  prizeLabel: "Prize",
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
};

function buildCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    id: "card-1",
    cycleId: CYCLE_ID,
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
    newsBody: null,
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: null,
    status: "PUBLISHED",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-06-01T00:00:00.000Z",
    publishedAt: "2026-06-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("isRevealWithinPpaWarningWindow", () => {
  it("is true within 72 hours before reveal", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    expect(isRevealWithinPpaWarningWindow(REVEAL_AT, now)).toBe(true);
    expect(getHoursUntilReveal(REVEAL_AT, now)).toBe(12);
  });

  it("is false more than 72 hours before reveal", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(isRevealWithinPpaWarningWindow(REVEAL_AT, now)).toBe(false);
  });

  it("is true when reveal time has passed", () => {
    const now = new Date("2026-07-12T00:00:00.000Z");
    expect(isRevealWithinPpaWarningWindow(REVEAL_AT, now)).toBe(true);
  });
});

describe("getMissingPpaForCycle", () => {
  it("lists missing fields per published card", () => {
    const missing = getMissingPpaForCycle(CYCLE_ID, [
      buildCard(),
      buildCard({
        id: "card-2",
        dayIndex: 2,
        ticker: "BETA",
        ppaSignal: null,
        ppaInsight: "",
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(missing).toHaveLength(1);
    expect(missing[0]?.ticker).toBe("BETA");
    expect(missing[0]?.missing).toEqual(
      expect.arrayContaining(["ppaSignal", "ppaInsight", "ppaLocked"]),
    );
  });
});

describe("evaluatePpaRevealWarning", () => {
  const withinWindow = new Date("2026-07-10T12:00:00.000Z");
  const outsideWindow = new Date("2026-06-01T00:00:00.000Z");

  it("returns urgent when PPA is missing within 72 hours", () => {
    const result = evaluatePpaRevealWarning({
      activeCycle: baseCycle,
      cards: [buildCard({ ppaSignalLockedAt: null })],
      now: withinWindow,
    });

    expect(result.severity).toBe("urgent");
    expect(result.missingCards).toHaveLength(1);
    expect(result.missingCards[0]?.missing).toContain("ppaLocked");
  });

  it("returns setup when PPA is missing but reveal is more than 72 hours away", () => {
    const result = evaluatePpaRevealWarning({
      activeCycle: baseCycle,
      cards: [buildCard({ ppaInsight: null })],
      now: outsideWindow,
    });

    expect(result.severity).toBe("setup");
    expect(result.missingCards[0]?.missing).toContain("ppaInsight");
  });

  it("returns complete when all published cards have locked PPA", () => {
    const result = evaluatePpaRevealWarning({
      activeCycle: baseCycle,
      cards: [buildCard()],
      now: withinWindow,
    });

    expect(result.severity).toBe("complete");
    expect(result.missingCards).toHaveLength(0);
  });

  it("returns none when cycle is already revealed", () => {
    const result = evaluatePpaRevealWarning({
      activeCycle: { ...baseCycle, status: "REVEALED" },
      cards: [buildCard({ ppaSignalLockedAt: null })],
      now: withinWindow,
    });

    expect(result.severity).toBe("none");
  });

  it("uses PPA_REVEAL_WARNING_HOURS constant", () => {
    expect(PPA_REVEAL_WARNING_HOURS).toBe(72);
    const justOutside = new Date("2026-07-07T00:00:00.000Z");
    expect(getHoursUntilReveal(REVEAL_AT, justOutside)).toBeGreaterThan(72);
    expect(
      evaluatePpaRevealWarning({
        activeCycle: baseCycle,
        cards: [buildCard({ ppaSignal: null })],
        now: justOutside,
      }).severity,
    ).toBe("setup");
  });
});
