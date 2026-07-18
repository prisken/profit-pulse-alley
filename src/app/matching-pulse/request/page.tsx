import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import MatchingPulseRequestForm from "@/components/matching-pulse/MatchingPulseRequestForm";
import {
  buildMatchingPulseRequestPath,
  getMatchingPulseRequestCreateInitialSource,
  isMatchingPulseWorkshopSource,
} from "@/lib/matching-pulse/create-source";
import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_OBSIDIAN_BG,
  MP_TERMINAL_PANEL,
} from "@/lib/market-pulse/visual-primitives";

export const metadata: Metadata = {
  title: "Post a Matching Pulse request | Profit Pulse Ally",
  description:
    "Tell us what you need, what you can offer, or who you would like to meet. PPA will review your Matching Pulse request before making any introduction.",
};

type MatchingPulseRequestPageProps = Readonly<{
  searchParams: Promise<{ source?: string | string[] }>;
}>;

function formatPosterLabel(
  name: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmedName = name?.trim() || null;
  const trimmedEmail = email?.trim() || null;

  if (trimmedName && trimmedEmail) {
    return `${trimmedName} (${trimmedEmail})`;
  }
  return trimmedName ?? trimmedEmail;
}

export default async function MatchingPulseRequestPage({
  searchParams,
}: MatchingPulseRequestPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    const callbackPath = buildMatchingPulseRequestPath(params);
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const source = getMatchingPulseRequestCreateInitialSource(params);
  const posterLabel = formatPosterLabel(session.user.name, session.user.email);
  const showWorkshopNote = isMatchingPulseWorkshopSource(source);

  return (
    <main
      className={mergeMpClasses(
        MP_OBSIDIAN_BG,
        "relative isolate overflow-x-hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-8%,rgba(0,230,118,0.06),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl px-3 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-zinc-400">
          <Link
            href={
              source === "direct"
                ? "/matching-pulse"
                : `/matching-pulse?source=${encodeURIComponent(source)}`
            }
            className={mergeMpClasses(
              "text-zinc-300 underline-offset-2 hover:text-white hover:underline",
              MP_FOCUS_RING,
              "rounded-sm",
            )}
          >
            Matching Pulse
          </Link>
          <span className="mx-2 text-zinc-600" aria-hidden="true">
            /
          </span>
          <span className="text-zinc-200">Request</span>
        </p>

        <header className="mt-4 sm:mt-5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Post a Matching Pulse request
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Tell us what you need, what you can offer, or who you would like to
            meet. PPA will review your request before making any introduction.
          </p>
          {showWorkshopNote ? (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-mp-pulse/90 sm:text-[15px]">
              Joining from a PPA workshop? Submit your request here and PPA will
              review it after the session.
            </p>
          ) : null}
        </header>

        <div
          className={mergeMpClasses(
            MP_TERMINAL_PANEL,
            "mt-6 p-4 sm:mt-8 sm:p-6",
          )}
        >
          <MatchingPulseRequestForm
            source={source}
            posterLabel={posterLabel}
          />
        </div>
      </div>
    </main>
  );
}
