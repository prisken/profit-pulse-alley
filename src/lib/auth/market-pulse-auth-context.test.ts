import { describe, expect, it } from "vitest";

import { isMarketPulseAuthCallback } from "@/lib/auth/market-pulse-auth-context";

describe("isMarketPulseAuthCallback", () => {
  it("returns false for empty or non-Market Pulse paths", () => {
    expect(isMarketPulseAuthCallback(undefined)).toBe(false);
    expect(isMarketPulseAuthCallback(null)).toBe(false);
    expect(isMarketPulseAuthCallback("/")).toBe(false);
    expect(isMarketPulseAuthCallback("/profile")).toBe(false);
  });

  it("detects direct Market Pulse callback paths", () => {
    expect(isMarketPulseAuthCallback("/market-pulse/play")).toBe(true);
    expect(isMarketPulseAuthCallback("/market-pulse/leaderboard")).toBe(true);
    expect(isMarketPulseAuthCallback("/market-pulse/reveal")).toBe(true);
  });

  it("detects nested onboarding callback URLs", () => {
    expect(
      isMarketPulseAuthCallback(
        "/auth/onboarding?callbackUrl=%2Fmarket-pulse%2Fplay",
      ),
    ).toBe(true);
  });
});
