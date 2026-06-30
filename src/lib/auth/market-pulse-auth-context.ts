/**
 * UI-only helpers for Market Pulse auth journey copy.
 * Does not affect JWT, session, or redirect security.
 */

/** True when the auth flow should show Market Pulse journey copy. */
export function isMarketPulseAuthCallback(
  raw: string | undefined | null,
): boolean {
  if (!raw) {
    return false;
  }

  if (raw.includes("/market-pulse")) {
    return true;
  }

  try {
    return decodeURIComponent(raw).includes("/market-pulse");
  } catch {
    return false;
  }
}
