"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import OnboardingRecoveryPanel from "@/components/auth/OnboardingRecoveryPanel";
import MarketPulseAuthPanel from "@/components/auth/MarketPulseAuthPanel";
import { updateContactNumber } from "@/lib/auth-actions";
import {
  ONBOARDING_PENDING_GRACE_MS,
  ONBOARDING_SESSION_LOAD_MS,
} from "@/lib/auth/onboarding-routes";
import { isMarketPulseAuthCallback } from "@/lib/auth/market-pulse-auth-context";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

function completeOnboardingUrl(callbackUrl: string): string {
  return `/api/auth/complete-onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

const inputClass = `w-full min-h-11 rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-base text-white placeholder:text-gray-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const primaryButtonClass = `w-full min-h-11 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export type OnboardingAuthState = "ready" | "pending";

function OnboardingForm({
  userName,
  callbackUrl,
}: Readonly<{ userName: string | null; callbackUrl: string }>) {
  const { t, locale } = useTranslations();
  const fromMarketPulse = isMarketPulseAuthCallback(callbackUrl);

  const [contactNumber, setContactNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await updateContactNumber(contactNumber);

      if (!result.success) {
        setError(translateAuthMessage(locale, result.error));
        return;
      }

      window.location.assign(completeOnboardingUrl(callbackUrl));
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-sm">
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label={t("common.brandHomeAria")}
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 rounded-sm sm:h-10 sm:w-10"
            priority
          />
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-white sm:mt-5 sm:text-2xl">
          {t("auth.onboarding.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {userName ? (
            <>{t("auth.onboarding.welcome").replace("{name}", userName)} </>
          ) : null}
          {!fromMarketPulse ? t("auth.onboarding.body") : null}
        </p>
      </div>

      {fromMarketPulse ? (
        <MarketPulseAuthPanel variant="onboarding" className="mt-5 sm:mt-6" />
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-6 space-y-3 sm:mt-8 sm:space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-400">
            {t("auth.login.contactNumber")}
          </span>
          <input
            type="tel"
            name="contactNumber"
            autoComplete="tel"
            inputMode="tel"
            placeholder={t("auth.login.placeholderContact")}
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            disabled={isLoading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "onboarding-error" : undefined}
            className={inputClass}
          />
          <span className="mt-1.5 block text-center text-[11px] text-gray-500 sm:text-left sm:text-xs">
            {t("auth.onboarding.contactHint")}
          </span>
        </label>

        <button type="submit" disabled={isLoading || !contactNumber.trim()} className={primaryButtonClass}>
          {isLoading ? t("auth.onboarding.saving") : t("auth.onboarding.saveContact")}
        </button>

        {error ? (
          <p id="onboarding-error" className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="mt-5 space-y-2 text-center sm:mt-6">
        <Link
          href={completeOnboardingUrl(callbackUrl)}
          className={`inline-flex min-h-10 w-full items-center justify-center rounded-full border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-900 sm:w-auto ${focusRing}`}
        >
          {t("auth.onboarding.skipForNow")}
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-10 items-center justify-center text-sm font-medium text-gray-400 underline-offset-4 transition-colors hover:text-gray-200 hover:underline ${focusRing}`}
        >
          {t("auth.onboarding.backHome")}
        </Link>
        <p className="text-xs leading-relaxed text-gray-500">
          {t("auth.onboarding.deferHint")}
        </p>
      </div>
    </div>
  );
}

function OnboardingAlreadyCompleteRedirect({
  callbackUrl,
}: Readonly<{ callbackUrl: string }>) {
  useEffect(() => {
    window.location.assign(callbackUrl);
  }, [callbackUrl]);

  return <OnboardingRecoveryPanel variant="sync" callbackUrl={callbackUrl} />;
}

