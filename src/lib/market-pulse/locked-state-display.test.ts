import { describe, expect, it } from "vitest";

import { shouldShowLockedCycleProgress } from "@/lib/market-pulse/locked-state-display";

describe("locked-state-display", () => {
  describe("shouldShowLockedCycleProgress", () => {
    it("returns true when day progress is available", () => {
      expect(shouldShowLockedCycleProgress(2, 5)).toBe(true);
    });

    it("returns false when cycle totals are missing", () => {
      expect(shouldShowLockedCycleProgress(0, 0)).toBe(false);
      expect(shouldShowLockedCycleProgress(1, 0)).toBe(false);
    });
  });
});
