import { describe, expect, it } from "vitest";

import {
  buildAdminCycleWinnerMap,
  computeAdminCycleCardBreakdown,
  computeAdminCycleParticipationStats,
  formatAdminAverageDecisions,
  formatAdminCompletionRate,
} from "@/lib/market-pulse/admin-cycle-stats";
import { MARKET_PULSE_CARD_TYPE_REST } from "@/lib/market-pulse/card-type";

describe("computeAdminCycleCardBreakdown", () => {
  it("counts signal and rest cards separately and limits PPA gaps to signal cards", () => {
    expect(
      computeAdminCycleCardBreakdown([
        {
          cardType: "SIGNAL",
          ppaSignal: "BULLISH",
          ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          cardType: MARKET_PULSE_CARD_TYPE_REST,
          ppaSignal: null,
          ppaSignalLockedAt: null,
        },
        {
          cardType: "SIGNAL",
          ppaSignal: null,
          ppaSignalLockedAt: null,
        },
      ]),
    ).toEqual({
      totalCards: 3,
      signalCards: 2,
      restCards: 1,
      missingPpaSignalCards: 1,
      unlockedSignalCards: 1,
    });
  });
});

describe("computeAdminCycleParticipationStats", () => {
  it("computes averages and completion per cycle inputs", () => {
    expect(
      computeAdminCycleParticipationStats({
        cardCount: 5,
        participantCount: 4,
        decisionCount: 12,
      }),
    ).toEqual({
      averageDecisionsPerParticipant: 3,
      completionRatePercent: 60,
    });
  });

  it("returns safe empty stats when there are no participants", () => {
    expect(
      computeAdminCycleParticipationStats({
        cardCount: 5,
        participantCount: 0,
        decisionCount: 0,
      }),
    ).toEqual({
      averageDecisionsPerParticipant: 0,
      completionRatePercent: null,
    });
  });

  it("keeps cycle stats independent per cycle inputs", () => {
    const active = computeAdminCycleParticipationStats({
      cardCount: 3,
      participantCount: 10,
      decisionCount: 20,
    });
    const previous = computeAdminCycleParticipationStats({
      cardCount: 5,
      participantCount: 8,
      decisionCount: 30,
    });

    expect(active.averageDecisionsPerParticipant).toBe(2);
    expect(previous.averageDecisionsPerParticipant).toBe(3.75);
    expect(active.completionRatePercent).not.toBe(previous.completionRatePercent);
  });
});

describe("buildAdminCycleWinnerMap", () => {
  it("picks the top scorer per cycle", () => {
    const winners = buildAdminCycleWinnerMap([
      { cycleId: "cycle-a", userId: "u1", totalPoints: 90 },
      { cycleId: "cycle-a", userId: "u2", totalPoints: 120 },
      { cycleId: "cycle-b", userId: "u3", totalPoints: 50 },
      { cycleId: "cycle-b", userId: "u4", totalPoints: 75 },
    ]);

    expect(winners.get("cycle-a")).toEqual({ userId: "u2", score: 120 });
    expect(winners.get("cycle-b")).toEqual({ userId: "u4", score: 75 });
  });
});

describe("formatters", () => {
  it("formats average decisions and completion safely", () => {
    expect(formatAdminAverageDecisions(2.5)).toBe("2.5");
    expect(formatAdminCompletionRate(null)).toBe("—");
    expect(formatAdminCompletionRate(66.7)).toBe("66.7%");
  });
});
