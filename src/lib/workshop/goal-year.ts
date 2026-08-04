/**
 * Goal timing helpers for Workshop Pyramid Lab.
 * Kept outside `"use server"` modules — Next.js requires exported server actions to be async.
 */

/**
 * Calendar year when the user reaches `targetAge`.
 * `targetYear = currentCalendarYear + (targetAge − userAge)`
 */
export function deriveGoalYear(
  targetAge: number,
  userAge: number,
  nowYear: number = new Date().getFullYear(),
): number {
  return Math.round(nowYear + (Math.round(targetAge) - Math.round(userAge)));
}

/**
 * Age the user will be in `targetYear` (for parsing v2 sessions that only store year).
 * `targetAge = userAge + (targetYear − currentCalendarYear)`
 */
export function deriveGoalAge(
  targetYear: number,
  userAge: number,
  nowYear: number = new Date().getFullYear(),
): number {
  return Math.round(userAge) + (Math.round(targetYear) - nowYear);
}
