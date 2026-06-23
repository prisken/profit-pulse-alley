import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export default function FinalCtaSection() {
  return (
    <section
      className="border-t border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950 px-3 py-14 sm:px-6 sm:py-16 md:py-20"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h2
          id="final-cta-heading"
          className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
        >
          Ready to Test Your Instincts?
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
          Join Profit Pulse Ally to play Market Pulse, attend fireside chats, and
          compete for real prizes every cycle.
        </p>
        <Link
          href="/login"
          className={`mt-8 inline-flex w-full min-h-12 items-center justify-center rounded-full bg-white px-10 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-black/30 transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:min-w-[16rem] sm:text-lg ${focusRing}`}
        >
          Become a Member
        </Link>
      </div>
    </section>
  );
}
