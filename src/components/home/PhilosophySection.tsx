import Image from "next/image";
import { Quote } from "lucide-react";

import {
  EXPERTS_SHOWCASE,
  INVESTMENT_PHILOSOPHY,
} from "@/lib/home/proof-of-concept";

export default function PhilosophySection() {
  return (
    <section
      id="philosophy"
      className="border-t border-white/10 bg-zinc-950 px-3 py-10 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="philosophy-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2 id="philosophy-heading" className="sr-only">
          Our Philosophy
        </h2>

        <figure className="relative mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 sm:px-10 sm:py-12 md:px-14 md:py-14">
          <Quote
            className="absolute left-5 top-5 h-10 w-10 text-amber-400/40 sm:left-8 sm:top-8 sm:h-12 sm:w-12"
            aria-hidden="true"
          />
          <blockquote className="relative text-center">
            <p className="text-pretty text-lg font-medium leading-relaxed text-zinc-100 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-relaxed">
              &ldquo;{INVESTMENT_PHILOSOPHY}&rdquo;
            </p>
          </blockquote>
        </figure>

        <div className="mt-12 sm:mt-14">
          <h3 className="text-center text-xl font-semibold tracking-tight text-white sm:text-2xl">
            The Minds Behind the Market Pulse
          </h3>
          <ul className="mt-8 flex flex-wrap justify-center gap-8 sm:mt-10 sm:gap-12 md:gap-16">
            {EXPERTS_SHOWCASE.map((expert) => (
              <li key={expert.name} className="flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-amber-400/40 ring-4 ring-amber-500/10 sm:h-28 sm:w-28 md:h-32 md:w-32">
                  <Image
                    src={expert.headshotSrc}
                    alt={expert.name}
                    fill
                    className={`object-cover ${
                      expert.imageObjectPosition === "top"
                        ? "object-top"
                        : "object-center"
                    }`}
                    sizes="128px"
                  />
                </div>
                <p className="mt-4 text-base font-semibold text-white sm:text-lg">
                  {expert.name}
                </p>
                <p className="mt-1 max-w-[14rem] text-xs leading-snug text-zinc-400 sm:text-sm">
                  {expert.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
