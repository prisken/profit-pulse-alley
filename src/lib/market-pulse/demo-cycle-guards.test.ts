import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  filterCyclesForPublicPlay,
  isDemoOrSeedCycleName,
  isMarketPulseProductionDeploy,
  resolveAllowDemoCycles,
  shouldHideDemoCycleFromPublic,
  shouldTreatCycleAsActiveForPublic,
  shouldUseMarketPulseDevelopmentFallback,
} from "@/lib/market-pulse/demo-cycle-guards";

const DEMO_CYCLE_NAME = "[DEMO] Market Pulse Local Seed";

describe("demo-cycle-guards", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects demo and local seed cycle names", () => {
    expect(isDemoOrSeedCycleName(DEMO_CYCLE_NAME)).toBe(true);
    expect(isDemoOrSeedCycleName("[DEMO] Preview")).toBe(true);
    expect(isDemoOrSeedCycleName("Market Pulse Local Seed")).toBe(true);
    expect(isDemoOrSeedCycleName("July 2026 Cycle")).toBe(false);
    expect(isDemoOrSeedCycleName(null)).toBe(false);
  });

  it("treats production deploy via NODE_ENV or VERCEL_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isMarketPulseProductionDeploy()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isMarketPulseProductionDeploy()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isMarketPulseProductionDeploy()).toBe(false);
  });

  it("hides demo cycles from public only in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldHideDemoCycleFromPublic(DEMO_CYCLE_NAME)).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(shouldHideDemoCycleFromPublic(DEMO_CYCLE_NAME)).toBe(false);
  });

  it("disables development fallbacks in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldUseMarketPulseDevelopmentFallback()).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    expect(shouldUseMarketPulseDevelopmentFallback()).toBe(true);
  });

  it("filters demo cycles from public lists in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const cycles = [
      { id: "1", name: DEMO_CYCLE_NAME },
      { id: "2", name: "July 2026 Cycle" },
    ];

    expect(filterCyclesForPublicPlay(cycles)).toEqual([
      { id: "2", name: "July 2026 Cycle" },
    ]);
  });

  it("defaults allowDemoCycles to environment", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveAllowDemoCycles()).toBe(false);
    expect(resolveAllowDemoCycles({ allowDemoCycles: true })).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(resolveAllowDemoCycles()).toBe(true);
  });

  it("blocks demo cycles for public active resolution when disallowed", () => {
    expect(
      shouldTreatCycleAsActiveForPublic(DEMO_CYCLE_NAME, false),
    ).toBe(false);
    expect(
      shouldTreatCycleAsActiveForPublic("July 2026 Cycle", false),
    ).toBe(true);
    expect(
      shouldTreatCycleAsActiveForPublic(DEMO_CYCLE_NAME, true),
    ).toBe(true);
  });
});
