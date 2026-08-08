import { describe, expect, it } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  evaluateCycleReadiness,
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
    signalCardCount: 0,
    restCardCount: 0,
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
    sortOrder: 0,
    cardType: "SIGNAL",
    companyName: "Acme",
    companyNameZh: null,
    ticker: "ACME",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    headlineZhHant: null,
    newsBody: "Body copy",
    newsBodyZhHant: null,
    sourceName: "Test Source",
    sourceUrl: "https://example.com/news/market-article-1",
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    cardImageAltZhHant: null,
    summary: "Summary",
    summaryZhHant: null,
    userPrompt: "What is your read on this signal?",
    userPromptZhHant: null,
    status: "DRAFT",
    researchNotes: null,
    reviewStatus: "PENDING",
    reviewedAt: null,
    reviewNote: null,
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaInsightZhHant: null,
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    decisionCount: 0,
    ...overrides,
  };
}

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

  it("allows multiple cards on the same cycle day", () => {
    const report = evaluateCycleReadiness(baseCycle(), [
      baseCard({ id: "card-1", dayIndex: 2, sortOrder: 0 }),
      baseCard({ id: "card-2", dayIndex: 2, sortOrder: 1, headline: "Second card" }),
    ]);

    expect(report.cycleIssues.some((issue) => issue.code === "cycle_duplicate_days")).toBe(
      false,
    );
    expect(report.cards).toHaveLength(2);
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

  it("accepts REST cards without PPA when display content is complete", () => {
    const report = evaluateCycleReadiness(baseCycle(), [
      baseCard({
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: "Market rest day",
        newsBody: "No market signal today.",
        summary: null,
        userPrompt: null,
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(report.overallStatus).toBe("ready");
    expect(report.cards[0]?.status).toBe("ready");
    expect(
      report.cardIssues.some((issue) => issue.message.toLowerCase().includes("ppa")),
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
  it("returns conflict when scheduling conflicts exist", () => {
    expect(
      getCycleReadinessCardStatus(
        baseCard({
          status: "PUBLISHED",
          publishedAt: "2026-03-02T00:00:00.000Z",
        }),
        true,
      ),
    ).toBe("conflict");
  });
});