function OnboardingRouter({
  authState,
  callbackUrl,
  userName,
  serverAlreadyOnboarded,
}: Readonly<{
  authState: OnboardingAuthState;
  callbackUrl: string;
  userName: string | null;
  serverAlreadyOnboarded: boolean;
}>) {
  const { status, data: session } = useSession();
  const [pendingGraceDone, setPendingGraceDone] = useState(
    authState !== "pending",
  );
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  useEffect(() => {
    if (authState !== "pending") {
      return;
    }

    const timer = window.setTimeout(() => {
      setPendingGraceDone(true);
    }, ONBOARDING_PENDING_GRACE_MS);

    return () => window.clearTimeout(timer);
  }, [authState]);

  useEffect(() => {
    if (status !== "loading") {
      const frame = window.requestAnimationFrame(() => {
        setSessionTimedOut(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      setSessionTimedOut(true);
    }, ONBOARDING_SESSION_LOAD_MS);

    return () => window.clearTimeout(timer);
  }, [status]);

  const alreadyOnboarded = serverAlreadyOnboarded;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isUnauthenticated = status === "unauthenticated";

  const showGuest =
    isUnauthenticated &&
    pendingGraceDone &&
    (authState === "ready" || sessionTimedOut);

  const showLoading =
    authState !== "ready" &&
    ((isLoading && !sessionTimedOut) ||
      (authState === "pending" && isUnauthenticated && !pendingGraceDone));

  const handleTryAgain = useCallback(() => {
    setSessionTimedOut(false);
    window.location.reload();
  }, []);

  if (alreadyOnboarded) {
    return <OnboardingAlreadyCompleteRedirect callbackUrl={callbackUrl} />;
  }

  // Server already validated the session — render the form without waiting
  // for a client-side session refetch (common after Google OAuth on mobile).
  if (
    authState === "ready" &&
    !serverAlreadyOnboarded &&
    (isAuthenticated || isLoading)
  ) {
    return (
      <OnboardingForm
        userName={userName ?? session?.user?.name ?? null}
        callbackUrl={callbackUrl}
      />
    );
  }

  if (showGuest) {
    return <OnboardingRecoveryPanel variant="guest" callbackUrl={callbackUrl} />;
  }

  if (showLoading) {
    return (
      <OnboardingRecoveryPanel
        variant="loading"
        callbackUrl={callbackUrl}
        onTryAgain={sessionTimedOut ? handleTryAgain : undefined}
      />
    );
  }

  if (isUnauthenticated) {
    return <OnboardingRecoveryPanel variant="guest" callbackUrl={callbackUrl} />;
  }

  const resolvedUserName =
    authState === "pending" ? (session?.user?.name ?? userName) : userName;

  return <OnboardingForm userName={resolvedUserName} callbackUrl={callbackUrl} />;
}

type OnboardingErrorBoundaryProps = {
  children: ReactNode;
  callbackUrl: string;
};

type OnboardingErrorBoundaryState = {
  hasError: boolean;
};

class OnboardingErrorBoundary extends Component<
  OnboardingErrorBoundaryProps,
  OnboardingErrorBoundaryState
> {
  constructor(props: OnboardingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): OnboardingErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[auth/onboarding] client render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <OnboardingRecoveryPanel
          variant="error"
          callbackUrl={this.props.callbackUrl}
          onTryAgain={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

export default function OnboardingPageClient({
  userName,
  callbackUrl,
  authState,
  serverAlreadyOnboarded,
}: Readonly<{
  userName: string | null;
  callbackUrl: string;
  authState: OnboardingAuthState;
  serverAlreadyOnboarded: boolean;
}>) {
  return (
    <main className="relative flex min-h-screen min-h-dvh flex-col items-start justify-center overflow-x-hidden overflow-y-auto bg-gray-950 px-[max(0.75rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] text-gray-200 sm:items-center sm:px-[max(1rem,env(safe-area-inset-left))] sm:py-12 sm:pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-10 sm:right-[max(1rem,env(safe-area-inset-right))]">
        <LanguageSwitcher variant="dark" />
      </div>
      <OnboardingErrorBoundary callbackUrl={callbackUrl}>
        <OnboardingRouter
          authState={authState}
          callbackUrl={callbackUrl}
          userName={userName}
          serverAlreadyOnboarded={serverAlreadyOnboarded}
        />
      </OnboardingErrorBoundary>
    </main>
  );
}
