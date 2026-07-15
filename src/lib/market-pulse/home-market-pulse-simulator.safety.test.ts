/**
 * Static safety checks for the homepage Market Pulse simulator.
 * Component runtime tests are not set up in this repo (no *.test.tsx harness);
 * these assertions read source to ensure the widget stays demo-only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SIMULATOR_PATH = join(
  process.cwd(),
  "src/components/home/HomeMarketPulseSimulator.tsx",
);

const FORBIDDEN_IMPORT_PATTERNS = [
  /player-handlers/,
  /\/api\/market-pulse/,
  /@\/lib\/prisma/,
  /submitMarketPulse/,
  /handlePostMarketPulse/,
  /handleGetMarketPulse/,
  /getMarketPulseLeaderboard/,
  /play-data/,
  /from "@\/lib\/market-pulse\/server"/,
  /MarketPulseTrackedLink/,
] as const;

describe("HomeMarketPulseSimulator safety (static)", () => {
  const source = readFileSync(SIMULATOR_PATH, "utf8");

  it("labels itself as a demo simulator and uses simulator i18n keys", () => {
    expect(source).toContain('data-mp-simulator="true"');
    expect(source).toContain("home.hero.simulator.title");
    expect(source).toContain("home.hero.simulator.badgeDemo");
    expect(source).toContain("home.hero.simulator.sampleLabel");
    expect(source).not.toContain("home.hero.simulator.disclaimer");
    expect(source).toContain("home.hero.simulator.feedbackLocked");
    expect(source).toContain("/images/simulator-sample-signal.jpg");
    expect(source).toContain("useState");
  });

  it("does not import player actions, API handlers, or server submission logic", () => {
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      expect(source).not.toMatch(pattern);
    }
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it("uses local React state only for stance preview", () => {
    expect(source).toContain("useState");
    expect(source).not.toMatch(/useActionState|useFormState|formAction/);
  });
});
