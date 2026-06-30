/**
 * Guards against exposing local demo/seed Market Pulse cycles on public production paths.
 */

export function isMarketPulseProductionDeploy(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** Matches prisma seed `DEMO_CYCLE_NAME` and similar local development markers. */
export function isDemoOrSeedCycleName(name: string | null | undefined): boolean {
  if (!name?.trim()) {
    return false;
  }

  const normalized = name.trim();
  if (/\[DEMO\]/i.test(normalized)) {
    return true;
  }
  if (/local\s+seed/i.test(normalized)) {
    return true;
  }
  if (/demo\s+seed/i.test(normalized)) {
    return true;
  }

  return false;
}

export function shouldHideDemoCycleFromPublic(
  name: string | null | undefined,
): boolean {
  return isMarketPulseProductionDeploy() && isDemoOrSeedCycleName(name);
}

/** Synthetic challenge-cycle fallbacks are for local development only. */
export function shouldUseMarketPulseDevelopmentFallback(): boolean {
  return !isMarketPulseProductionDeploy();
}

export function filterCyclesForPublicPlay<T extends { name: string }>(
  cycles: T[],
): T[] {
  if (!isMarketPulseProductionDeploy()) {
    return cycles;
  }

  return cycles.filter((cycle) => !isDemoOrSeedCycleName(cycle.name));
}

export type GetActiveMarketPulseCycleOptions = {
  /**
   * When false, demo/seed-marked cycles are never returned on production deploys.
   * Defaults to the inverse of `isMarketPulseProductionDeploy()`.
   */
  allowDemoCycles?: boolean;
};

export function resolveAllowDemoCycles(
  options: GetActiveMarketPulseCycleOptions = {},
): boolean {
  return options.allowDemoCycles ?? !isMarketPulseProductionDeploy();
}

export function shouldTreatCycleAsActiveForPublic(
  name: string | null | undefined,
  allowDemoCycles: boolean,
): boolean {
  if (allowDemoCycles) {
    return true;
  }
  return !isDemoOrSeedCycleName(name);
}
