import { describe, expect, it } from "vitest";

import {
  MARKET_PULSE_FIRST_CYCLE_END_AT_MS,
  MARKET_PULSE_LAUNCH_MESSAGES,
  MARKET_PULSE_PUBLIC_LAUNCH_AT_MS,
  canAccessMarketPulsePlay,
  canSubmitMarketPulseDecision,
  isBeforePublicLaunch,
  shouldShowMarketPulsePreLaunchUi,
} from "@/lib/market-pulse/launch-config";

describe("launch-config", () => {
  it("uses 1 July 2026 00:00 HKT as the public launch instant", () => {
    expect(MARKET_PULSE_PUBLIC_LAUNCH_AT_MS).toBe(
      Date.UTC(2026, 5, 30, 16, 0, 0, 0),
    );
  });

  it("ends the first cycle at 11 July 2026 00:00 HKT", () => {
    expect(MARKET_PULSE_FIRST_CYCLE_END_AT_MS).toBe(
      Date.UTC(2026, 6, 10, 16, 0, 0, 0),
    );
  });

  it("treats instants before launch as pre-launch", () => {
    expect(isBeforePublicLaunch(new Date("2026-06-30T15:59:59.999Z"))).toBe(
      true,
    );
    expect(isBeforePublicLaunch(new Date("2026-06-30T16:00:00.000Z"))).toBe(
      false,
    );
  });

  it("blocks guests and USER members before launch", () => {
    const beforeLaunch = new Date("2026-01-03T12:00:00.000Z");
    expect(canAccessMarketPulsePlay(undefined, beforeLaunch)).toBe(false);
    expect(canAccessMarketPulsePlay("USER", beforeLaunch)).toBe(false);
    expect(canSubmitMarketPulseDecision("USER", beforeLaunch)).toBe(false);
  });

  it("allows ADMIN before launch for testing", () => {
    const beforeLaunch = new Date("2026-01-03T12:00:00.000Z");
    expect(canAccessMarketPulsePlay("ADMIN", beforeLaunch)).toBe(true);
    expect(canSubmitMarketPulseDecision("ADMIN", beforeLaunch)).toBe(true);
  });

  it("allows all roles on or after launch", () => {
    const afterLaunch = new Date("2026-07-02T00:00:00.000Z");
    expect(canAccessMarketPulsePlay(undefined, afterLaunch)).toBe(true);
    expect(canAccessMarketPulsePlay("USER", afterLaunch)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", afterLaunch)).toBe(true);
  });

  it("hides pre-launch UI after public launch", () => {
    expect(
      shouldShowMarketPulsePreLaunchUi(new Date("2026-06-30T15:59:59.999Z")),
    ).toBe(true);
    expect(
      shouldShowMarketPulsePreLaunchUi(new Date("2026-06-30T16:00:00.000Z")),
    ).toBe(false);
  });

  it("exposes bilingual launch copy for future locale switching", () => {
    expect(MARKET_PULSE_LAUNCH_MESSAGES.en.opens).toContain("July 1, 2026");
    expect(MARKET_PULSE_LAUNCH_MESSAGES["zh-HK"].opens).toContain("2026年7月1日");
    expect(MARKET_PULSE_LAUNCH_MESSAGES.en.prize).toContain("One Ocean Park ticket");
    expect(MARKET_PULSE_LAUNCH_MESSAGES["zh-HK"].prize).toContain("海洋公園");
  });
});
