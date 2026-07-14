import { describe, expect, it } from "vitest";

import {
  CYCLE_REMOVAL_MESSAGES,
  canRemoveMarketPulseCycle,
  cycleRemovalBlockMessage,
  getCycleRemovalBlockReason,
  hasMarketPulseCyclePlayerData,
} from "@/lib/market-pulse/cycle-removal";

const clean = {
  status: "DRAFT" as const,
  isActive: false,
  decisionCount: 0,
  scoreCount: 0,
  scoreEventCount: 0,
  prizeClaimCount: 0,
};

describe("cycle-removal eligibility", () => {
  it("allows DRAFT/OPEN/CLOSED cycles with no player data and no active pin", () => {
    expect(canRemoveMarketPulseCycle(clean)).toBe(true);
    expect(canRemoveMarketPulseCycle({ ...clean, status: "OPEN" })).toBe(true);
    expect(canRemoveMarketPulseCycle({ ...clean, status: "CLOSED" })).toBe(true);
    expect(getCycleRemovalBlockReason(clean)).toBeNull();
  });

  it("blocks the active pinned cycle first", () => {
    expect(
      getCycleRemovalBlockReason({
        ...clean,
        isActive: true,
        status: "REVEALED",
        decisionCount: 1,
      }),
    ).toBe("active");
    expect(
      cycleRemovalBlockMessage("active"),
    ).toBe(CYCLE_REMOVAL_MESSAGES.blockedActive);
  });

  it("blocks REVEALED and ARCHIVED cycles", () => {
    expect(
      getCycleRemovalBlockReason({ ...clean, status: "REVEALED" }),
    ).toBe("status");
    expect(
      getCycleRemovalBlockReason({ ...clean, status: "ARCHIVED" }),
    ).toBe("status");
    expect(cycleRemovalBlockMessage("status")).toBe(
      CYCLE_REMOVAL_MESSAGES.blockedStatus,
    );
  });

  it("blocks cycles with decisions, scores, score events, or prize claims", () => {
    expect(
      getCycleRemovalBlockReason({ ...clean, decisionCount: 1 }),
    ).toBe("player_data");
    expect(getCycleRemovalBlockReason({ ...clean, scoreCount: 1 })).toBe(
      "player_data",
    );
    expect(
      getCycleRemovalBlockReason({ ...clean, scoreEventCount: 2 }),
    ).toBe("player_data");
    expect(
      getCycleRemovalBlockReason({ ...clean, prizeClaimCount: 1 }),
    ).toBe("player_data");
    expect(hasMarketPulseCyclePlayerData({ ...clean, decisionCount: 1 })).toBe(
      true,
    );
    expect(cycleRemovalBlockMessage("player_data")).toBe(
      CYCLE_REMOVAL_MESSAGES.blockedData,
    );
  });
});
