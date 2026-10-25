import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";

import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";
import {
  WEBINAR_SERIES_2026,
  formatEnDate,
  formatZhDate,
} from "@/lib/events/webinar-series-2026";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import CommunityPartnersSection from "@/components/home/CommunityPartnersSection";
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

const AI_COPILOT_SESSIONS = [
  { date: "Wed 16 Sep · 星期三", venue: "WeWork Lee Garden" },
  { date: "Wed 23 Sep · 星期三", venue: "WeWork YF Life Tower" },
  { date: "Tue 29 Sep · 星期二", venue: "WeWork Cityplaza Taikoo" },
];

export default async function EventsHubPage() {
  const locale = await getServerSiteLocale();

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
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-foreground/70 sm:text-sm">
          {locale === "zh-Hant"
            ? "八場星期六網上研討會，2026 年 11 月 7 日至 12 月 26 日。每場聚焦一個香港實務題目，設有獨立報名頁。"
            : "Eight Saturday webinars, 7 November – 26 December 2026. Each session focuses on one Hong Kong planning problem, with its own registration page."}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {WEBINAR_SERIES_2026.map((event) => {
            const published = event.week <= 4;
            const card = (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                    W{event.week}
                  </span>
                  <span className="text-[11px] text-foreground/50">
                    {locale === "zh-Hant"
                      ? formatZhDate(event.date)
                      : formatEnDate(event.date)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                  {locale === "zh-Hant" ? event.topicZh : event.topicEn}
                </p>
                <p className="mt-0.5 text-xs text-foreground/60 sm:text-sm">
                  {locale === "zh-Hant" ? event.targetZh : event.targetEn}
                </p>
                <span className="mt-2 inline-block text-[11px] font-semibold text-foreground/70">
                  {published
                    ? locale === "zh-Hant"
                      ? "詳情及報名 →"
                      : "Details & registration →"
                    : locale === "zh-Hant"
                      ? "詳情稍後公布"
                      : "Details coming soon"}
                </span>
              </>
            );
            return (
              <li key={event.slug}>
                {published ? (
                  <Link
                    href={`/events/${event.slug}`}
                    className={`block h-full rounded-xl border border-foreground/10 bg-background p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02] sm:p-4 ${focusRing}`}
                  >
                    {card}
                  </Link>
                ) : (
                  <div className="block h-full rounded-xl border border-foreground/10 bg-background p-3 opacity-60 sm:p-4">
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
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
              href="/events/fortify-sales-marketing"
              className={`block rounded-xl border border-foreground/10 bg-background p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02] sm:p-4 ${focusRing}`}
            >
              <p className="text-sm font-semibold text-foreground sm:text-base">
                Fortify Your Future (Lunch &amp; Learn) / 守業增值創未來（Lunch &amp; Learn）
              </p>
              <p className="mt-1 text-xs text-foreground/60 sm:text-sm">
                {translate(locale, "events.hub.archivedClosed")}
              </p>
            </Link>
          </li>
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
                  <li>
            <div className="rounded-xl border border-foreground/10 bg-background p-3 sm:p-4">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                AI Copilot Lunch &amp; Learn — Secure &amp; Cost effective AI Gateway
              </p>
              <p className="mt-1 text-xs text-foreground/60 sm:text-sm">
                16 / 23 / 29 September 2026 · WeWork Hong Kong
              </p>
            </div>
          </li>
</ul>
      </section>

      {/* Venues & Event Partners */}
      <section
        className="mt-6 border-t border-foreground/10 pt-6 sm:mt-10 sm:pt-10"
        aria-labelledby="partners-heading"
      >
        <h2
          id="partners-heading"
          className="text-base font-semibold text-foreground sm:text-xl"
        >
          {translate(locale, "events.partners.heading")}
        </h2>
        <CommunityPartnersSection />
      </section>
    </main>
  );
}
