import { describe, expect, it } from "vitest";

import type { MarketPulseHubPageData } from "@/lib/market-pulse/hub-data";
import {
  deriveHubLobbyStatus,
  deriveHubPrimaryCta,
} from "@/lib/market-pulse/hub-lobby-state";

const baseData: Pick<
  MarketPulseHubPageData,
  | "leaderboardRevealed"
  | "runtimeOpen"
  | "hasDatabaseCycle"
  | "revealRemainingMs"
> = {
  leaderboardRevealed: false,
  runtimeOpen: true,
  hasDatabaseCycle: true,
  revealRemainingMs: 60_000,
};

describe("hub-lobby-state", () => {
  it("returns pre_launch when play is blocked", () => {
    expect(deriveHubLobbyStatus(baseData, true)).toBe("pre_launch");
  });

  it("returns revealed when leaderboard is revealed", () => {
    expect(
      deriveHubLobbyStatus(
        { ...baseData, leaderboardRevealed: true },
        false,
      ),
    ).toBe("revealed");
  });

  it("returns reveal_pending after reveal time with no reveal yet", () => {
    expect(
      deriveHubLobbyStatus(
        { ...baseData, revealRemainingMs: 0 },
        false,
      ),
    ).toBe("reveal_pending");
  });

  it("returns closed when runtime is paused", () => {
    expect(
      deriveHubLobbyStatus({ ...baseData, runtimeOpen: false }, false),
    ).toBe("closed");
  });

  it("returns no_active_cycle when runtime is open but no cycle is loaded", () => {
    expect(
      deriveHubLobbyStatus(
        { ...baseData, hasDatabaseCycle: false, runtimeOpen: true },
        false,
      ),
    ).toBe("no_active_cycle");
  });

  it("returns closed when runtime is paused and no cycle is loaded", () => {
    expect(
      deriveHubLobbyStatus(
        { ...baseData, hasDatabaseCycle: false, runtimeOpen: false },
        false,
      ),
    ).toBe("closed");
  });

  it("returns play CTA for open authenticated runtime", () => {
    const cta = deriveHubPrimaryCta("open", {
      isAuthenticated: true,
      runtimeOpen: true,
    });
    expect(cta.kind).toBe("play");
    expect(cta.href).toBe("/market-pulse/play");
  });

  it("returns sign-in CTA for open guests after public launch", () => {
    const cta = deriveHubPrimaryCta("open", {
      isAuthenticated: false,
      runtimeOpen: true,
    });
    expect(cta.kind).toBe("sign_in");
    expect(cta.href).toContain("/login?callbackUrl=");
    expect(cta.disabled).toBe(false);
  });

  it("returns view leaderboard when cycle is revealed", () => {
    const cta = deriveHubPrimaryCta("revealed", {
      isAuthenticated: false,
      runtimeOpen: true,
    });
    expect(cta.kind).toBe("view_leaderboard");
    expect(cta.href).toBe("/market-pulse/leaderboard");
  });

  it("returns view reveal when reveal is pending", () => {
    const cta = deriveHubPrimaryCta("reveal_pending", {
      isAuthenticated: true,
      runtimeOpen: true,
    });
    expect(cta.kind).toBe("view_reveal");
    expect(cta.href).toBe("/market-pulse/reveal");
  });
});
