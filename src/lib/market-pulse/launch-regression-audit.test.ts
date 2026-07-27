/**
 * Final launch regression audit — static checks for critical Market Pulse safety rules.
 * Manual checklist: docs/market-pulse-deploy-checklist.md § Launch smoke test
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
  STREAK_INTERVAL,
} from "@/lib/market-pulse/constants";
import { canAccessMarketPulsePlay, canSubmitMarketPulseDecision } from "@/lib/market-pulse/launch-config";

const JUL_1_0000_HKT = new Date("2026-06-30T16:00:00.000Z");
const JUN_30_235959_HKT = new Date("2026-06-30T15:59:59.999Z");

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Launch regression audit — scoring", () => {
  it("keeps participation/match/streak constants unchanged", () => {
    expect(PARTICIPATION_POINTS).toBe(10);
    expect(MATCH_BONUS_POINTS).toBe(50);
    expect(STREAK_BONUS_POINTS).toBe(100);
    expect(STREAK_INTERVAL).toBe(3);
  });

  it("persists score events only through admin reveal", () => {
    const adminActions = readSource("src/lib/market-pulse/admin-actions.ts");
    const server = readSource("src/lib/market-pulse/server.ts");

    expect(adminActions).toContain("calculateAndPersistCycleScores(cycleId)");
    expect(server).toContain("marketPulseScoreEvent.createMany");
    expect(adminActions).not.toContain("marketPulseScoreEvent.createMany");

    const submitStart = server.indexOf("export async function submitMarketPulseDecision");
    const submitEnd = server.indexOf("export async function calculateAndPersistCycleScores");
    const submitBody = server.slice(submitStart, submitEnd);

    expect(submitBody).not.toContain("marketPulseScoreEvent");
    expect(submitBody).toContain("canSubmitMarketPulseDecision");
  });
});

describe("Launch regression audit — reveal and PPA", () => {
  it("blocks admin reveal when published-card PPA is incomplete", () => {
    const adminActions = readSource("src/lib/market-pulse/admin-actions.ts");
    const revealStart = adminActions.indexOf(
      "export async function revealMarketPulseCycleAction",
    );
    const revealBody = adminActions.slice(revealStart, revealStart + 1500);

    expect(revealBody).toContain("validateCycleReadyForReveal(cycleId)");
    expect(revealBody).toContain("if (!ppaValidation.ready)");
    expect(adminActions).toContain("calculateAndPersistCycleScores(cycleId)");
  });

  it("requires locked PPA before publish", () => {
    const validation = readSource("src/lib/market-pulse/card-validation.ts");

    expect(validation).toContain("PPA signal must be locked before publishing.");
    expect(validation).toContain("PPA insight is required to publish.");
  });
});

describe("Launch regression audit — launch gating", () => {
  it("blocks non-admin submit before 1 Jul 2026 00:00 HKT", () => {
    expect(canSubmitMarketPulseDecision("USER", JUN_30_235959_HKT)).toBe(false);
    expect(canSubmitMarketPulseDecision(undefined, JUN_30_235959_HKT)).toBe(
      false,
    );
    expect(canSubmitMarketPulseDecision("ADMIN", JUN_30_235959_HKT)).toBe(true);
  });

  it("allows USER submit on and after launch when other gates pass", () => {
    expect(canAccessMarketPulsePlay("USER", JUL_1_0000_HKT)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", JUL_1_0000_HKT)).toBe(true);
  });
});

describe("Launch regression audit — admin authorization wiring", () => {
  it("guards admin dashboard and builder data loaders", () => {
    const adminData = readSource("src/lib/market-pulse/admin-data.ts");
    const builderData = readSource("src/lib/market-pulse/admin-builder-data.ts");

    expect(adminData).toContain("requireAdminSession()");
    expect(builderData).toContain("requireAdminSession()");
  });

  it("redirects non-admin users away from admin pages", () => {
    const adminPage = readSource("src/app/admin/market-pulse/page.tsx");
    const builderPage = readSource(
      "src/app/admin/market-pulse/cycles/[cycleId]/builder/page.tsx",
    );
    const adminRoot = readSource("src/app/admin/page.tsx");

    for (const source of [adminPage, builderPage, adminRoot]) {
      expect(source).toContain('redirect("/")');
      expect(source).not.toMatch(/if \(!data\)[\s\S]*redirect\("\/login"\)/);
    }
  });
});

describe("Launch regression audit — /fortify-registration", () => {
  it("remains a static registration page without redirects", () => {
    const page = readSource("src/app/fortify-registration/page.tsx");
    const layout = readSource("src/app/fortify-registration/layout.tsx");

    expect(page).toContain("FortifyRegistration");
    expect(page).not.toMatch(/\bredirect\s*\(/);
    expect(layout).not.toMatch(/\bredirect\s*\(/);
  });
});
