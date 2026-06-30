"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { signUpWithPassword } from "@/lib/auth-actions";
import MarketPulseAuthPanel from "@/components/auth/MarketPulseAuthPanel";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { isMarketPulseAuthCallback } from "@/lib/auth/market-pulse-auth-context";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const inputClass = `w-full min-h-11 rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-base text-white placeholder:text-gray-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const primaryButtonClass = `w-full min-h-11 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

type AuthTab = "sign-in" | "create-account";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginForm() {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const fromMarketPulse = isMarketPulseAuthCallback(callbackUrl);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.needsOnboarding) {
      return;
    }

    const onboardingTarget = callbackUrl.startsWith("/auth/onboarding")
      ? callbackUrl
      : callbackUrl === "/" || callbackUrl === "/login"
        ? "/auth/onboarding"
        : `/auth/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    router.replace(onboardingTarget);
  }, [status, session, callbackUrl, router]);

  const [activeTab, setActiveTab] = useState<AuthTab>("sign-in");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpContactNumber, setSignUpContactNumber] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [magicLinkEmail, setMagicLinkEmail] = useState("");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);

  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isBusy =
    isGoogleLoading ||
    isCredentialsLoading ||
    isSignUpLoading ||
    isMagicLinkLoading;

  function switchTab(tab: AuthTab) {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    setEmailSent(false);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSuccess(null);
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(t("auth.error.googleStart"));
      setIsGoogleLoading(false);
    }
  }

  async function handleCredentialsSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const email = signInEmail.trim();
    if (!email) {
      setError(t("auth.error.emailRequired"));
      return;
    }

    if (!signInPassword) {
      setError(t("auth.error.passwordRequired"));
      return;
    }

    setIsCredentialsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password: signInPassword,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(t("auth.error.invalidCredentials"));
        return;
      }

      if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsCredentialsLoading(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    setIsSignUpLoading(true);
    try {
      const result = await signUpWithPassword({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        contactNumber: signUpContactNumber,
      });

      if (!result.success) {
        setError(translateAuthMessage(locale, result.error));
        return;
      }

      setSignInEmail(signUpEmail.trim());
      setSignInPassword("");
      setSignUpPassword("");
      setActiveTab("sign-in");
      setSuccess(translateAuthMessage(locale, result.message));
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsSignUpLoading(false);
    }
  }

  async function handleMagicLinkSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = magicLinkEmail.trim() || signInEmail.trim();
    if (!trimmed) {
      setError(t("auth.error.magicLinkEmailRequired"));
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      const result = await signIn("nodemailer", {
        email: trimmed,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(t("auth.error.magicLinkSend"));
        return;
      }

      setMagicLinkEmail(trimmed);
      setEmailSent(true);
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsMagicLinkLoading(false);
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
          {fromMarketPulse
            ? activeTab === "sign-in"
              ? t("auth.marketPulse.signIn.title")
              : t("auth.marketPulse.create.title")
            : activeTab === "sign-in"
              ? t("auth.login.welcomeBack")
              : t("auth.login.joinCommunity")}
        </h1>
        {!fromMarketPulse ? (
          <p className="mt-1.5 text-xs text-gray-400 sm:mt-2 sm:text-sm">
            {activeTab === "sign-in"
              ? t("auth.login.subtitleSignIn")
              : t("auth.login.subtitleCreate")}
          </p>
        ) : null}
      </div>

      {fromMarketPulse ? (
        <MarketPulseAuthPanel
          variant={activeTab === "create-account" ? "create-account" : "sign-in"}
          className="mt-5 sm:mt-6"
        />
      ) : null}

      <div
        className="mt-5 flex rounded-xl border border-gray-700 bg-gray-900/50 p-1 sm:mt-6"
        role="tablist"
        aria-label={t("auth.login.tablistAria")}
      >
        <button
          type="button"
          role="tab"
          id="tab-sign-in"
          aria-selected={activeTab === "sign-in"}
          aria-controls="panel-sign-in"
          onClick={() => switchTab("sign-in")}
          className={`min-h-11 flex-1 rounded-lg px-2 py-2 text-xs font-semibold leading-tight text-balance transition-colors sm:px-3 sm:py-2.5 sm:text-sm ${focusRing} ${
            activeTab === "sign-in"
              ? "bg-gray-800 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {t("auth.login.tabSignIn")}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-create-account"
          aria-selected={activeTab === "create-account"}
          aria-controls="panel-create-account"
          onClick={() => switchTab("create-account")}
          className={`min-h-11 flex-1 rounded-lg px-2 py-2 text-xs font-semibold leading-tight text-balance transition-colors sm:px-3 sm:py-2.5 sm:text-sm ${focusRing} ${
            activeTab === "create-account"
              ? "bg-gray-800 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {t("auth.login.tabCreate")}
        </button>
      </div>

        <div className="mt-4">
        {success ? (
          <div
            className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-center text-sm text-emerald-300 sm:mb-4 sm:px-4 sm:py-3"
            role="status"
          >
            {translateAuthMessage(locale, success)}
          </div>
        ) : null}

        <form
          id="panel-sign-in"
          role="tabpanel"
          aria-labelledby="tab-sign-in"
          hidden={activeTab !== "sign-in"}
          onSubmit={(e) => void handleCredentialsSignIn(e)}
          className="space-y-2.5 sm:space-y-3"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-400">
              {t("auth.login.email")}
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t("auth.login.placeholderEmail")}
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              disabled={isBusy}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-error" : undefined}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-400">
              {t("auth.login.password")}
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
                placeholder={t("auth.login.placeholderPassword")}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              disabled={isBusy}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-error" : undefined}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={isBusy}
            className={primaryButtonClass}
          >
            {isCredentialsLoading ? t("auth.login.signingIn") : t("auth.login.signIn")}
          </button>
        </form>

        <form
          id="panel-create-account"
          role="tabpanel"
          aria-labelledby="tab-create-account"
          hidden={activeTab !== "create-account"}
          onSubmit={(e) => void handleSignUp(e)}
          className="space-y-2.5 sm:space-y-3"
        >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {t("auth.login.name")}
              </span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder={t("auth.login.placeholderName")}
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {t("auth.login.email")}
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t("auth.login.placeholderEmail")}
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {t("auth.login.contactNumber")}
              </span>
              <input
                type="tel"
                name="contactNumber"
                autoComplete="tel"
                placeholder={t("auth.login.placeholderContact")}
                value={signUpContactNumber}
                onChange={(e) => setSignUpContactNumber(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {t("auth.login.password")}
              </span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder={t("auth.login.placeholderNewPassword")}
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className={primaryButtonClass}
            >
              {isSignUpLoading
                ? t("auth.login.creatingAccount")
                : t("auth.login.createAccount")}
            </button>
          </form>

        {error ? (
          <p id="auth-error" className="mt-2.5 text-center text-sm text-red-400" role="alert">
            {translateAuthMessage(locale, error)}
          </p>
        ) : null}
      </div>

      <div className="relative py-4 sm:py-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-950 px-3 text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
            {t("auth.login.orContinueWith")}
          </span>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isBusy}
          className={`flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-gray-600 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3 ${focusRing}`}
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          {isGoogleLoading ? t("auth.login.googleRedirecting") : t("auth.login.google")}
        </button>

        {emailSent ? (
          <div
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-center sm:px-4 sm:py-4"
            role="status"
          >
            <p className="text-sm font-medium text-emerald-300">
              {t("auth.login.checkEmailTitle")}
            </p>
            <p className="mt-1 text-xs text-gray-300 sm:text-sm">
              {t("auth.login.checkEmailBody").replace("{email}", magicLinkEmail)}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleMagicLinkSignIn(e)}
            className="space-y-2.5 sm:space-y-3"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {t("auth.login.magicLinkLabel")}
              </span>
              <input
                type="email"
                name="magicLinkEmail"
                autoComplete="email"
                placeholder={t("auth.login.placeholderEmail")}
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className={`min-h-11 w-full rounded-full border border-gray-600 bg-transparent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {isMagicLinkLoading
                ? t("auth.login.sendingLink")
                : t("auth.login.magicLinkSubmit")}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-gray-500 sm:mt-8 sm:text-xs">
        {t("auth.login.communityAgreement")}
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full min-w-0 max-w-sm text-center">
      <div className="mx-auto h-9 w-9 motion-reduce:animate-none animate-pulse rounded-sm bg-gray-800 sm:h-10 sm:w-10" />
      <div className="mx-auto mt-4 h-8 w-48 motion-reduce:animate-none animate-pulse rounded bg-gray-800" />
      <div className="mx-auto mt-2 h-4 w-64 motion-reduce:animate-none animate-pulse rounded bg-gray-800" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-start justify-center overflow-x-hidden overflow-y-auto bg-gray-950 px-[max(0.75rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] text-gray-200 sm:items-center sm:px-[max(1rem,env(safe-area-inset-left))] sm:py-12 sm:pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-10 sm:right-[max(1rem,env(safe-area-inset-right))]">
        <LanguageSwitcher variant="dark" />
      </div>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
