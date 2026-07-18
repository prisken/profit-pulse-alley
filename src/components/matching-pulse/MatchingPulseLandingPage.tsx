import Link from "next/link";

import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_OBSIDIAN_BG,
  MP_PRIMARY_BTN,
  MP_PULSE_ACCENT_BADGE,
  MP_TERMINAL_PANEL,
} from "@/lib/market-pulse/visual-primitives";

const HOW_IT_WORKS = [
  "Post your request",
  "PPA reviews",
  "Warm intro if there is a fit",
] as const;

const EXAMPLE_REQUESTS = [
  "Marketing partner",
  "Website / automation support",
  "Venue partner",
  "Event collaborator",
  "Client intro",
] as const;

const secondaryCtaClass = mergeMpClasses(
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.04] active:bg-white/[0.06] sm:min-h-12 sm:px-6",
  MP_FOCUS_RING,
);

type MatchingPulseLandingPageProps = Readonly<{
  requestHref: string;
  /** Lunch & Learn / WeWork rollout note when `?source=wework…`. */
  showWorkshopNote?: boolean;
}>;

export default function MatchingPulseLandingPage({
  requestHref,
  showWorkshopNote = false,
}: MatchingPulseLandingPageProps) {
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

      <section
        className="relative px-3 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12 md:pt-14"
        aria-labelledby="matching-pulse-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={mergeMpClasses(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]",
              MP_PULSE_ACCENT_BADGE,
            )}
          >
            Pilot
          </p>

          <h1
            id="matching-pulse-heading"
            className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:mt-5 sm:text-4xl md:text-5xl"
          >
            Matching Pulse
          </h1>

          <p className="mt-3 text-pretty text-base text-zinc-300 sm:mt-4 sm:text-lg">
            Turn conversations into collaborations.
          </p>

          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:mt-5 sm:text-[15px]">
            Post a business need, offer, or partnership idea. PPA reviews
            requests and may help connect relevant members, event attendees, and
            business partners.
          </p>

          {showWorkshopNote ? (
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-mp-pulse/90 sm:mt-5 sm:text-[15px]">
              Joining from a PPA workshop? Submit your request here and PPA will
              review it after the session.
            </p>
          ) : null}

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href={requestHref}
              className={mergeMpClasses(
                MP_PRIMARY_BTN,
                "min-h-11 px-5 py-2.5 text-sm sm:min-h-12 sm:px-6",
                MP_FOCUS_RING,
              )}
            >
              Post a collaboration request
            </Link>
            <Link href="/matching-pulse/my-requests" className={secondaryCtaClass}>
              View my requests
            </Link>
          </div>
        </div>
      </section>

      <section
        className="relative border-t border-white/[0.08] px-3 py-8 sm:px-6 sm:py-10"
        aria-labelledby="matching-pulse-how-heading"
      >
        <div className="mx-auto max-w-2xl">
          <h2
            id="matching-pulse-how-heading"
            className="text-center text-lg font-semibold tracking-tight text-white sm:text-xl"
          >
            How it works
          </h2>

          <ol className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step} className="flex items-start gap-3 sm:gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-mp-pulse/25 bg-mp-pulse/10 font-mono text-xs font-semibold tabular-nums text-mp-pulse sm:h-9 sm:w-9 sm:text-sm"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="pt-1.5 text-sm text-zinc-300 sm:pt-2 sm:text-base">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="relative border-t border-white/[0.08] px-3 py-8 sm:px-6 sm:py-10"
        aria-labelledby="matching-pulse-examples-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="matching-pulse-examples-heading"
            className="text-lg font-semibold tracking-tight text-white sm:text-xl"
          >
            Example requests
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Ideas members might post — not guarantees of a match.
          </p>

          <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:mt-6 sm:gap-2.5">
            {EXAMPLE_REQUESTS.map((label) => (
              <li
                key={label}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 sm:text-sm"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="relative border-t border-white/[0.08] px-3 py-8 sm:px-6 sm:pb-14 sm:pt-10"
        aria-labelledby="matching-pulse-trust-heading"
      >
        <div className="mx-auto max-w-2xl">
          <div
            className={mergeMpClasses(
              MP_TERMINAL_PANEL,
              "px-4 py-4 text-center sm:px-6 sm:py-5",
            )}
          >
            <h2 id="matching-pulse-trust-heading" className="sr-only">
              Privacy and curation
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              Matching Pulse is curated. We do not publicly expose your contact
              details, and we review requests before making introductions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
