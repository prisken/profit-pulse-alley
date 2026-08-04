import { describe, expect, it } from "vitest";

import {
  formatCompactHkd,
  truncateLabelCjkSafe,
} from "@/lib/workshop/format-compact-hkd";

describe("formatCompactHkd", () => {
  it("formats below 1K as whole HKD", () => {
    expect(formatCompactHkd(0)).toBe("HK$0");
    expect(formatCompactHkd(999)).toBe("HK$999");
  });

  it("formats thousands as K with ≤3 sig figs", () => {
    expect(formatCompactHkd(999_000)).toBe("HK$999K");
    expect(formatCompactHkd(780_000)).toBe("HK$780K");
    expect(formatCompactHkd(1_500)).toBe("HK$1.5K");
  });

  it("formats millions as M with ≤3 sig figs", () => {
    expect(formatCompactHkd(1_050_000)).toBe("HK$1.05M");
    expect(formatCompactHkd(1_500_000)).toBe("HK$1.5M");
    expect(formatCompactHkd(20_700_000)).toBe("HK$20.7M");
  });

  it("preserves sign for negatives", () => {
    expect(formatCompactHkd(-1_500_000)).toBe("-HK$1.5M");
  });
});

describe("truncateLabelCjkSafe", () => {
  it("does not split CJK characters", () => {
    expect(truncateLabelCjkSafe("退休儲備金目標", 4)).toBe("退休儲…");
    expect(truncateLabelCjkSafe("Wedding", 4)).toBe("Wed…");
  });

  it("returns full string when under budget", () => {
    expect(truncateLabelCjkSafe("置業", 6)).toBe("置業");
  });
});
