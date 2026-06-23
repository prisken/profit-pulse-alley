import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Users } from "lucide-react";

import type {
  PastEventShowcase,
  UpcomingEventShowcase,
} from "@/lib/events/home-events-hub";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type HomeEventsHubProps = Readonly<{
  upcomingEvent: UpcomingEventShowcase;
  pastEvents: PastEventShowcase[];
}>;

export default function HomeEventsHub({
  upcomingEvent,
  pastEvents,
}: HomeEventsHubProps) {
  const primarySpeaker = upcomingEvent.speakers[0];
  const additionalSpeakers = upcomingEvent.speakers.slice(1);

  return (
    <section
      id="events-hub"
      className="border-t border-white/10 bg-zinc-950 py-10 sm:py-14 md:py-16"
      aria-labelledby="events-hub-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90 sm:text-sm">
            Events Hub
          </p>
          <h2
            id="events-hub-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Learn from founders. Connect in person.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Fireside chats, strategic roundtables, and curated networking for
            Hong Kong&apos;s next generation of investors and builders.
          </p>
        </header>

        {/* Upcoming event */}
        <article
          className="relative mt-8 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/12 via-zinc-900/90 to-zinc-950 shadow-xl shadow-black/25 sm:mt-10 sm:rounded-3xl"
          aria-labelledby="upcoming-event-heading"
        >
          <div
            className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-8 md:p-8 lg:p-10">
            <div className="flex flex-col items-center gap-4 md:items-start">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
                Upcoming event
              </p>

              <div className="flex items-center gap-3 sm:gap-4">
                {primarySpeaker ? (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-zinc-900 shadow-lg shadow-black/30 sm:h-28 sm:w-28">
                    <Image
                      src={primarySpeaker.headshotSrc}
                      alt={primarySpeaker.name}
                      fill
                      className="object-cover object-center"
                      sizes="112px"
                    />
                  </div>
                ) : null}

                {additionalSpeakers.length > 0 ? (
                  <div className="flex -space-x-3">
                    {additionalSpeakers.map((speaker) => (
                      <div
                        key={speaker.name}
                        className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-zinc-950 bg-zinc-900 shadow-md sm:h-[4.5rem] sm:w-[4.5rem]"
                      >
                        <Image
                          src={speaker.headshotSrc}
                          alt={speaker.name}
                          fill
                          className="object-cover object-center"
                          sizes="72px"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-amber-200/90">
                  {upcomingEvent.speakers.map((s) => s.name).join(" & ")}
                </p>
                {primarySpeaker?.role ? (
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    {upcomingEvent.speakers
                      .map((s) => s.role)
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <h3
                id="upcoming-event-heading"
                className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                {upcomingEvent.title}
              </h3>

              <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 sm:text-base">
                <Calendar
                  className="h-4 w-4 shrink-0 text-amber-300/90"
                  aria-hidden="true"
                />
                <span>{upcomingEvent.date}</span>
              </p>

              <Link
                href={upcomingEvent.registerHref}
                className={`inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-md transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:px-8 sm:py-3.5 ${focusRing}`}
              >
                Register for Free
              </Link>
            </div>
          </div>
        </article>

        {/* Past events */}
        <div className="mt-12 sm:mt-14">
          <h3
            id="past-events-heading"
            className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            What You&apos;ve Missed
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Catch up on highlights from previous fireside chats and strategic
            sessions.
          </p>

          <ul
            className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            aria-labelledby="past-events-heading"
          >
            {pastEvents.map((event) => (
              <li key={event.title}>
                <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:p-6">
                  <h4 className="text-base font-semibold leading-snug text-white sm:text-lg">
                    {event.title}
                  </h4>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                    {event.summary}
                  </p>

                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300/90 sm:text-[13px]">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {event.attendeeMetric}
                  </p>

                  <Link
                    href={event.archiveHref}
                    className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-200 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`}
                  >
                    View archive
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
