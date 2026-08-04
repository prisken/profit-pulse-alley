import { describe, expect, it } from "vitest";

import { deriveGoalAge, deriveGoalYear } from "@/lib/workshop/goal-year";

describe("deriveGoalYear / deriveGoalAge", () => {
  it("derives calendar year from target age and user age", () => {
    expect(deriveGoalYear(65, 35, 2026)).toBe(2056);
    expect(deriveGoalYear(40, 32, 2026)).toBe(2034);
  });

  it("derives target age from calendar year (v2 session compat)", () => {
    expect(deriveGoalAge(2056, 35, 2026)).toBe(65);
    expect(deriveGoalAge(2030, 32, 2026)).toBe(36);
  });

  it("round-trips age → year → age", () => {
    const userAge = 40;
    const targetAge = 55;
    const year = deriveGoalYear(targetAge, userAge, 2026);
    expect(deriveGoalAge(year, userAge, 2026)).toBe(targetAge);
  });
});
