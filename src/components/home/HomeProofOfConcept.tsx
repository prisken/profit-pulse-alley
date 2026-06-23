import Image from "next/image";
import Link from "next/link";

import {
  EXPERTS_SHOWCASE,
  INVESTMENT_PHILOSOPHY,
} from "@/lib/home/proof-of-concept";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export default function HomeProofOfConcept() {
  return (
    <section
      id="proof-of-concept"
      className="border-t border-white/10 bg-zinc-900/30 py-10 sm:py-14 md:py-16"
      aria-labelledby="proof-of-concept-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90 sm:text-sm">
            Proof of Concept
          </p>
          <h2
            id="proof-of-concept-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Our Investment Philosophy
          </h2>
          <p className="mt-4 text-pretty text-base font-semibold leading-relaxed text-zinc-100 sm:text-lg sm:leading-relaxed">
            {INVESTMENT_PHILOSOPHY}
          </p>
        </header>

        <div className="mt-12 sm:mt-14">
          <div className="mx-auto max-w-2xl text-center">
            <h3
              id="experts-heading"
              className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
            >
              Learn From Proven Leaders
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              The operators and authors behind our fireside chats — bringing
              real-world playbooks to every session and simulation.
            </p>
          </div>

          <ul
            className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-2 md:gap-6"
            aria-labelledby="experts-heading"
          >
            {EXPERTS_SHOWCASE.map((expert) => (
              <li key={expert.name}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:flex-row">
                  <div className="relative aspect-[4/5] w-full shrink-0 sm:aspect-auto sm:w-44 md:w-48">
                    <Image
                      src={expert.headshotSrc}
                      alt={expert.name}
                      fill
                      className={`object-cover ${
                        expert.imageObjectPosition === "top"
                          ? "object-top"
                          : "object-center"
                      }`}
                      sizes="(max-width: 768px) 100vw, 192px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                    <h4 className="text-lg font-semibold text-white">
                      {expert.name}
                    </h4>
                    <p className="mt-0.5 text-sm font-medium text-amber-400/90">
                      {expert.title}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                      {expert.bio}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
            <Link
              href="/events/fortify-your-future"
              className={`inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:px-8 ${focusRing}`}
            >
              Join the Next Fireside Chat
            </Link>
            <Link
              href="/concept"
              className={`inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/15 sm:w-auto sm:px-8 ${focusRing}`}
            >
              Explore The Concept
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
