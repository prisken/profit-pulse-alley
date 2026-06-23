import { Quote } from "lucide-react";

import { CLIENT_TESTIMONIALS } from "@/lib/home/testimonials";

export default function HomeTestimonials() {
  return (
    <section
      id="testimonials"
      className="border-t border-white/10 bg-zinc-950 py-10 sm:py-12 md:py-14"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="testimonials-heading"
            className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            What Our Community Says
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Founders and investors sharing how Profit Pulse Ally sharpened their
            thinking — at fireside chats, in the game, and in the community.
          </p>
        </header>

        <ul className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3 md:gap-5">
          {CLIENT_TESTIMONIALS.map((testimonial) => (
            <li key={testimonial.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <Quote
                  className="h-5 w-5 text-amber-400/70"
                  aria-hidden="true"
                />
                <blockquote className="mt-3 flex-1">
                  <p className="text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="mt-5 border-t border-white/8 pt-4">
                  <p className="text-sm font-semibold text-white">
                    {testimonial.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 sm:text-[13px]">
                    {testimonial.role}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
