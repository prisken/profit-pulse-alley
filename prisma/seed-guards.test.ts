import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertSeedAllowed, isExplicitSeedRequested } from "./seed-guards";

describe("seed production guards", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("blocks NODE_ENV=production without explicit override", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    delete process.env.MARKET_PULSE_SEED;

    expect(() => assertSeedAllowed()).toThrow(/blocked when NODE_ENV=production/i);
  });

  it("blocks VERCEL_ENV=production without explicit override", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.MARKET_PULSE_SEED;

    expect(() => assertSeedAllowed()).toThrow(/blocked on Vercel production/i);
  });

  it("allows production when MARKET_PULSE_SEED=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MARKET_PULSE_SEED", "1");

    expect(() => assertSeedAllowed()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("MARKET_PULSE_SEED is set"),
    );
  });

  it("allows development without override", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "preview");
    delete process.env.MARKET_PULSE_SEED;

    expect(() => assertSeedAllowed()).not.toThrow();
    expect(isExplicitSeedRequested()).toBe(false);
  });
});
