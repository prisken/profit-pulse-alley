import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export default function FinalCtaSection() {
  return (
    <section
      className="border-t border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950 px-3 py-8 sm:px-6 sm:py-16 md:py-20"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h2
          id="final-cta-heading"
          className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
        >
          Save your scores. Compete every cycle.
        </h2>
        <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-zinc-400 sm:mt-4 sm:max-w-xl sm:text-base">
          Create a free Profit Pulse Ally account to lock in your Market Pulse
          reads, track your rank, and get event invites.
        </p>
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:gap-3">
          <Link
            href="/login"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-black/30 transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:min-h-12 sm:min-w-[14rem] sm:px-10 sm:py-3.5 sm:text-lg ${focusRing}`}
          >
            Become a Member
          </Link>
          <Link
            href="/market-pulse"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 sm:min-h-12 sm:min-w-[12rem] sm:py-3.5 ${focusRing}`}
          >
            Play without signing up
          </Link>
        </div>
      </div>
    </section>
  );
}
