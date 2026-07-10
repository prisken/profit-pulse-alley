/**
 * Homepage compose order — ensures the Market Pulse revamp sections mount in sequence.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PAGE_PATH = join(process.cwd(), "src/app/page.tsx");

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
    const indices = ORDERED_SECTIONS.map((section) => source.indexOf(`<${section}`));
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i]!).toBeGreaterThan(indices[i - 1]!);
    }
  });

  it("does not modify fortify survey routing from the homepage", () => {
    expect(source).not.toMatch(/fortify-survey/i);
  });
});
