import { describe, expect, it } from "vitest";

import { stripPpaFromCardPayload } from "@/lib/market-pulse/swipe-card";

describe("stripPpaFromCardPayload", () => {
  it("removes ppaSignal and ppaInsight", () => {
    const safe = stripPpaFromCardPayload({
      id: "1",
      headline: "News",
      ppaSignal: "CAUTIOUS",
      ppaInsight: "Do not leak",
    });

    expect(safe).toEqual({
      id: "1",
      headline: "News",
    });
    expect("ppaSignal" in safe).toBe(false);
    expect("ppaInsight" in safe).toBe(false);
  });
});
