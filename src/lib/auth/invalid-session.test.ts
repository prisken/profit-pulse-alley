import { describe, expect, it } from "vitest";

import {
  buildInvalidSessionSignOutRedirect,
  isRemovedAccountLoginReason,
  resolveJwtUserState,
} from "@/lib/auth/invalid-session";

describe("resolveJwtUserState", () => {
  it("marks deleted or missing users as invalid instead of onboarding", () => {
    expect(resolveJwtUserState(null)).toEqual({
      sessionInvalid: true,
      needsOnboarding: false,
    });
  });

  it("does not require onboarding when contact number is missing", () => {
    expect(resolveJwtUserState({ id: "user-1" })).toEqual({
      sessionInvalid: false,
      needsOnboarding: false,
    });
  });

  it("does not require onboarding when contact number exists", () => {
    expect(resolveJwtUserState({ id: "user-2" })).toEqual({
      sessionInvalid: false,
      needsOnboarding: false,
    });
  });
});

describe("invalid session redirects", () => {
  it("builds a sign-out URL that returns to login with reason", () => {
    expect(buildInvalidSessionSignOutRedirect()).toBe(
      "/api/auth/signout?callbackUrl=%2Flogin%3Freason%3Daccount_removed",
    );
  });

  it("detects the removed-account login reason", () => {
    expect(isRemovedAccountLoginReason("account_removed")).toBe(true);
    expect(isRemovedAccountLoginReason("other")).toBe(false);
    expect(isRemovedAccountLoginReason(null)).toBe(false);
  });
});
