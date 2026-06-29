import { describe, expect, it } from "vitest";

import {
  CHALLENGE_CYCLE_DAYS,
  CHALLENGE_CYCLE_EPOCH_MS,
  CHALLENGE_CYCLE_MS,
  formatMarketPulseCycleId,
  getChallengeCycleEnd,
  getChallengeCycleStart,
  getCurrentMarketPulseCycle,
} from "@/lib/market-pulse/challenge-cycle";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("challenge-cycle", () => {
  it("returns a stable cycleId for the first cycle at epoch", () => {
    const cycle = getCurrentMarketPulseCycle(CHALLENGE_CYCLE_EPOCH_MS);

    expect(cycle.cycleId).toBe("2026-07-01_2026-07-10");
    expect(cycle.cycleIndex).toBe(0);
  });

  it("returns the same cycleId throughout a cycle window", () => {
    const midCycle = CHALLENGE_CYCLE_EPOCH_MS + 5 * MS_PER_DAY;
    const nearEnd = CHALLENGE_CYCLE_EPOCH_MS + CHALLENGE_CYCLE_MS - 1;

    const mid = getCurrentMarketPulseCycle(midCycle);
    const end = getCurrentMarketPulseCycle(nearEnd);

    expect(mid.cycleId).toBe("2026-07-01_2026-07-10");
    expect(end.cycleId).toBe("2026-07-01_2026-07-10");
    expect(mid.cycleIndex).toBe(end.cycleIndex);
  });

  it("uses 10-day cycle windows", () => {
    expect(CHALLENGE_CYCLE_DAYS).toBe(10);
    expect(CHALLENGE_CYCLE_MS).toBe(10 * MS_PER_DAY);

    const now = CHALLENGE_CYCLE_EPOCH_MS + 3 * MS_PER_DAY;
    const startAt = getChallengeCycleStart(now);
    const endAt = getChallengeCycleEnd(now);

    expect(endAt.getTime() - startAt.getTime()).toBe(CHALLENGE_CYCLE_MS);
  });

  it("advances to the next cycle at the HKT boundary", () => {
    const lastMsOfCycle = CHALLENGE_CYCLE_EPOCH_MS + CHALLENGE_CYCLE_MS - 1;
    const firstMsOfNextCycle = CHALLENGE_CYCLE_EPOCH_MS + CHALLENGE_CYCLE_MS;

    const current = getCurrentMarketPulseCycle(lastMsOfCycle);
    const next = getCurrentMarketPulseCycle(firstMsOfNextCycle);

    expect(current.cycleId).toBe("2026-07-01_2026-07-10");
    expect(next.cycleId).toBe("2026-07-11_2026-07-20");
    expect(next.cycleIndex).toBe(current.cycleIndex + 1);
  });

  it("formats cycleId from inclusive HKT start and end dates", () => {
    const startAt = new Date(CHALLENGE_CYCLE_EPOCH_MS);
    const endAt = new Date(CHALLENGE_CYCLE_EPOCH_MS + CHALLENGE_CYCLE_MS);

    expect(formatMarketPulseCycleId(startAt, endAt)).toBe("2026-07-01_2026-07-10");
  });

  it("clamps pre-epoch times to the first cycle", () => {
    const beforeEpoch = CHALLENGE_CYCLE_EPOCH_MS - MS_PER_DAY;
    const cycle = getCurrentMarketPulseCycle(beforeEpoch);

    expect(cycle.cycleIndex).toBe(0);
    expect(cycle.cycleId).toBe("2026-07-01_2026-07-10");
    expect(cycle.remainingMs).toBeGreaterThan(0);
  });
});
