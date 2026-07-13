/** Login path shown after clearing a JWT for a deleted or missing user record. */
export const REMOVED_ACCOUNT_LOGIN_PATH = "/login?reason=account_removed";

export function buildInvalidSessionSignOutRedirect(): string {
  return `/api/auth/signout?callbackUrl=${encodeURIComponent(REMOVED_ACCOUNT_LOGIN_PATH)}`;
}

export function isRemovedAccountLoginReason(
  reason: string | null | undefined,
): boolean {
  return reason === "account_removed";
}

export function resolveJwtUserState(
  dbUser: { id: string } | null,
): {
  sessionInvalid: boolean;
  needsOnboarding: boolean;
} {
  if (!dbUser) {
    return { sessionInvalid: true, needsOnboarding: false };
  }

  // Contact number is optional — never block site access or Market Pulse play.
  return {
    sessionInvalid: false,
    needsOnboarding: false,
  };
}
