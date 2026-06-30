import { describe, expect, it } from "vitest";

import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";

describe("marketPulseCycleBuilderPath", () => {
  it("builds the admin cycle builder route", () => {
    expect(marketPulseCycleBuilderPath("cycle-abc")).toBe(
      "/admin/market-pulse/cycles/cycle-abc/builder",
    );
  });
});
