import { describe, expect, it } from "vitest";

import {
  buildOnboardingLoginUrl,
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

describe("buildOnboardingLoginUrl", () => {
  it("wraps callback in onboarding path for login return", () => {
    expect(buildOnboardingLoginUrl("/profile")).toBe(
      "/login?callbackUrl=%2Fauth%2Fonboarding%3FcallbackUrl%3D%252Fprofile",
    );
    expect(buildOnboardingLoginUrl("/")).toBe(
      "/login?callbackUrl=%2Fauth%2Fonboarding",
    );
  });
});
