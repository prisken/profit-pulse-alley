"use client";

import Link from "next/link";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { buildOnboardingLoginUrl } from "@/lib/auth/onboarding-routes";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const linkButtonClass = `inline-flex min-h-10 items-center justify-center rounded-full border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-900 ${focusRing}`;

const primaryLinkClass = `inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 ${focusRing}`;

export type OnboardingRecoveryVariant =
  | "loading"
  | "error"
  | "guest"
  | "sync"
  | "sessionSyncFailed";

export default function OnboardingRecoveryPanel({
  variant,
  callbackUrl,
  onTryAgain,
}: Readonly<{
  variant: OnboardingRecoveryVariant;
  callbackUrl: string;
  onTryAgain?: () => void;
}>) {
  const { t } = useTranslations();
  const loginHref = buildOnboardingLoginUrl(callbackUrl);

  const titleKey =
    variant === "guest"
      ? "auth.onboarding.guestTitle"
      : variant === "error"
        ? "auth.onboarding.errorTitle"
        : variant === "sessionSyncFailed"
          ? "auth.onboarding.sessionSyncFailedTitle"
          : variant === "sync"
            ? "auth.onboarding.finishingSetup"
            : "auth.onboarding.loadingProfile";

  const bodyKey =
    variant === "guest"
      ? "auth.onboarding.guestBody"
      : variant === "error"
        ? "auth.onboarding.errorBody"
        : variant === "sessionSyncFailed"
          ? "auth.onboarding.sessionSyncFailedBody"
          : variant === "sync"
            ? "auth.onboarding.finishingSetupBody"
            : "auth.onboarding.stuckHint";

  const showTryAgain =
    variant === "error" ||
    variant === "sessionSyncFailed" ||
    (variant === "loading" && Boolean(onTryAgain));

  return (
    <div className="w-full max-w-sm text-center" role="status" aria-live="polite">
      {variant === "loading" || variant === "sync" ? (
        <>
          <div className="mx-auto h-9 w-9 animate-pulse rounded-sm bg-gray-800 sm:h-10 sm:w-10" />
          <div className="mx-auto mt-4 h-8 w-40 animate-pulse rounded bg-gray-800" />
        </>
      ) : null}

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {t(titleKey)}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{t(bodyKey)}</p>

      <div className="mt-6 flex flex-col gap-2">
        {variant === "guest" ? (
          <Link href={loginHref} className={primaryLinkClass}>
            {t("auth.onboarding.signInToContinue")}
          </Link>
        ) : null}

        {showTryAgain && onTryAgain ? (
          <button type="button" onClick={onTryAgain} className={primaryLinkClass}>
            {t("auth.onboarding.tryAgain")}
          </button>
        ) : null}

        {variant !== "guest" ? (
          <Link href="/profile" className={linkButtonClass}>
            {t("auth.onboarding.goToProfile")}
          </Link>
        ) : null}

        <Link href={loginHref} className={linkButtonClass}>
          {t("auth.onboarding.returnToLogin")}
        </Link>

        <Link
          href="/contact"
          className={`text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-400 hover:underline ${focusRing}`}
        >
          {t("auth.onboarding.contactSupport")}
        </Link>
      </div>
    </div>
  );
}
