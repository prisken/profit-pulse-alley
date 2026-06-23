import Image from "next/image";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";

import type { PastEventShowcase } from "@/lib/events/home-events-hub";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

export type LiveUpcomingEvent = {
  speakerName: string;
  speakerRole: string;
  speakerHeadshotSrc: string;
  topic: string;
  date: string;
  registerHref: string;
};

type LiveEventsHubSectionProps = Readonly<{
  upcomingEvent: LiveUpcomingEvent;
  pastEvents: PastEventShowcase[];
}>;

export default function LiveEventsHubSection({
  upcomingEvent,
  pastEvents,
}: LiveEventsHubSectionProps) {
  return (
    <section
      id="live-events-hub"
      className="border-t border-white/10 bg-zinc-900/50 px-3 py-10 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="live-events-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90 sm:text-sm">
            Live Events Hub
          </p>
          <h2
            id="live-events-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Fireside chats with real operators
          </h2>
        </header>

        <article
          className="mt-8 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 shadow-xl sm:mt-10"
          aria-labelledby="upcoming-fireside-heading"
        >
          <div className="grid gap-0 md:grid-cols-2 md:gap-0">
            <div className="relative aspect-[4/5] min-h-[280px] w-full md:aspect-auto md:min-h-[420px]">
              <Image
                src={upcomingEvent.speakerHeadshotSrc}
                alt={upcomingEvent.speakerName}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-zinc-950/20"
                aria-hidden="true"
              />
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
                Next Fireside Chat
              </p>
              <h3
                id="upcoming-fireside-heading"
                className="mt-3 text-2xl font-bold text-white sm:text-3xl"
              >
                {upcomingEvent.speakerName}
              </h3>
              <p className="mt-1 text-sm font-medium text-amber-300/90 sm:text-base">
                {upcomingEvent.speakerRole}
              </p>
              <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
                {upcomingEvent.topic}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-200 sm:text-base">
                <Calendar
                  className="h-4 w-4 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                {upcomingEvent.date}
              </p>
              <Link
                href={upcomingEvent.registerHref}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 sm:w-auto sm:px-8 sm:py-3.5 ${focusRing}`}
              >
                Register for Free
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-12 sm:mt-14">
          <h3 className="text-lg font-semibold text-white sm:text-xl">
            What You&apos;ve Missed
          </h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {pastEvents.map((event) => (
              <li key={event.title}>
                <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-950/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-zinc-950 hover:shadow-lg hover:shadow-amber-950/20 sm:p-6">
                  <h4 className="text-base font-semibold leading-snug text-white group-hover:text-amber-100 sm:text-lg">
                    {event.title}
                  </h4>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                    {event.summary}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300/80 sm:text-[13px]">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {event.attendeeMetric}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
