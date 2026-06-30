import { describe, expect, it } from "vitest";

import {
  MARKET_PULSE_FIRST_CYCLE_END_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
} from "@/lib/market-pulse/launch-config";
import {
  buildQuickCreateCycleDefaults,
  formatSequentialCycleName,
  parseCycleNumberFromName,
  resolveNextQuickCycleName,
} from "@/lib/market-pulse/quick-create-cycle-defaults";

describe("resolveNextQuickCycleName", () => {
  it("increments numbered cycle names", () => {
    expect(resolveNextQuickCycleName(["Cycle 01", "Cycle 02"])).toBe("Cycle 03");
  });

  it("uses cycle count when names are not numbered", () => {
    expect(resolveNextQuickCycleName(["First Public Cycle — July 2026"])).toBe(
      "Cycle 02",
    );
  });

  it("starts at Cycle 01 when no cycles exist", () => {
    expect(resolveNextQuickCycleName([])).toBe("Cycle 01");
  });

  it("skips duplicate numbered names", () => {
    expect(resolveNextQuickCycleName(["Cycle 01", "Cycle 02", "Cycle 03"])).toBe(
      "Cycle 04",
    );
  });
});

describe("parseCycleNumberFromName", () => {
  it("parses padded cycle numbers", () => {
    expect(parseCycleNumberFromName("Cycle 02")).toBe(2);
  });

  it("returns null for non-numbered names", () => {
    expect(parseCycleNumberFromName("First Public Cycle — July 2026")).toBeNull();
  });
});

describe("buildQuickCreateCycleDefaults", () => {
  it("creates draft defaults after the latest cycle end", () => {
    const defaults = buildQuickCreateCycleDefaults(
      [
        {
          name: "Cycle 01",
          startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
          endsAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
          revealAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
        },
      ],
      new Date("2026-07-05T00:00:00.000Z"),
    );

    expect(defaults.name).toBe("Cycle 02");
    expect(defaults.status).toBe("DRAFT");
    expect(defaults.prizeLabel).toBe("One Ocean Park ticket");
    expect(defaults.startsAt.getTime()).toBe(MARKET_PULSE_FIRST_CYCLE_END_AT.getTime());
    expect(defaults.endsAt.getTime() - defaults.startsAt.getTime()).toBe(
      MARKET_PULSE_FIRST_CYCLE_END_AT.getTime() -
        MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime(),
    );
    expect(defaults.revealAt.getTime()).toBe(defaults.endsAt.getTime());
  });

  it("uses the default duration when no prior cycles exist", () => {
    const now = new Date("2026-05-01T12:00:00.000Z");
    const defaults = buildQuickCreateCycleDefaults([], now);

    expect(defaults.name).toBe(formatSequentialCycleName(1));
    expect(defaults.status).toBe("DRAFT");
    expect(defaults.endsAt.getTime() - defaults.startsAt.getTime()).toBe(
      MARKET_PULSE_FIRST_CYCLE_END_AT.getTime() -
        MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime(),
    );
  });
});
