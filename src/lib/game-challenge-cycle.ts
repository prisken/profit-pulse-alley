/** Length of each leaderboard challenge window (in-game simulation is also 10 days). */
export const CHALLENGE_CYCLE_DAYS = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const CHALLENGE_CYCLE_MS = CHALLENGE_CYCLE_DAYS * MS_PER_DAY;

/** First cycle start: 1 Jan 2026, 00:00 Hong Kong (UTC+8). */
export const CHALLENGE_CYCLE_EPOCH_MS = Date.UTC(2025, 11, 31, 16, 0, 0, 0);

export type ChallengeCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function getChallengeCycleEnd(now = Date.now()): Date {
  const elapsed = Math.max(0, now - CHALLENGE_CYCLE_EPOCH_MS);
  const cycleIndex = Math.floor(elapsed / CHALLENGE_CYCLE_MS);
  return new Date(
    CHALLENGE_CYCLE_EPOCH_MS + (cycleIndex + 1) * CHALLENGE_CYCLE_MS,
  );
}

export function getChallengeCycleRemainingMs(now = Date.now()): number {
  return Math.max(0, getChallengeCycleEnd(now).getTime() - now);
}

export function getChallengeCountdown(now = Date.now()): ChallengeCountdown {
  let totalMs = getChallengeCycleRemainingMs(now);

  const days = Math.floor(totalMs / MS_PER_DAY);
  totalMs -= days * MS_PER_DAY;

  const hours = Math.floor(totalMs / (60 * 60 * 1000));
  totalMs -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(totalMs / (60 * 1000));
  totalMs -= minutes * 60 * 1000;

  const seconds = Math.floor(totalMs / 1000);

  return { days, hours, minutes, seconds, totalMs: getChallengeCycleRemainingMs(now) };
}
