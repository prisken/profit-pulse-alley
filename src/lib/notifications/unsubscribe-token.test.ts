import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createUnsubscribeToken,
  hashEmailForUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/notifications/unsubscribe-token";

const SECRET = "test-unsubscribe-secret";
const NOW = new Date("2026-07-14T12:00:00.000Z");

describe("unsubscribe-token", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EMAIL_UNSUBSCRIBE_SECRET: SECRET,
      AUTH_SECRET: "unused-auth-secret",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a valid token without embedding the raw email", () => {
    const token = createUnsubscribeToken({
      userId: "user-1",
      email: "Player@Example.com",
      now: NOW,
    });

    expect(token).not.toContain("Player@Example.com");
    expect(token).not.toContain("player@example.com");
    expect(token.split(".")).toHaveLength(2);

    const verified = verifyUnsubscribeToken(token, process.env, NOW);
    expect(verified).toEqual({
      ok: true,
      userId: "user-1",
      emailHash: hashEmailForUnsubscribeToken("player@example.com"),
      expiresAt: expect.any(Date),
    });
  });

  it("rejects an invalid signature", () => {
    const token = createUnsubscribeToken({
      userId: "user-1",
      email: "player@example.com",
      now: NOW,
    });
    const [body] = token.split(".");
    const forged = `${body}.not-a-real-signature`;

    expect(verifyUnsubscribeToken(forged, process.env, NOW)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects an expired token", () => {
    const token = createUnsubscribeToken({
      userId: "user-1",
      email: "player@example.com",
      now: NOW,
      ttlMs: 60_000,
    });

    const later = new Date(NOW.getTime() + 120_000);
    expect(verifyUnsubscribeToken(token, process.env, later)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects malformed tokens", () => {
    expect(verifyUnsubscribeToken("", process.env, NOW).ok).toBe(false);
    expect(verifyUnsubscribeToken("abc", process.env, NOW)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("falls back to AUTH_SECRET when EMAIL_UNSUBSCRIBE_SECRET is unset", () => {
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET;
    process.env.AUTH_SECRET = "auth-only-secret";

    const token = createUnsubscribeToken({
      userId: "user-2",
      email: "a@b.com",
      now: NOW,
    });

    expect(verifyUnsubscribeToken(token, process.env, NOW).ok).toBe(true);
  });
});
