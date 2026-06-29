import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export default async function OnboardingLoading() {
  const locale = await getServerSiteLocale();
  const loadingLabel = translate(locale, "auth.onboarding.loadingProfile");

  return (
    <main className="flex min-h-screen min-h-dvh flex-col items-center justify-center bg-gray-950 px-4 py-12 text-gray-200">
      <div
        className="w-full max-w-sm text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="mx-auto h-9 w-9 animate-pulse rounded-sm bg-gray-800 sm:h-10 sm:w-10" />
        <div className="mx-auto mt-4 h-8 w-40 animate-pulse rounded bg-gray-800" />
        <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-gray-800" />
        <p className="mt-4 text-sm text-gray-500">{loadingLabel}</p>
      </div>
    </main>
  );
}
