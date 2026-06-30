import { describe, expect, it } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  evaluateCycleReadiness,
  findDuplicateDayIndexes,
  getCycleReadinessCardStatus,
} from "@/lib/market-pulse/admin-cycle-readiness";

function baseCycle(
  overrides: Partial<MarketPulseAdminCycleRow> = {},
): MarketPulseAdminCycleRow {
  return {
    id: "cycle-1",
    name: "Cycle 01",
    status: "DRAFT",
    startsAt: "2026-03-01T00:00:00.000Z",
    endsAt: "2026-03-10T23:59:59.000Z",
    revealAt: "2026-03-11T12:00:00.000Z",
    prizeLabel: "One Ocean Park ticket",
    isActive: false,
    isPlayableNow: false,
    playabilityIssue: null,
    cardCount: 0,
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
    ...overrides,
  };
}

function baseCard(
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
    headline: "Headline",
    newsBody: "Body copy",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: "What is your read on this signal?",
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

describe("findDuplicateDayIndexes", () => {
  it("detects duplicate day indexes", () => {
    expect(
      findDuplicateDayIndexes([
        { dayIndex: 1 },
        { dayIndex: 2 },
        { dayIndex: 2 },
      ]),
    ).toEqual(new Set([2]));
  });
});

describe("evaluateCycleReadiness", () => {
  it("marks an empty cycle as not ready", () => {
    const report = evaluateCycleReadiness(baseCycle(), []);

    expect(report.overallStatus).toBe("needs_attention");
    expect(report.cycleIssues.some((issue) => issue.code === "cycle_no_cards")).toBe(
      true,
    );
    expect(report.cards).toHaveLength(0);
  });

  it("flags missing card publish fields", () => {
    const report = evaluateCycleReadiness(baseCycle(), [
      baseCard({
        id: "card-1",
        headline: "",
        summary: null,
        userPrompt: null,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(report.overallStatus).toBe("needs_attention");
    expect(report.cardIssues.length).toBeGreaterThan(0);
    expect(report.cards[0]?.status).toBe("draft_missing_fields");
  });

  it("detects duplicate day/order conflicts", () => {
    const report = evaluateCycleReadiness(baseCycle(), [
      baseCard({ id: "card-1", dayIndex: 2 }),
      baseCard({ id: "card-2", dayIndex: 2, headline: "Second card" }),
    ]);

    expect(report.overallStatus).toBe("needs_attention");
    expect(report.cycleIssues.some((issue) => issue.code === "cycle_duplicate_days")).toBe(
      true,
    );
    expect(report.cards.every((row) => row.status === "conflict")).toBe(true);
  });

  it("marks a valid draft cycle ready without published cards", () => {
    const report = evaluateCycleReadiness(baseCycle(), [baseCard()]);

    expect(report.overallStatus).toBe("ready");
    expect(report.issueCount).toBe(0);
    expect(report.cards[0]?.status).toBe("ready");
  });

  it("does not require published status for overall readiness", () => {
    const report = evaluateCycleReadiness(baseCycle({ status: "DRAFT" }), [
      baseCard({ status: "DRAFT" }),
    ]);

    expect(report.overallStatus).toBe("ready");
    expect(report.cards[0]?.status).toBe("ready");
  });

  it("requires PPA fields for published cards according to reveal rules", () => {
    const report = evaluateCycleReadiness(baseCycle({ status: "OPEN" }), [
      baseCard({
        status: "PUBLISHED",
        publishedAt: "2026-03-02T00:00:00.000Z",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(report.overallStatus).toBe("needs_attention");
    expect(
      report.cardIssues.some((issue) =>
        issue.message.includes("PPA signal is required for reveal and scoring."),
      ),
    ).toBe(true);
    expect(report.cards[0]?.status).toBe("published");
  });

  it("does not require PPA on draft cards beyond publish validation rules", () => {
    const report = evaluateCycleReadiness(baseCycle(), [
      baseCard({
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(report.overallStatus).toBe("needs_attention");
    expect(
      report.cardIssues.some((issue) =>
        issue.message.includes("PPA signal is required to publish."),
      ),
    ).toBe(true);
    expect(
      report.cardIssues.some((issue) =>
        issue.message.includes("PPA signal is required for reveal and scoring."),
      ),
    ).toBe(false);
  });

  it("requires prize label for player-facing cycles", () => {
    const report = evaluateCycleReadiness(
      baseCycle({ status: "OPEN", prizeLabel: null }),
      [baseCard()],
    );

    expect(report.cycleIssues.some((issue) => issue.code === "cycle_prize")).toBe(
      true,
    );
  });
});

describe("getCycleReadinessCardStatus", () => {
  it("returns conflict before published status", () => {
    const duplicateDays = new Set([1]);

    expect(
      getCycleReadinessCardStatus(
        baseCard({
          status: "PUBLISHED",
          publishedAt: "2026-03-02T00:00:00.000Z",
        }),
        duplicateDays,
        new Set(),
        false,
      ),
    ).toBe("conflict");
  });
});
