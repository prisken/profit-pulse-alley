/**
 * Deterministic return-rate constants for Workshop Pyramid Lab (v3.2 real terms).
 * These are REAL rates (nominal educational bands minus ~3% inflation).
 * UI display bands (e.g. 1–3%, 8–12%, 20–40%) are copy-only and must never feed math.
 */

/** Cash / liquid pool real decay (purchasing power). */
export const LIQUID_REAL_RETURN = -0.03;

/**
 * Invested-pool real annual returns by risk band.
 * Derived from prior nominal assumptions (2% / 6% / 10%) minus 3% inflation.
 */
export const RETURN_RATES = {
  low: -0.01,
  mid: 0.03,
  high: 0.07,
} as const;

/**
 * Blended annual real return from L/M/H allocation percentages (must sum to 100).
 */
export function blendedAnnualReturn(alloc: {
  low: number;
  mid: number;
  high: number;
}): number {
  return (
    (alloc.low / 100) * RETURN_RATES.low +
    (alloc.mid / 100) * RETURN_RATES.mid +
    (alloc.high / 100) * RETURN_RATES.high
  );
}
