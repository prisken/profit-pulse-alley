import { describe, expect, it } from "vitest";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  evaluateRevealReadiness,
  formatRevealBlockMessage,
  getUnlockedPublishedCards,
} from "@/lib/market-pulse/admin-reveal-status";

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
  decisionCount: 5,
  usersPlayed: 3,
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
    decisionCount: 2,
    ...overrides,
  };
}

describe("evaluateRevealReadiness", () => {
  it("blocks when no cycle is selected", () => {
    const result = evaluateRevealReadiness(null, []);
    expect(result.canReveal).toBe(false);
    expect(result.blockReason).toBe("no_cycle");
  });

  it("blocks when cycle is already revealed", () => {
    const result = evaluateRevealReadiness(
      { ...baseCycle, status: "REVEALED" },
      [],
    );
    expect(result.canReveal).toBe(false);
    expect(result.alreadyRevealed).toBe(true);
  });

  it("blocks when published cards lack complete locked PPA", () => {
    const result = evaluateRevealReadiness(baseCycle, [
      buildCard({ ppaSignalLockedAt: null }),
    ]);
    expect(result.canReveal).toBe(false);
    expect(result.blockReason).toBe("incomplete_ppa");
    expect(result.blockMessage).toMatch(/Cannot reveal yet/i);
    expect(result.missingPpaCards).toHaveLength(1);
  });

  it("blocks when published card is missing ppaSignal", () => {
    const result = evaluateRevealReadiness(baseCycle, [
      buildCard({ ppaSignal: null }),
    ]);
    expect(result.canReveal).toBe(false);
    expect(result.blockReason).toBe("incomplete_ppa");
    expect(result.missingPpaCards[0]?.missing).toContain("ppaSignal");
  });

  it("allows reveal when ready and notes scheduled reveal", () => {
    const result = evaluateRevealReadiness(
      baseCycle,
      [buildCard()],
      new Date("2026-06-01T00:00:00.000Z"),
    );
    expect(result.canReveal).toBe(true);
    expect(result.scheduledRevealNote).toMatch(/not available until/i);
  });
});

describe("getUnlockedPublishedCards", () => {
  it("returns only published cards without locked PPA", () => {
    const cards = [
      buildCard({ id: "a", status: "PUBLISHED", ppaSignalLockedAt: null }),
      buildCard({ id: "b", status: "DRAFT", ppaSignalLockedAt: null }),
      buildCard({ id: "c", status: "PUBLISHED" }),
    ];
    expect(getUnlockedPublishedCards("cycle-1", cards)).toHaveLength(1);
    expect(getUnlockedPublishedCards("cycle-1", cards)[0]?.id).toBe("a");
  });
});

describe("formatRevealBlockMessage", () => {
  it("formats scheduled reveal message", () => {
    expect(
      formatRevealBlockMessage("reveal_scheduled", {
        revealAtLabel: "Jun 11, 2026",
      }),
    ).toMatch(/Jun 11, 2026/);
  });
});
