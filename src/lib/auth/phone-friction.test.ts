import { describe, expect, it } from "vitest";

import { resolveJwtUserState } from "@/lib/auth/invalid-session";
import {
  buildOnboardingLoginUrl,
  requiresOnboardingForPath,
  resolveOnboardingCallbackUrl,
} from "@/lib/auth/onboarding-routes";

describe("phone friction — JWT onboarding gate", () => {
  it("does not require onboarding when contact number is missing", () => {
    expect(resolveJwtUserState({ id: "user-1" })).toEqual({
      sessionInvalid: false,
      needsOnboarding: false,
    });

    expect(resolveJwtUserState({ id: "user-2" })).toEqual({
      sessionInvalid: false,
      needsOnboarding: false,
    });
  });

  it("still invalidates sessions for deleted users", () => {
    expect(resolveJwtUserState(null)).toEqual({
      sessionInvalid: true,
      needsOnboarding: false,
    });
  });
});

describe("phone friction — route gates", () => {
  it("never forces onboarding for Market Pulse play or other paths", () => {
    expect(requiresOnboardingForPath("/market-pulse/play")).toBe(false);
    expect(requiresOnboardingForPath("/market-pulse/play/")).toBe(false);
    expect(requiresOnboardingForPath("/profile")).toBe(false);
    expect(requiresOnboardingForPath("/market-pulse")).toBe(false);
  });

  it("sends login callbacks directly to the destination, not onboarding", () => {
    expect(buildOnboardingLoginUrl("/market-pulse/play")).toBe(
      "/login?callbackUrl=%2Fmarket-pulse%2Fplay",
    );
    expect(buildOnboardingLoginUrl("/profile")).toBe(
      "/login?callbackUrl=%2Fprofile",
    );
  });

  it("keeps onboarding callback resolution loop-safe", () => {
    expect(resolveOnboardingCallbackUrl("/auth/onboarding")).toBe("/");
    expect(resolveOnboardingCallbackUrl("/market-pulse/play")).toBe(
      "/market-pulse/play",
    );
  });
});
