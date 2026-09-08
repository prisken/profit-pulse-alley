import Link from "next/link";
import { Calendar } from "lucide-react";

import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";
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
        <article className="mt-4 overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background p-4 shadow-sm sm:mt-6 sm:rounded-2xl sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400 sm:text-xs">
            AI Copilot Lunch &amp; Learn Series · 午餐研討會系列
          </p>
          <h3 className="mt-1.5 text-base font-bold text-foreground sm:mt-2 sm:text-xl">
            AI Copilot Lunch &amp; Learn — Secure &amp; Cost effective AI Gateway
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground sm:text-base">
            Is your team leaking sensitive data while using AI?
          </p>

          <p className="mt-3 text-xs leading-relaxed text-foreground/80 sm:mt-4 sm:text-sm">
            Three Hong Kong sessions, 12:30–14:00 each:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-foreground/80 sm:text-sm">
            {AI_COPILOT_SESSIONS.map((s) => (
              <li key={s.date} className="flex items-start gap-2">
                <Calendar
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-semibold text-foreground/90">{s.date}</span>
                  <span className="mx-2 text-foreground/40">·</span>
                  {s.venue}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-foreground/80 sm:mt-4 sm:text-sm">
            Live demos: a data-redaction AI gateway (employee prompts get PII
            masked before public LLMs) and a smart LLM router with semantic
            caching (roughly 70–90% lower API cost). Walk away with a 3-Tier
            Safe AI Architecture blueprint and a 30-day roadmap.
          </p>

          <div className="mt-4 border-t border-foreground/10 pt-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
            <p>
              WeWork 會員：於 WeWork App 內報名{" "}
              <span className="text-foreground/50">
                (Book your seat via the WeWork app)
              </span>
            </p>
            <p className="mt-1.5">
              活動以 WeWork 會員為主，非會員可先 follow 我哋留意之後嘅公開場次
              <span className="text-foreground/50">
                {" "}(Non-member? Follow us for future public sessions)
              </span>
            </p>
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
