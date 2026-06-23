"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { signUpWithPassword } from "@/lib/auth-actions";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const inputClass = `w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 disabled:opacity-60 ${focusRing}`;

const primaryButtonClass = `w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

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
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

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
      setError("Could not start Google sign-in. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  async function handleCredentialsSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const email = signInEmail.trim();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!signInPassword) {
      setError("Please enter your password.");
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
        setError("Invalid email or password.");
        return;
      }

      if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
        setError(result.error);
        return;
      }

      setSignInEmail(signUpEmail.trim());
      setSignInPassword("");
      setSignUpPassword("");
      setActiveTab("sign-in");
      setSuccess(result.message);
    } catch {
      setError("Something went wrong. Please try again.");
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
      setError("Please enter your email address for the magic link.");
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
        setError(
          "Could not send sign-in link. Please check your email and try again.",
        );
        return;
      }

      setMagicLinkEmail(trimmed);
      setEmailSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Profit Pulse Ally home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-sm"
            priority
          />
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
          {activeTab === "sign-in" ? "Welcome back" : "Join the community"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {activeTab === "sign-in"
            ? "Sign in to your Profit Pulse Ally membership"
            : "Create your Profit Pulse Ally account"}
        </p>
      </div>

      <div
        className="mt-8 flex rounded-xl border border-gray-700 bg-gray-900/50 p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          id="tab-sign-in"
          aria-selected={activeTab === "sign-in"}
          aria-controls="panel-sign-in"
          onClick={() => switchTab("sign-in")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${focusRing} ${
            activeTab === "sign-in"
              ? "bg-gray-800 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          id="tab-create-account"
          aria-selected={activeTab === "create-account"}
          aria-controls="panel-create-account"
          onClick={() => switchTab("create-account")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${focusRing} ${
            activeTab === "create-account"
              ? "bg-gray-800 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Create Account
        </button>
      </div>

      <div className="mt-5">
        {success ? (
          <div
            className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300"
            role="status"
          >
            {success}
          </div>
        ) : null}

        {activeTab === "sign-in" ? (
          <form
            id="panel-sign-in"
            role="tabpanel"
            aria-labelledby="tab-sign-in"
            onSubmit={(e) => void handleCredentialsSignIn(e)}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Password
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className={primaryButtonClass}
            >
              {isCredentialsLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form
            id="panel-create-account"
            role="tabpanel"
            aria-labelledby="tab-create-account"
            onSubmit={(e) => void handleSignUp(e)}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Name
              </span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Contact Number
              </span>
              <input
                type="tel"
                name="contactNumber"
                autoComplete="tel"
                placeholder="+852 9123 4567"
                value={signUpContactNumber}
                onChange={(e) => setSignUpContactNumber(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Password
              </span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
              {isSignUpLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        {error ? (
          <p className="mt-3 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-950 px-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            or continue with
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isBusy}
          className={`flex w-full items-center justify-center gap-3 rounded-full border border-gray-600 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          {isGoogleLoading ? "Redirecting…" : "Sign in with Google"}
        </button>

        {emailSent ? (
          <div
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-center"
            role="status"
          >
            <p className="text-sm font-medium text-emerald-300">Check your email</p>
            <p className="mt-1 text-sm text-gray-300">
              We sent a sign-in link to{" "}
              <span className="font-medium text-white">{magicLinkEmail}</span>.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleMagicLinkSignIn(e)}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">
                Email for magic link
              </span>
              <input
                type="email"
                name="magicLinkEmail"
                autoComplete="email"
                placeholder="you@example.com"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                disabled={isBusy}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className={`w-full rounded-full border border-gray-600 bg-transparent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {isMagicLinkLoading ? "Sending link…" : "Sign in with Email"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        By signing in, you agree to join the Profit Pulse Ally community.
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto h-10 w-10 animate-pulse rounded-sm bg-gray-800" />
      <div className="mx-auto mt-5 h-8 w-48 animate-pulse rounded bg-gray-800" />
      <div className="mx-auto mt-2 h-4 w-64 animate-pulse rounded bg-gray-800" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 py-12 text-gray-200">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
