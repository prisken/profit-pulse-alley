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
      className="border-t border-white/10 bg-zinc-900/50 px-3 py-6 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="live-events-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400/80 sm:text-sm sm:tracking-[0.2em] sm:text-amber-400/90">
            Live Events Hub
          </p>
          <h2
            id="live-events-heading"
            className="mt-1.5 text-lg font-bold tracking-tight text-white sm:mt-2 sm:text-3xl"
          >
            Fireside chats with real operators
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:mt-2 sm:text-sm sm:text-zinc-400">
            Complement your Market Pulse play with live expert conversations.
          </p>
        </header>

        <article
          className="mt-5 overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/8 via-zinc-900 to-zinc-950 shadow-lg sm:mt-10 sm:rounded-3xl sm:border-amber-500/20 sm:from-amber-500/10 sm:shadow-xl"
          aria-labelledby="upcoming-fireside-heading"
        >
          <div className="grid gap-0 md:grid-cols-2 md:gap-0">
            <div className="relative aspect-[16/10] min-h-[12rem] w-full sm:aspect-[4/5] sm:min-h-[280px] md:aspect-auto md:min-h-[420px]">
              <Image
                src={upcomingEvent.speakerHeadshotSrc}
                alt={upcomingEvent.speakerName}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-zinc-950/20"
                aria-hidden="true"
              />
            </div>

            <div className="flex flex-col justify-center p-4 sm:p-8 md:p-10 lg:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-xs sm:tracking-[0.18em]">
                Next Fireside Chat
              </p>
              <h3
                id="upcoming-fireside-heading"
                className="mt-2 text-xl font-bold text-white sm:mt-3 sm:text-3xl"
              >
                {upcomingEvent.speakerName}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-amber-300/90 sm:mt-1 sm:text-base">
                {upcomingEvent.speakerRole}
              </p>
              <p className="mt-2 line-clamp-3 text-pretty text-xs leading-relaxed text-zinc-300 sm:mt-4 sm:text-base">
                {upcomingEvent.topic}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-zinc-200 sm:mt-4 sm:text-base">
                <Calendar
                  className="h-3.5 w-3.5 shrink-0 text-amber-300 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                {upcomingEvent.date}
              </p>
              <Link
                href={upcomingEvent.registerHref}
                className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/95 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 sm:mt-6 sm:w-auto sm:border-0 sm:bg-white sm:px-8 sm:py-3.5 ${focusRing}`}
              >
                Register for Free
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-8 sm:mt-14">
          <h3 className="text-base font-semibold text-white sm:text-xl">
            What You&apos;ve Missed
          </h3>
          <ul className="mt-3 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {pastEvents.map((event) => (
              <li key={event.title}>
                <Link
                  href={event.archiveHref}
                  className={`group flex h-full flex-col rounded-xl border border-white/10 bg-zinc-950/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-zinc-950 hover:shadow-lg hover:shadow-amber-950/20 sm:rounded-2xl sm:p-6 ${focusRing}`}
                >
                  <h4 className="text-sm font-semibold leading-snug text-white group-hover:text-amber-100 sm:text-lg">
                    {event.title}
                  </h4>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-400 sm:mt-3 sm:text-sm">
                    {event.summary}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300/80 sm:mt-4 sm:text-[13px]">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                    {event.attendeeMetric}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
