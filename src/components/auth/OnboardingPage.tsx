"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";

import { updateContactNumber } from "@/lib/auth-actions";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const inputClass = `w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 disabled:opacity-60 ${focusRing}`;

const primaryButtonClass = `w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

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
            className="h-10 w-10 rounded-sm"
            priority
          />
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
          One more step
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {userName ? `Welcome, ${userName}. ` : ""}
          Please add your contact number so we can reach you about events and
          Market Pulse prizes.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-8 space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-gray-400">
            Contact Number
          </span>
          <input
            type="tel"
            name="contactNumber"
            autoComplete="tel"
            placeholder="+852 9123 4567"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            disabled={isLoading}
            required
            className={inputClass}
          />
        </label>

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "Saving…" : "Continue"}
        </button>

        {error ? (
          <p className="text-center text-sm text-red-400" role="alert">
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
      <div className="mx-auto h-10 w-10 animate-pulse rounded-sm bg-gray-800" />
      <div className="mx-auto mt-5 h-8 w-40 animate-pulse rounded bg-gray-800" />
      <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-gray-800" />
    </div>
  );
}

export default function OnboardingPageClient({
  userName,
}: Readonly<{ userName: string | null }>) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 py-12 text-gray-200">
      <Suspense fallback={<OnboardingFormFallback />}>
        <OnboardingForm userName={userName} />
      </Suspense>
    </main>
  );
}
