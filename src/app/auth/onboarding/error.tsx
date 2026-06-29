"use client";

import OnboardingRecoveryPanel from "@/components/auth/OnboardingRecoveryPanel";

export default function OnboardingError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="relative flex min-h-screen min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-gray-950 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-gray-200 sm:px-4 sm:py-12">
      <OnboardingRecoveryPanel
        variant="error"
        callbackUrl="/"
        onTryAgain={reset}
      />
    </main>
  );
}
