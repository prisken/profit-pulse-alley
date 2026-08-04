/** Routes that render without the standard site header and footer. */
export const FULL_PAGE_ROUTES = [
  "/fortify-registration",
  "/admin",
  "/login",
  "/auth/onboarding",
  "/workshop/pyramid",
] as const;

/** Routes with no site chrome — full-screen product experience. */
export const IMMERSIVE_ROUTES = ["/market-pulse/play"] as const;

export function isFullPageRoute(pathname: string): boolean {
  return FULL_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isMarketPulseRoute(pathname: string): boolean {
  return pathname === "/market-pulse" || pathname.startsWith("/market-pulse/");
}
