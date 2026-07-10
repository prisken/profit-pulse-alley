import { describe, expect, it } from "vitest";

import {
  mergeMpClasses,
  MP_MOCK_LEADERBOARD_ROWS,
  MP_STATUS_CHIP_STYLES,
  MP_SURFACE_STYLES,
  mpSurfacePadding,
} from "@/lib/market-pulse/visual-primitives";

describe("visual-primitives", () => {
  it("mergeMpClasses skips falsy values", () => {
    expect(mergeMpClasses("a", false, null, undefined, "b")).toBe("a b");
    expect(mergeMpClasses()).toBe("");
  });

  it("defines surface variants with glass and prize styles", () => {
    expect(MP_SURFACE_STYLES.glass).toContain("backdrop-blur");
    expect(MP_SURFACE_STYLES.prize).toContain("amber");
    expect(MP_SURFACE_STYLES.elevated).toContain("mp-obsidian-elevated");
  });

  it("maps status chip variants including live and locked", () => {
    expect(MP_STATUS_CHIP_STYLES.live.container).toContain("mp-pulse");
    expect(MP_STATUS_CHIP_STYLES.locked.container).toContain("amber");
    expect(MP_STATUS_CHIP_STYLES.revealed.container).toContain("sky");
  });

  it("returns padding scales", () => {
    expect(mpSurfacePadding("compact")).toContain("p-3");
    expect(mpSurfacePadding("spacious")).toContain("p-6");
  });

  it("provides default mock leaderboard rows", () => {
    expect(MP_MOCK_LEADERBOARD_ROWS).toHaveLength(3);
    expect(MP_MOCK_LEADERBOARD_ROWS[0]?.rank).toBe(1);
  });
});
