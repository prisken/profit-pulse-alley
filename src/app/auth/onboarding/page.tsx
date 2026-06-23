import { redirect } from "next/navigation";

import OnboardingPageClient from "@/components/auth/OnboardingPage";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Complete your profile | Profit Pulse Ally",
  description: "Add your contact number to finish setting up your membership.",
};

export default async function OnboardingRoute() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/auth/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { contactNumber: true, name: true },
  });

  if (user?.contactNumber?.trim()) {
    redirect("/");
  }

  return <OnboardingPageClient userName={user?.name ?? null} />;
}
