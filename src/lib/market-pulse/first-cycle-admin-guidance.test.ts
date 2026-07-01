import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  FIRST_PUBLIC_CYCLE_NAME,
  evaluateFirstPublicCycleSetup,
  getFirstPublicCycleFormPrefill,
} from "@/lib/market-pulse/first-cycle-admin-guidance";
import { parseCycleDate } from "@/lib/market-pulse/cycle-validation";
import {
  MARKET_PULSE_FIRST_CYCLE_END_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
} from "@/lib/market-pulse/launch-config";

function buildCycle(
  overrides: Partial<MarketPulseAdminCycleRow> = {},
): MarketPulseAdminCycleRow {
  return {
    id: "cycle-1",
    name: FIRST_PUBLIC_CYCLE_NAME,
    status: "OPEN",
    startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT.toISOString(),
    endsAt: MARKET_PULSE_FIRST_CYCLE_END_AT.toISOString(),
    revealAt: MARKET_PULSE_FIRST_CYCLE_END_AT.toISOString(),
    prizeLabel: "1 Ocean Park ticket",
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
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("getFirstPublicCycleFormPrefill", () => {
  it("matches July 1–10 2026 HKT launch window", () => {
    const prefill = getFirstPublicCycleFormPrefill();

    expect(prefill.name).toBe(FIRST_PUBLIC_CYCLE_NAME);
    expect(prefill.status).toBe("OPEN");
    expect(prefill.setActive).toBe(true);
    expect(prefill.prizeLabel).toContain("Ocean Park");
    expect(parseCycleDate(prefill.startsAt)?.toISOString()).toBe(
      MARKET_PULSE_PUBLIC_LAUNCH_AT.toISOString(),
    );
    expect(parseCycleDate(prefill.endsAt)?.toISOString()).toBe(
      MARKET_PULSE_FIRST_CYCLE_END_AT.toISOString(),
    );
    expect(parseCycleDate(prefill.revealAt)?.getTime()).toBeGreaterThanOrEqual(
      parseCycleDate(prefill.endsAt)!.getTime(),
    );
  });
});

describe("evaluateFirstPublicCycleSetup", () => {
  it("returns no warnings when active cycle matches launch guidance", () => {
    const result = evaluateFirstPublicCycleSetup({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      cards: [buildCard()],
    });

    expect(result.warnings).toEqual([]);
  });

  it("warns when runtime is not OPEN", () => {
    const result = evaluateFirstPublicCycleSetup({
      runtimeStatus: "CLOSED",
      activeCycle: buildCycle(),
      cards: [buildCard()],
    });

    expect(result.warnings.some((warning) => warning.includes("runtime"))).toBe(
      true,
    );
  });

  it("warns when active cycle dates differ from the launch window", () => {
    const result = evaluateFirstPublicCycleSetup({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle({
        startsAt: "2026-08-01T00:00:00.000Z",
        endsAt: "2026-08-10T00:00:00.000Z",
      }),
      cards: [buildCard()],
    });

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns about unpublished cards", () => {
    const result = evaluateFirstPublicCycleSetup({
      runtimeStatus: "OPEN",
      activeCycle: buildCycle(),
      cards: [
        buildCard({ status: "DRAFT", ppaSignalLockedAt: null }),
        buildCard({ id: "card-2", dayIndex: 2, status: "PUBLISHED", ppaSignalLockedAt: null }),
      ],
    });

    expect(result.warnings.some((warning) => warning.includes("PUBLISHED"))).toBe(
      true,
    );
    expect(result.warnings.some((warning) => warning.includes("locked PPA"))).toBe(
      false,
    );
  });
});
