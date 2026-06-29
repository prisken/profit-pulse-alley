"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { updateContactNumber } from "@/lib/auth-actions";
import {
  ONBOARDING_PENDING_GRACE_MS,
  ONBOARDING_SESSION_LOAD_MS,
} from "@/lib/auth/onboarding-routes";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const inputClass = `w-full min-h-11 rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-base text-white placeholder:text-gray-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const primaryButtonClass = `w-full min-h-11 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export type OnboardingAuthState = "ready" | "pending";

function OnboardingForm({
  userName,
  callbackUrl,
}: Readonly<{ userName: string | null; callbackUrl: string }>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const { update } = useSession();

  const [contactNumber, setContactNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSyncFailed, setSessionSyncFailed] = useState(false);

  const retrySessionSync = useCallback(async () => {
    setSessionSyncFailed(false);
    setIsLoading(true);
    setError(null);

    try {
      await update();
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setSessionSyncFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [callbackUrl, router, update]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSessionSyncFailed(false);
    setIsLoading(true);

    try {
      const result = await updateContactNumber(contactNumber);

      if (!result.success) {
        setError(translateAuthMessage(locale, result.error));
        return;
      }

      try {
        await update();
        router.push(callbackUrl);
        router.refresh();
      } catch {
        setSessionSyncFailed(true);
      }
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  if (sessionSyncFailed) {
    return (
      <OnboardingRecoveryPanel
        variant="sessionSyncFailed"
        callbackUrl={callbackUrl}
        onTryAgain={() => void retrySessionSync()}
      />
    );
  }

  return (
    <div className="w-full max-w-sm">
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
          {t("auth.onboarding.body")}
        </p>
      </div>

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
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "onboarding-error" : undefined}
            className={inputClass}
          />
          <span className="mt-1.5 block text-center text-[11px] text-gray-500 sm:text-left sm:text-xs">
            {t("auth.onboarding.contactHint")}
          </span>
        </label>

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? t("auth.onboarding.saving") : t("auth.onboarding.continue")}
        </button>

        {error ? (
          <p id="onboarding-error" className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function OnboardingSessionSync({
  callbackUrl,
}: Readonly<{ callbackUrl: string }>) {
  const router = useRouter();
  const { update } = useSession();
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await update();
        if (!cancelled) {
          router.replace(callbackUrl);
          router.refresh();
        }
      } catch {
        if (!cancelled) {
          setSyncFailed(true);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [callbackUrl, router, update]);

  const retrySync = useCallback(async () => {
    setSyncFailed(false);
    try {
      await update();
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setSyncFailed(true);
    }
  }, [callbackUrl, router, update]);

  if (syncFailed) {
    return (
      <OnboardingRecoveryPanel
        variant="sessionSyncFailed"
        callbackUrl={callbackUrl}
        onTryAgain={() => void retrySync()}
      />
    );
  }

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

  const needsOnboarding = session?.user?.needsOnboarding;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isUnauthenticated = status === "unauthenticated";

  const alreadyOnboarded =
    serverAlreadyOnboarded ||
    (isAuthenticated && needsOnboarding === false);

  const showGuest =
    isUnauthenticated &&
    pendingGraceDone &&
    (authState === "ready" || sessionTimedOut);

  const showLoading =
    (isLoading && !sessionTimedOut) ||
    (authState === "pending" && isUnauthenticated && !pendingGraceDone);

  const handleTryAgain = useCallback(() => {
    setSessionTimedOut(false);
    window.location.reload();
  }, []);

  if (alreadyOnboarded) {
    return <OnboardingSessionSync callbackUrl={callbackUrl} />;
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
    <main className="relative flex min-h-screen min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-gray-950 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-gray-200 sm:px-4 sm:py-12">
      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 sm:right-4">
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
