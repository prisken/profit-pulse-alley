const ONBOARDING_REQUIRED_PATH_PREFIXES = ["/market-pulse/play"] as const;

/** Routes where contact collection is required before the player can proceed. */
export function requiresOnboardingForPath(pathname: string): boolean {
  return ONBOARDING_REQUIRED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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
  const onboardingPath =
    callbackUrl === "/"
      ? "/auth/onboarding"
      : `/auth/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return `/login?callbackUrl=${encodeURIComponent(onboardingPath)}`;
}

export const ONBOARDING_SESSION_LOAD_MS = 12_000;
export const ONBOARDING_PENDING_GRACE_MS = 2_500;
