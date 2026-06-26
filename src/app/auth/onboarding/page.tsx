import { redirect } from "next/navigation";

import OnboardingPageClient from "@/components/auth/OnboardingPage";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Complete your profile | Profit Pulse Ally",
  description: "Add your contact number to finish setting up your membership.",
};

function resolveCallbackUrl(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export default async function OnboardingRoute({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>;
}>) {
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.callbackUrl);
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
      />
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { contactNumber: true, name: true },
    });

    if (user?.contactNumber?.trim()) {
      redirect(callbackUrl);
    }

    return (
      <OnboardingPageClient
        userName={user?.name ?? session.user.name ?? null}
        callbackUrl={callbackUrl}
        authState="ready"
      />
    );
  } catch (error) {
    console.error("[auth/onboarding] Failed to load user:", error);

    return (
      <OnboardingPageClient
        userName={session.user.name ?? null}
        callbackUrl={callbackUrl}
        authState="ready"
      />
    );
  }
}
