import Link from "next/link";

import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_OBSIDIAN_BG,
  MP_PRIMARY_BTN,
  MP_TERMINAL_PANEL,
} from "@/lib/market-pulse/visual-primitives";

const secondaryCtaClass = mergeMpClasses(
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.04] active:bg-white/[0.06] sm:min-h-12 sm:px-6",
  MP_FOCUS_RING,
);

type MatchingPulseSuccessPageProps = Readonly<{
  /** Own request title only — never admin notes or other users' data. */
  confirmedTitle?: string | null;
}>;

export default function MatchingPulseSuccessPage({
  confirmedTitle = null,
}: MatchingPulseSuccessPageProps) {
  return (
    <main
      className={mergeMpClasses(
        MP_OBSIDIAN_BG,
        "relative isolate overflow-x-hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-8%,rgba(0,230,118,0.07),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl px-3 py-10 sm:px-6 sm:py-14">
        <div
          className={mergeMpClasses(
            MP_TERMINAL_PANEL,
            "px-4 py-8 text-center sm:px-8 sm:py-10",
          )}
        >
          <p
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-mp-pulse/30 bg-mp-pulse/10 font-mono text-lg font-semibold text-mp-pulse"
            aria-hidden="true"
          >
            ✓
          </p>

          <h1 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-white sm:mt-6 sm:text-3xl">
            Your Matching Pulse request has been received.
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-zinc-400 sm:mt-5 sm:text-[15px]">
            Thank you for sharing your collaboration request. PPA will review it
            and may contact you if we see a relevant opportunity or need more
            details.
          </p>

          {confirmedTitle ? (
            <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-300">
              Request:{" "}
              <span className="font-medium text-white">{confirmedTitle}</span>
            </p>
          ) : null}

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/matching-pulse/my-requests"
              className={mergeMpClasses(
                MP_PRIMARY_BTN,
                "min-h-11 px-5 py-2.5 text-sm sm:min-h-12 sm:px-6",
                MP_FOCUS_RING,
              )}
            >
              View my requests
            </Link>
            <Link href="/market-pulse/play" className={secondaryCtaClass}>
              Play Market Pulse
            </Link>
            <Link href="/events" className={secondaryCtaClass}>
              View events
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
