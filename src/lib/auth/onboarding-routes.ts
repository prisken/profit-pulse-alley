/** Contact number is optional — no routes force onboarding for missing phone. */
export function requiresOnboardingForPath(pathname: string): boolean {
  void pathname;
  return false;
}

/** Safe in-app redirect targets for post-onboarding navigation. */
export function resolveOnboardingCallbackUrl(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  if (raw.startsWith("/auth/onboarding")) {
    return "/";
  }
  return raw;
}

export function buildOnboardingLoginUrl(callbackUrl: string): string {
  return `/login?callbackUrl=${encodeURIComponent(resolveOnboardingCallbackUrl(callbackUrl))}`;
}

export const ONBOARDING_SESSION_LOAD_MS = 12_000;
export const ONBOARDING_PENDING_GRACE_MS = 2_500;
