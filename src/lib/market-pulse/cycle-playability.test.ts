import { describe, expect, it } from "vitest";

import {
  describeCyclePlayabilityIssue,
  getCyclePlayabilityIssue,
  isCyclePlayable,
} from "@/lib/market-pulse/cycle-playability";

describe("cycle playability", () => {
  const cycle = {
    status: "OPEN" as const,
    startsAt: new Date("2025-06-24T09:00:00.000Z"),
    revealAt: new Date("2025-07-05T14:00:00.000Z"),
  };

  it("is playable during the challenge window", () => {
    expect(
      isCyclePlayable(cycle, new Date("2025-06-25T12:00:00.000Z")),
    ).toBe(true);
  });

  it("is not playable after revealAt", () => {
    const issue = getCyclePlayabilityIssue(
      cycle,
      new Date("2026-06-24T12:00:00.000Z"),
    );
    expect(issue).toBe("reveal_passed");
    expect(describeCyclePlayabilityIssue(issue!)).toMatch(/reveal date has passed/i);
  });
});
