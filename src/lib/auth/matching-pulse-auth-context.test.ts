import { describe, expect, it } from "vitest";

import { isMatchingPulseAuthCallback } from "@/lib/auth/matching-pulse-auth-context";
import { isMarketPulseAuthCallback } from "@/lib/auth/market-pulse-auth-context";

describe("isMatchingPulseAuthCallback", () => {
  it("returns false for empty or non-Matching Pulse paths", () => {
    expect(isMatchingPulseAuthCallback(undefined)).toBe(false);
    expect(isMatchingPulseAuthCallback(null)).toBe(false);
    expect(isMatchingPulseAuthCallback("/")).toBe(false);
    expect(isMatchingPulseAuthCallback("/profile")).toBe(false);
    expect(isMatchingPulseAuthCallback("/market-pulse/play")).toBe(false);
  });

  it("detects Matching Pulse callback paths", () => {
    expect(isMatchingPulseAuthCallback("/matching-pulse")).toBe(true);
    expect(isMatchingPulseAuthCallback("/matching-pulse/request")).toBe(true);
    expect(isMatchingPulseAuthCallback("/matching-pulse/my-requests")).toBe(
      true,
    );
  });

  it("detects encoded nested callback URLs", () => {
    expect(
      isMatchingPulseAuthCallback(
        "/auth/onboarding?callbackUrl=%2Fmatching-pulse%2Frequest",
      ),
    ).toBe(true);
  });

  it("does not collide with Market Pulse detection", () => {
    expect(isMarketPulseAuthCallback("/matching-pulse/request")).toBe(false);
    expect(isMatchingPulseAuthCallback("/market-pulse/play")).toBe(false);
  });
});
