import { describe, expect, it } from "vitest";

import { validateMarketPulseCycleForm } from "@/lib/market-pulse/cycle-validation";

describe("validateMarketPulseCycleForm", () => {
  it("requires name", () => {
    const result = validateMarketPulseCycleForm({
      name: "  ",
      startsAt: "2026-06-01T10:00",
      endsAt: "2026-06-10T10:00",
      revealAt: "2026-06-10T18:00",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeTruthy();
  });

  it("requires start before end", () => {
    const result = validateMarketPulseCycleForm({
      name: "June cycle",
      startsAt: "2026-06-10T10:00",
      endsAt: "2026-06-01T10:00",
      revealAt: "2026-06-10T18:00",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.endsAt).toMatch(/after start/i);
  });

  it("requires end on or before reveal", () => {
    const result = validateMarketPulseCycleForm({
      name: "June cycle",
      startsAt: "2026-06-01T10:00",
      endsAt: "2026-06-10T18:00",
      revealAt: "2026-06-10T10:00",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.revealAt).toMatch(/on or after end/i);
  });

  it("accepts valid dates", () => {
    const result = validateMarketPulseCycleForm({
      name: "June cycle",
      startsAt: "2026-06-01T10:00",
      endsAt: "2026-06-10T10:00",
      revealAt: "2026-06-10T10:00",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});
