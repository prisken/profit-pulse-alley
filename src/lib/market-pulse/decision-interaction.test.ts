import { describe, expect, it } from "vitest";

import {
  DRAG_BIAS_THRESHOLD,
  resolveDragBias,
  resolveSwipeDecision,
  SWIPE_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD,
} from "@/lib/market-pulse/decision-interaction";

describe("decision-interaction", () => {
  describe("resolveSwipeDecision", () => {
    it("returns BULLISH when offset exceeds threshold", () => {
      expect(resolveSwipeDecision(SWIPE_THRESHOLD + 1, 0)).toBe("BULLISH");
    });

    it("returns BULLISH when velocity exceeds threshold", () => {
      expect(resolveSwipeDecision(0, SWIPE_VELOCITY_THRESHOLD + 1)).toBe(
        "BULLISH",
      );
    });

    it("returns CAUTIOUS when offset is below negative threshold", () => {
      expect(resolveSwipeDecision(-SWIPE_THRESHOLD - 1, 0)).toBe("CAUTIOUS");
    });

    it("returns CAUTIOUS when velocity is below negative threshold", () => {
      expect(resolveSwipeDecision(0, -SWIPE_VELOCITY_THRESHOLD - 1)).toBe(
        "CAUTIOUS",
      );
    });

    it("returns null when swipe is insufficient", () => {
      expect(resolveSwipeDecision(40, 100)).toBeNull();
    });
  });

  describe("resolveDragBias", () => {
    it("returns bullish when dragged right", () => {
      expect(resolveDragBias(DRAG_BIAS_THRESHOLD + 1)).toBe("bullish");
    });

    it("returns cautious when dragged left", () => {
      expect(resolveDragBias(-DRAG_BIAS_THRESHOLD - 1)).toBe("cautious");
    });

    it("returns neutral near center", () => {
      expect(resolveDragBias(0)).toBe("neutral");
    });
  });
});
