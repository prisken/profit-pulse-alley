import { describe, expect, it } from "vitest";

import {
  ADMIN_MARKET_PULSE_PATH,
  ADMIN_ROOT_PATH,
  MARKET_PULSE_PUBLIC_PATHS,
  buildAdminMpBuilderBreadcrumbs,
  buildAdminMpDashboardBreadcrumbs,
  getMarketPulseAdminNavSections,
  marketPulseCycleBuilderPath,
} from "@/lib/market-pulse/admin-mp-navigation";

describe("admin Market Pulse navigation", () => {
  it("builds stable admin and builder routes", () => {
    expect(ADMIN_ROOT_PATH).toBe("/admin");
    expect(ADMIN_MARKET_PULSE_PATH).toBe("/admin/market-pulse");
    expect(marketPulseCycleBuilderPath("cycle-abc")).toBe(
      "/admin/market-pulse/cycles/cycle-abc/builder",
    );
  });

  it("exposes public player routes without changing admin paths", () => {
    expect(MARKET_PULSE_PUBLIC_PATHS.hub).toBe("/market-pulse");
    expect(MARKET_PULSE_PUBLIC_PATHS.play).toBe("/market-pulse/play");
    expect(MARKET_PULSE_PUBLIC_PATHS.leaderboard).toBe("/market-pulse/leaderboard");
    expect(MARKET_PULSE_PUBLIC_PATHS.reveal).toBe("/market-pulse/reveal");
  });

  it("builds dashboard breadcrumbs ending on Market Pulse", () => {
    const crumbs = buildAdminMpDashboardBreadcrumbs();
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]?.href).toBe("/admin");
    expect(crumbs[1]?.labelKey).toBe("auth.admin.breadcrumb.marketPulse");
    expect(crumbs[1]?.href).toBeUndefined();
  });

  it("builds builder breadcrumbs with cycle name", () => {
    const crumbs = buildAdminMpBuilderBreadcrumbs("Cycle 01");
    expect(crumbs).toHaveLength(3);
    expect(crumbs[1]?.href).toBe("/admin/market-pulse");
    expect(crumbs[2]?.label).toBe("Cycle 01");
  });

  it("omits setup nav after public launch", () => {
    const afterLaunch = new Date("2026-07-02T00:00:00.000Z");
    const sections = getMarketPulseAdminNavSections(afterLaunch);
    expect(sections.some((section) => section.id === "setup")).toBe(false);
    expect(sections.some((section) => section.id === "runtime")).toBe(true);
  });
});
