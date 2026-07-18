/**
 * UI-only helpers for Matching Pulse auth journey copy.
 * Does not affect JWT, session, or redirect security.
 */

/** True when the auth flow should show Matching Pulse journey copy. */
export function isMatchingPulseAuthCallback(
  raw: string | undefined | null,
): boolean {
  if (!raw) {
    return false;
  }

  if (raw.includes("/matching-pulse")) {
    return true;
  }

  try {
    return decodeURIComponent(raw).includes("/matching-pulse");
  } catch {
    return false;
  }
}
