/**
 * Homepage compose order — ensures the Market Pulse revamp sections mount in sequence.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PAGE_PATH = join(process.cwd(), "src/app/page.tsx");
const ECOSYSTEM_PATH = join(
  process.cwd(),
  "src/components/home/HomePpaEcosystemSection.tsx",
);
const LAYOUT_SHELL_PATH = join(process.cwd(), "src/components/LayoutShell.tsx");
const MOBILE_NAV_PATH = join(
  process.cwd(),
  "src/components/layout/MobileNav.tsx",
);
const FOOTER_PATH = join(process.cwd(), "src/components/SiteFooter.tsx");
const MATCHING_PULSE_PAGE_PATH = join(
  process.cwd(),
  "src/app/matching-pulse/page.tsx",
);

const REMOVED_SECTIONS = [
  "MarketPulsePpaInsightSection",
  "MarketPulseHowItWorksSection",
  "MarketPulseCycleLoopSection",
  "PlayLearnWinSection",
  "HomeHeroSignalPreview",
] as const;

const ORDERED_SECTIONS = [
  "MarketPulseHero",
  "MarketPulsePipelineSection",
  "HomePulseBoardWidget",
  "HomeRewardsShowcase",
  "HomePpaEcosystemSection",
  "LiveEventsHubSection",
  "PhilosophySection",
  "FinalCtaSection",
] as const;

describe("homepage compose", () => {
  const source = readFileSync(PAGE_PATH, "utf8");

  it("does not mount deprecated homepage sections", () => {
    for (const section of REMOVED_SECTIONS) {
      expect(source).not.toContain(`<${section}`);
    }
  });

  it("mounts revamp sections in product order", () => {
    const indices = ORDERED_SECTIONS.map((section) =>
      source.indexOf(`<${section}`),
    );
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i]!).toBeGreaterThan(indices[i - 1]!);
    }
  });

  it("keeps Market Pulse hero primary before Matching Pulse ecosystem", () => {
    expect(source.indexOf("<MarketPulseHero")).toBeLessThan(
      source.indexOf("<HomePpaEcosystemSection"),
    );
  });

  it("does not modify fortify survey routing from the homepage", () => {
    expect(source).not.toMatch(/fortify-survey/i);
  });
});

describe("Matching Pulse frontend entry points", () => {
  it("exposes a public /matching-pulse route", () => {
    const page = readFileSync(MATCHING_PULSE_PAGE_PATH, "utf8");
    expect(page).toContain("MatchingPulseLandingPage");
  });

  it("renders ecosystem cards with Matching Pulse as pilot (MP play CTA primary)", () => {
    const ecosystem = readFileSync(ECOSYSTEM_PATH, "utf8");
    expect(ecosystem).toContain('href: "/market-pulse/play"');
    expect(ecosystem).toContain('href: "/matching-pulse"');
    expect(ecosystem).toContain('accent: "pulse"');
    expect(ecosystem).toContain("matching-pulse");
    expect(ecosystem).toContain("MP_TERMINAL_PANEL");
    expect(ecosystem).not.toMatch(/credit|token|marketplace/i);
  });

  it("lists Matching Pulse after Market Pulse in desktop nav", () => {
    const shell = readFileSync(LAYOUT_SHELL_PATH, "utf8");
    const market = shell.indexOf('href="/market-pulse"');
    const matching = shell.indexOf('href="/matching-pulse"');
    const events = shell.indexOf('href="/events"');
    expect(market).toBeGreaterThanOrEqual(0);
    expect(matching).toBeGreaterThan(market);
    expect(events).toBeGreaterThan(matching);
  });

  it("lists Matching Pulse after Market Pulse in mobile nav", () => {
    const mobile = readFileSync(MOBILE_NAV_PATH, "utf8");
    const market = mobile.indexOf('href: "/market-pulse"');
    const matching = mobile.indexOf('href: "/matching-pulse"');
    const events = mobile.indexOf('href: "/events"');
    expect(market).toBeGreaterThanOrEqual(0);
    expect(matching).toBeGreaterThan(market);
    expect(events).toBeGreaterThan(matching);
  });

  it("lists Matching Pulse and Post a request in footer PPA column", () => {
    const footer = readFileSync(FOOTER_PATH, "utf8");
    const market = footer.indexOf('href: "/market-pulse"');
    const matching = footer.indexOf('href: "/matching-pulse"');
    const postRequest = footer.indexOf('href: "/matching-pulse/request"');
    const events = footer.indexOf('href: "/events"');
    expect(market).toBeGreaterThanOrEqual(0);
    expect(matching).toBeGreaterThan(market);
    expect(postRequest).toBeGreaterThan(matching);
    expect(events).toBeGreaterThan(postRequest);
  });
});
