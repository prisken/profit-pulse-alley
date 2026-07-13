import { describe, expect, it } from "vitest";

import {
  marketPulseEnMessages,
  marketPulseZhHantMessages,
} from "@/lib/i18n/messages/market-pulse-messages";
import {
  applyPlayBlockedStateCopy,
  formatPlayScheduleDateWithHkt,
  resolvePlayBlockedStateCopy,
} from "@/lib/market-pulse/play-empty-state";

const t = (key: keyof typeof marketPulseEnMessages) => marketPulseEnMessages[key];

const FUTURE_START = "2026-08-01T01:00:00.000Z";
const FUTURE_CARD = "2026-07-06T01:00:00.000Z";
const NOW = new Date("2026-07-05T12:00:00.000Z");

describe("resolvePlayBlockedStateCopy", () => {
  it("uses future-cycle copy when between_cycles and next cycle is scheduled", () => {
    const copy = resolvePlayBlockedStateCopy(
      "between_cycles",
      {
        status: "available",
        cycleId: "cycle-aug",
        name: "August 2026",
        startsAtIso: FUTURE_START,
        endsAtIso: null,
        revealAtIso: null,
        firstCardReleaseAtIso: null,
      },
      null,
      null,
      "en",
      t,
      NOW,
    );

    const rendered = applyPlayBlockedStateCopy(copy, t);
    expect(rendered.title).toBe("Next challenge begins soon");
    expect(rendered.body).toContain("The next Market Pulse cycle starts");
    expect(rendered.body).toContain("(HKT)");
    expect(rendered.detail).toBe(
      "Come back then to lock in your first signal.",
    );
  });

  it("uses TBC copy when between_cycles and no future cycle exists", () => {
    const copy = resolvePlayBlockedStateCopy(
      "between_cycles",
      { status: "tbc" },
      null,
      null,
      "en",
      t,
      NOW,
    );

    const rendered = applyPlayBlockedStateCopy(copy, t);
    expect(rendered.title).toBe("Next challenge: TBC");
    expect(rendered.body).toBe("We're preparing the next Market Pulse cycle.");
    expect(rendered.detail).toBe("Check back soon for the next start date.");
  });

  it("uses future-cycle copy for cycle_unavailable before start when next cycle is known", () => {
    const copy = resolvePlayBlockedStateCopy(
      "cycle_unavailable",
      {
        status: "available",
        cycleId: "cycle-aug",
        name: "August 2026",
        startsAtIso: FUTURE_START,
        endsAtIso: null,
        revealAtIso: null,
        firstCardReleaseAtIso: null,
      },
      "not_started",
      null,
      "en",
      t,
      NOW,
    );

    const rendered = applyPlayBlockedStateCopy(copy, t);
    expect(rendered.title).toBe("Next challenge begins soon");
    expect(rendered.body).toContain("The next Market Pulse cycle starts");
    expect(rendered.detail).toBe(
      "Come back then to lock in your first signal.",
    );
  });

  it("keeps generic cycle-unavailable copy for closed or past cycles", () => {
    const copy = resolvePlayBlockedStateCopy(
      "cycle_unavailable",
      { status: "tbc" },
      "reveal_passed",
      null,
      "en",
      t,
      NOW,
    );

    expect(copy.titleKey).toBe("mp.play.state.cycleUnavailable.title");
    expect(copy.bodyKey).toBe("mp.play.state.cycleUnavailable.body");
  });

  it("uses future-card copy for no_card_today when next release is in the future", () => {
    const copy = resolvePlayBlockedStateCopy(
      "no_card_today",
      { status: "tbc" },
      null,
      FUTURE_CARD,
      "en",
      t,
      NOW,
    );

    const rendered = applyPlayBlockedStateCopy(copy, t);
    expect(rendered.title).toBe("Today's signal unlocks soon");
    expect(rendered.body).toContain("Today's Market Pulse card unlocks");
    expect(rendered.detail).toBe("Come back then to make your call.");
  });

  it("adds optional next-cycle detail for runtime_closed without implying playability", () => {
    const copy = resolvePlayBlockedStateCopy(
      "runtime_closed",
      {
        status: "available",
        cycleId: "cycle-aug",
        name: "August 2026",
        startsAtIso: FUTURE_START,
        endsAtIso: null,
        revealAtIso: null,
        firstCardReleaseAtIso: null,
      },
      null,
      null,
      "en",
      t,
      NOW,
    );

    const rendered = applyPlayBlockedStateCopy(copy, t);
    expect(rendered.title).toBe("Market Pulse is temporarily closed");
    expect(rendered.detail).toContain("Next scheduled cycle:");
    expect(rendered.detail).toContain("(HKT)");
  });

  it("formats schedule dates with HKT label in zh-Hant", () => {
    const zhT = (key: keyof typeof marketPulseZhHantMessages) =>
      marketPulseZhHantMessages[key];
    const formatted = formatPlayScheduleDateWithHkt(
      FUTURE_START,
      "zh-Hant",
      zhT,
    );
    expect(formatted).toContain("香港時間");
  });
});

describe("next-cycle privacy in play empty state", () => {
  it("does not expose PPA fields in next-cycle page data shape", () => {
    const nextCycle = {
      status: "available" as const,
      cycleId: "cycle-aug",
      name: "August 2026",
      startsAtIso: FUTURE_START,
      endsAtIso: null,
      revealAtIso: null,
      firstCardReleaseAtIso: FUTURE_CARD,
    };

    const serialized = JSON.stringify(nextCycle);
    expect(serialized).not.toContain("ppaSignal");
    expect(serialized).not.toContain("ppaInsight");
    expect(serialized).not.toContain("newsBody");
  });
});
