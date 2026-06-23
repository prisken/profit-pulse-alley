/** Matches `INITIAL_CASH` in `MarketPulseGame.tsx` (HKD). */
const MARKET_PULSE_STARTING_BALANCE = 100_000_000;

export const MIN_MARKET_PULSE_SCORE = 0;

/** Headroom for portfolio growth above starting net worth during a 10-year run. */
export const MAX_MARKET_PULSE_SCORE = MARKET_PULSE_STARTING_BALANCE * 10;
