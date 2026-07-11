import { describe, expect, it } from "vitest";

import {
  gateRuntimeClosedPageData,
  shouldGateRuntimeClosed,
} from "@/lib/market-pulse/play-page-state";
import type { MarketPulsePlayPageData } from "@/lib/market-pulse/play-data";

const baseData: MarketPulsePlayPageData = {
  status: "playable",
  isAuthenticated: true,
  challengeName: "Cycle 01",
  prizeLabel: "One Ocean Park ticket",
  dayCurrent: 2,
  dayTotal: 10,
  revealAtIso: "2026-07-10T16:00:00.000Z",
  revealRemainingMs: 1_000,
  revealAtLabel: "July 10, 2026",
  cycleId: "cycle-1",
  leaderboardEntries: [],
  leaderboardRevealed: false,
  cardsToday: [],
  activeCardIndex: 0,
  card: null,
  lockedDecision: null,
  cardProgress: null,
  runtimeOpen: true,
  nextCycle: { status: "tbc" },
};

describe("play-page-state", () => {
  describe("shouldGateRuntimeClosed", () => {
    it("returns false for pre-launch and locked states", () => {
      expect(shouldGateRuntimeClosed("pre_launch", false)).toBe(false);
      expect(shouldGateRuntimeClosed("locked", false)).toBe(false);
    });

    it("returns true for playable when runtime is closed", () => {
      expect(shouldGateRuntimeClosed("playable", false)).toBe(true);
    });

    it("returns false when runtime is open", () => {
      expect(shouldGateRuntimeClosed("playable", true)).toBe(false);
    });
  });

  describe("gateRuntimeClosedPageData", () => {
    it("downgrades playable to runtime_closed and clears card data", () => {
      const result = gateRuntimeClosedPageData(baseData, false);
      expect(result.status).toBe("runtime_closed");
      expect(result.runtimeOpen).toBe(false);
      expect(result.card).toBeNull();
    });

    it("preserves locked state when runtime is closed", () => {
      const locked = {
        ...baseData,
        status: "locked" as const,
        lockedDecision: "BULLISH" as const,
      };
      const result = gateRuntimeClosedPageData(locked, false);
      expect(result.status).toBe("locked");
      expect(result.lockedDecision).toBe("BULLISH");
    });
  });
});
