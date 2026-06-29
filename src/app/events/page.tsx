import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

import { fortifySalesMarketingEvent } from "@/lib/events/fortify-sales-marketing";
import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";
import { getFortifySalesMarketingShowcase } from "@/lib/events/upcoming-event-display";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: `${translate(locale, "events.hub.title")} | Profit Pulse Ally`,
    description: translate(locale, "events.hub.subtitle"),
  };
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaPrimary =
  `inline-flex min-h-11 w-full items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:w-auto ${focusRing}`;

export default async function EventsHubPage() {
  const locale = await getServerSiteLocale();
  const upcoming = fortifySalesMarketingEvent;
  const upcomingShowcase = getFortifySalesMarketingShowcase(locale);

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
      <header className="text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {translate(locale, "events.hub.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75 sm:mt-3 sm:text-base">
          {translate(locale, "events.hub.subtitle")}
        </p>
      </header>

      <section
        id="upcoming-events"
        className="mt-6 border-t border-foreground/10 pt-6 sm:mt-10 sm:pt-10"
        aria-labelledby="upcoming-events-heading"
      >
        <h2
          id="upcoming-events-heading"
          className="text-base font-semibold text-foreground sm:text-xl"
        >
          {translate(locale, "events.hub.upcomingHeading")}
        </h2>
        <article className="mt-4 overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background shadow-sm sm:mt-6 sm:rounded-2xl">
          <div className="relative aspect-[4/3] max-h-[14rem] w-full bg-zinc-950 sm:aspect-[16/9] sm:max-h-none">
            <Image
              src="/images/fortify-hero-chess-king.png"
              alt={upcoming.heroImage?.alt ?? upcoming.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400 sm:text-xs">
              {translate(locale, "events.hub.comingSoon")}
            </p>
            <h3 className="mt-1.5 text-base font-bold text-foreground sm:mt-2 sm:text-xl">
              {upcomingShowcase.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/80 sm:mt-2 sm:text-base">
              {upcomingShowcase.blurb}
            </p>

            <dl className="mt-3 space-y-2 text-xs sm:mt-4 sm:text-sm">
              <div className="flex items-start gap-2">
                <Calendar
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                <dt className="sr-only">Date</dt>
                <dd className="font-medium text-foreground/90">
                  {upcomingShowcase.date}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                <dt className="sr-only">Location</dt>
                <dd className="font-medium text-foreground/90">
                  {upcomingShowcase.location}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link href="/events/fortify-sales-marketing" className={ctaPrimary}>
                {translate(locale, "events.hub.viewDetails")}
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section
        id="past-events"
        className="mt-6 border-t border-foreground/10 pt-6 sm:mt-10 sm:pt-10"
        aria-labelledby="past-events-heading"
      >
        <h2
          id="past-events-heading"
          className="text-base font-semibold text-foreground sm:text-xl"
        >
          {translate(locale, "events.hub.pastHeading")}
        </h2>
        <ul className="mt-3 space-y-2 sm:mt-4">
          <li>
            <Link
              href="/events/fortify-your-future"
              className={`block rounded-xl border border-foreground/10 bg-background p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02] sm:p-4 ${focusRing}`}
            >
              <p className="text-sm font-semibold text-foreground sm:text-base">
                {fortifyYourFutureEvent.title}
              </p>
              <p className="mt-1 text-xs text-foreground/60 sm:text-sm">
                {translate(locale, "events.hub.archivedClosed")}
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/events/wo-leung-yiu-dou-yiu"
              className={`block rounded-xl border border-foreground/10 bg-background p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02] sm:p-4 ${focusRing}`}
            >
              <p className="text-sm font-semibold text-foreground sm:text-base">
                《我兩樣都要》線下戰略會議
              </p>
              <p className="mt-1 text-xs text-foreground/60 sm:text-sm">
                {translate(locale, "events.hub.archivedClosed")}
              </p>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
