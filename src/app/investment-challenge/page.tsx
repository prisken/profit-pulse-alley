import Link from "next/link";
import { Swords } from "lucide-react";

export const metadata = {
  title: "Investment Challenge | Profit Pulse Ally",
};

export default function InvestmentChallengeComingSoonPage() {
  return (
    <main className="flex min-h-[calc(100dvh-1px)] flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-50">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
          <Swords className="h-7 w-7 animate-pulse text-white/90" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          The Investment Challenge
        </h1>
        <p className="mt-3 text-pretty text-lg font-medium text-zinc-200">
          Prove Your Skills. Win Your Seat.
        </p>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-zinc-300">
          The &apos;Investment Challenge&apos; is your chance to earn a
          complimentary ticket to our exclusive &apos;我兩樣都要&apos; founder&apos;s
          meetup. The game is launching soon.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            Notify Me
          </button>

          <Link
            href="/event"
            className="text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
          >
            Or, secure your spot now -&gt;
          </Link>
        </div>
      </section>
    </main>
  );
}

