import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import { buildInvalidSessionSignOutRedirect } from "@/lib/auth/invalid-session";
import { requiresOnboardingForPath } from "@/lib/auth/onboarding-routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (req.auth?.user?.sessionInvalid) {
    return NextResponse.redirect(new URL(buildInvalidSessionSignOutRedirect(), req.url));
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/auth/onboarding")) {
    return NextResponse.next();
  }

  if (req.auth?.user?.needsOnboarding && requiresOnboardingForPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/onboarding";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
