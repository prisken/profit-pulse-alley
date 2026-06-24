"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";

import { updateContactNumber } from "@/lib/auth-actions";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const inputClass = `w-full min-h-11 rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-base text-white placeholder:text-gray-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const primaryButtonClass = `w-full min-h-11 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

function OnboardingForm({ userName }: Readonly<{ userName: string | null }>) {
  const router = useRouter();
  const { update } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

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
        setError(result.error);
        return;
      }

      await update();
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
            className="h-9 w-9 rounded-sm sm:h-10 sm:w-10"
            priority
          />
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-white sm:mt-5 sm:text-2xl">
          One more step
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {userName ? (
            <>
              Welcome, <span className="font-medium text-gray-200">{userName}</span>.
            </>
          ) : null}{" "}
          Add your contact number so we can reach you about events and Market Pulse
          prizes.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-6 space-y-3 sm:mt-8 sm:space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-400">
            Contact Number
          </span>
          <input
            type="tel"
            name="contactNumber"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+852 9123 4567"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            disabled={isLoading}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "onboarding-error" : undefined}
            className={inputClass}
          />
          <span className="mt-1.5 block text-center text-[11px] text-gray-500 sm:text-left sm:text-xs">
            Include country code if outside Hong Kong.
          </span>
        </label>

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "Saving…" : "Continue"}
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

function OnboardingFormFallback() {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto h-9 w-9 animate-pulse rounded-sm bg-gray-800 sm:h-10 sm:w-10" />
      <div className="mx-auto mt-4 h-8 w-40 animate-pulse rounded bg-gray-800" />
      <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-gray-800" />
    </div>
  );
}

export default function OnboardingPageClient({
  userName,
}: Readonly<{ userName: string | null }>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-gray-950 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-gray-200 sm:px-4 sm:py-12">
      <Suspense fallback={<OnboardingFormFallback />}>
        <OnboardingForm userName={userName} />
      </Suspense>
    </main>
  );
}
