import { encode } from "@auth/core/jwt";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { resolveOnboardingCallbackUrl } from "@/lib/auth/onboarding-routes";
import { prisma } from "@/lib/prisma";

function sessionCookieName(secureCookie: boolean): string {
  return secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/** Refresh JWT after onboarding using DB contact number, then redirect. */
export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const secureCookie = request.nextUrl.protocol === "https:";
  const cookieName = sessionCookieName(secureCookie);

  const token = await getToken({
    req: request,
    secret,
    secureCookie,
    cookieName,
    salt: cookieName,
  });

  const userId = (token?.id ?? token?.sub) as string | undefined;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { contactNumber: true },
  });

  if (!user?.contactNumber?.trim()) {
    return NextResponse.redirect(new URL("/auth/onboarding", request.url));
  }

  const callbackUrl = resolveOnboardingCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl") ?? undefined,
  );

  if (!token) {
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  const encoded = await encode({
    token: {
      ...token,
      id: userId,
      needsOnboarding: false,
    },
    secret,
    salt: cookieName,
  });

  const response = NextResponse.redirect(new URL(callbackUrl, request.url));
  response.cookies.set(cookieName, encoded, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
  });

  return response;
}
