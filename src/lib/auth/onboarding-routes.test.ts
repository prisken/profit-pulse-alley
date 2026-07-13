import { describe, expect, it } from "vitest";

import {
  buildOnboardingLoginUrl,
  requiresOnboardingForPath,
  resolveOnboardingCallbackUrl,
} from "@/lib/auth/onboarding-routes";

describe("resolveOnboardingCallbackUrl", () => {
  it("defaults missing or unsafe values to home", () => {
    expect(resolveOnboardingCallbackUrl(undefined)).toBe("/");
    expect(resolveOnboardingCallbackUrl("")).toBe("/");
    expect(resolveOnboardingCallbackUrl("//evil.com")).toBe("/");
    expect(resolveOnboardingCallbackUrl("https://evil.com")).toBe("/");
  });

  it("allows safe relative paths", () => {
    expect(resolveOnboardingCallbackUrl("/profile")).toBe("/profile");
    expect(resolveOnboardingCallbackUrl("/market-pulse/play")).toBe(
      "/market-pulse/play",
    );
  });

  it("avoids onboarding callback loops", () => {
    expect(resolveOnboardingCallbackUrl("/auth/onboarding")).toBe("/");
    expect(
      resolveOnboardingCallbackUrl("/auth/onboarding?callbackUrl=%2Fprofile"),
    ).toBe("/");
  });
});

describe("requiresOnboardingForPath", () => {
  it("does not force onboarding for any route", () => {
    expect(requiresOnboardingForPath("/market-pulse/play")).toBe(false);
    expect(requiresOnboardingForPath("/market-pulse/play/")).toBe(false);
    expect(requiresOnboardingForPath("/")).toBe(false);
    expect(requiresOnboardingForPath("/market-pulse")).toBe(false);
    expect(requiresOnboardingForPath("/profile")).toBe(false);
    expect(requiresOnboardingForPath("/auth/onboarding")).toBe(false);
  });
});

describe("buildOnboardingLoginUrl", () => {
  it("wraps callback in a direct login return URL", () => {
    expect(buildOnboardingLoginUrl("/profile")).toBe(
      "/login?callbackUrl=%2Fprofile",
    );
    expect(buildOnboardingLoginUrl("/market-pulse/play")).toBe(
      "/login?callbackUrl=%2Fmarket-pulse%2Fplay",
    );
    expect(buildOnboardingLoginUrl("/")).toBe("/login?callbackUrl=%2F");
  });
});
