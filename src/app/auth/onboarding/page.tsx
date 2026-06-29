import OnboardingPageClient from "@/components/auth/OnboardingPage";
import { auth } from "@/auth";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { resolveOnboardingCallbackUrl } from "@/lib/auth/onboarding-routes";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.onboarding.title"),
    description: translate(locale, "auth.meta.onboarding.description"),
  };
}

export default async function OnboardingRoute({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>;
}>) {
  const params = await searchParams;
  const callbackUrl = resolveOnboardingCallbackUrl(params.callbackUrl);
  const session = await auth();

  if (!session?.user?.id) {
    // After Google OAuth, some mobile browsers deliver the session cookie to the
    // client before the server render sees it. Let the client resolve auth
    // instead of bouncing immediately to /login.
    return (
      <OnboardingPageClient
        userName={null}
        callbackUrl={callbackUrl}
        authState="pending"
        serverAlreadyOnboarded={false}
      />
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { contactNumber: true, name: true },
    });

    const alreadyOnboarded = Boolean(user?.contactNumber?.trim());

    // Do not server-redirect when contact exists but JWT still has
    // needsOnboarding — that causes a middleware ↔ onboarding redirect loop.
    return (
      <OnboardingPageClient
        userName={user?.name ?? session.user.name ?? null}
        callbackUrl={callbackUrl}
        authState="ready"
        serverAlreadyOnboarded={alreadyOnboarded}
      />
    );
  } catch (error) {
    console.error("[auth/onboarding] Failed to load user:", error);

    return (
      <OnboardingPageClient
        userName={session.user.name ?? null}
        callbackUrl={callbackUrl}
        authState="ready"
        serverAlreadyOnboarded={false}
      />
    );
  }
}
