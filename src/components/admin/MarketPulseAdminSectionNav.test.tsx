/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarketPulseAdminSectionNav } from "@/components/admin/MarketPulseAdminShell";

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/market-pulse/admin-mp-navigation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/market-pulse/admin-mp-navigation")>();
  return {
    ...actual,
    getMarketPulseAdminNavSections: () => [
      { id: "cycles-hub", labelKey: "nav.cyclesHub" },
      { id: "approvals", labelKey: "nav.approvals" },
      { id: "audit", labelKey: "nav.audit" },
    ],
  };
});

describe("MarketPulseAdminSectionNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("links approvals to its own page, not a dead #anchor", () => {
    render(<MarketPulseAdminSectionNav />);
    const approvals = screen.getByRole("link", { name: "nav.approvals" });
    expect(approvals.getAttribute("href")).toBe("/admin/market-pulse/approvals");
  });

  it("keeps in-page anchors for dashboard sections", () => {
    render(<MarketPulseAdminSectionNav />);
    expect(screen.getByRole("link", { name: "nav.cyclesHub" }).getAttribute("href")).toBe(
      "#cycles-hub",
    );
    expect(screen.getByRole("link", { name: "nav.audit" }).getAttribute("href")).toBe(
      "#audit",
    );
  });
});
