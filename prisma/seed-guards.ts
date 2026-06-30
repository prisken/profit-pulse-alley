/**
 * Production guards for `prisma/seed.ts` — extracted for unit tests without Prisma.
 */

export function isExplicitSeedRequested(): boolean {
  const flag = process.env.MARKET_PULSE_SEED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function assertSeedAllowed(): void {
  const explicit = isExplicitSeedRequested();
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production" && !explicit) {
    throw new Error(
      "Market Pulse seed blocked on Vercel production. Set MARKET_PULSE_SEED=1 only if you intend to seed a non-production database.",
    );
  }

  if (nodeEnv === "production" && !explicit) {
    throw new Error(
      "Market Pulse seed blocked when NODE_ENV=production. Run with NODE_ENV=development or set MARKET_PULSE_SEED=1 explicitly.",
    );
  }

  if (explicit) {
    console.warn(
      "[seed] MARKET_PULSE_SEED is set — proceeding despite environment flags.",
    );
  }
}
