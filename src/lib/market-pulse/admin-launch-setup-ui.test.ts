import { describe, expect, it } from "vitest";

import { getMarketPulseAdminNavSections } from "@/lib/market-pulse/admin-mp-navigation";
import { evaluateActiveCycleOperationalWarnings } from "@/lib/market-pulse/admin-operational-warnings";
import { evaluatePpaRevealWarning } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import { buildMarketPulsePlayabilityAlerts } from "@/lib/market-pulse/admin-mp-status";
import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";
import { shouldShowMarketPulseLaunchSetupUi } from "@/lib/market-pulse/launch-config";

const afterLaunch = new Date("2026-07-02T00:00:00.000Z");
const beforeLaunch = new Date("2026-06-30T12:00:00.000Z");

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
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
    publishedAt: "2026-07-01T00:00:00.000Z",
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

describe("Market Pulse admin production launch UI", () => {
  it("hides launch setup guidance after public launch", () => {
    expect(shouldShowMarketPulseLaunchSetupUi(afterLaunch)).toBe(false);

    const sections = getMarketPulseAdminNavSections(afterLaunch);
    expect(sections.some((section) => section.id === "setup")).toBe(false);
  });

  it("shows launch setup guidance before public launch", () => {
    expect(shouldShowMarketPulseLaunchSetupUi(beforeLaunch)).toBe(true);

    const sections = getMarketPulseAdminNavSections(beforeLaunch);
    expect(sections.some((section) => section.id === "setup")).toBe(true);
  });

  it("keeps operational playability warnings after launch", () => {
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

  it("uses post-launch operational warnings without launch-window copy", () => {
    const result = evaluateActiveCycleOperationalWarnings({
      runtimeStatus: "CLOSED",
      activeCycle: buildCycle(),
      cards: [buildCard()],
    });

    expect(result.warnings[0]).toContain("runtime is CLOSED");
    expect(result.warnings.some((warning) => warning.includes("July 1"))).toBe(
      false,
    );
    expect(
      result.warnings.some((warning) => warning.includes("public launch")),
    ).toBe(false);
    expect(
      result.warnings.some((warning) => warning.includes("ADMIN")),
    ).toBe(false);
  });

  it("still surfaces PPA 72-hour urgent warnings when applicable", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    const warning = evaluatePpaRevealWarning({
      activeCycle: buildCycle({
        revealAt: "2026-07-10T16:00:00.000Z",
      }),
      cards: [buildCard({ ppaSignal: null, ppaInsight: null })],
      now,
    });

    expect(warning.severity).toBe("urgent");
    expect(warning.missingCards).toHaveLength(1);
  });

  it("keeps builder route stable for operations", () => {
    expect(marketPulseCycleBuilderPath("cycle-abc")).toBe(
      "/admin/market-pulse/cycles/cycle-abc/builder",
    );
  });
});
