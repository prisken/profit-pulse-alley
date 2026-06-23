import { beforeEach, describe, expect, it, vi } from "vitest";

const { kvGet, kvSet } = vi.hoisted(() => ({
  kvGet: vi.fn(),
  kvSet: vi.fn(),
}));

vi.mock("@vercel/kv", () => ({
  kv: {
    get: kvGet,
    set: kvSet,
  },
}));

import {
  DEFAULT_MARKET_PULSE_SETTINGS,
  getMarketPulseSettings,
  parseMarketPulseSettings,
  resolveMarketPulseSettings,
} from "@/lib/market-pulse/settings";

describe("resolveMarketPulseSettings", () => {
  it("returns defaults when input is missing", () => {
    expect(resolveMarketPulseSettings()).toEqual({
      theme: "Wildcard",
      event: "None",
      status: "open",
      leaderboardMode: "current-cycle",
    });
  });

  it("preserves theme and event when valid", () => {
    expect(
      resolveMarketPulseSettings({
        theme: "FinTech",
        event: "Market Crash",
      }),
    ).toEqual({
      theme: "FinTech",
      event: "Market Crash",
      status: "open",
      leaderboardMode: "current-cycle",
    });
  });

  it("defaults status to open when omitted", () => {
    expect(
      resolveMarketPulseSettings({
        theme: "AI Frenzy",
        event: "Unicorn Day",
      }).status,
    ).toBe("open");
  });

  it("defaults leaderboardMode to current-cycle when omitted", () => {
    expect(
      resolveMarketPulseSettings({
        theme: "Green Tech",
        event: "None",
      }).leaderboardMode,
    ).toBe("current-cycle");
  });

  it("normalizes legacy status and leaderboard values", () => {
    expect(
      resolveMarketPulseSettings({
        theme: "Wildcard",
        event: "None",
        status: "active",
        leaderboardMode: "cycle",
      }),
    ).toMatchObject({
      status: "open",
      leaderboardMode: "current-cycle",
    });
  });
});

describe("parseMarketPulseSettings", () => {
  it("returns null for invalid payloads", () => {
    expect(parseMarketPulseSettings(null)).toBeNull();
    expect(parseMarketPulseSettings({ theme: "FinTech" })).toBeNull();
    expect(
      parseMarketPulseSettings({ theme: "NotATheme", event: "None" }),
    ).toBeNull();
  });

  it("parses theme and event with defaults for optional fields", () => {
    expect(parseMarketPulseSettings({ theme: "FinTech", event: "None" })).toEqual(
      {
        theme: "FinTech",
        event: "None",
        status: "open",
        leaderboardMode: "current-cycle",
      },
    );
  });
});

describe("getMarketPulseSettings", () => {
  beforeEach(() => {
    kvGet.mockReset();
    kvSet.mockReset();
  });

  it("returns defaults when KV data is missing", async () => {
    kvGet.mockResolvedValue(null);

    await expect(getMarketPulseSettings()).resolves.toEqual(
      DEFAULT_MARKET_PULSE_SETTINGS,
    );
  });

  it("merges partial KV data with defaults", async () => {
    kvGet.mockResolvedValue({
      theme: "AI Frenzy",
      event: "Unicorn Day",
    });

    await expect(getMarketPulseSettings()).resolves.toEqual({
      theme: "AI Frenzy",
      event: "Unicorn Day",
      status: "open",
      leaderboardMode: "current-cycle",
    });
  });

  it("falls back to defaults when KV read fails", async () => {
    kvGet.mockRejectedValue(new Error("KV unavailable"));

    await expect(getMarketPulseSettings()).resolves.toEqual(
      DEFAULT_MARKET_PULSE_SETTINGS,
    );
  });
});
