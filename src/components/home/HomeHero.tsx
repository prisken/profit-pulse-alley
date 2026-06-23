"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Clock, Gamepad2, Mic2, Sparkles } from "lucide-react";

import { getChallengeCountdown } from "@/lib/market-pulse/challenge-cycle";
import type { ChallengeCountdown } from "@/lib/market-pulse/types";

export type UpcomingEventHero = {
  speakerName: string;
  topic: string;
  date: string;
  href: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type HomeHeroProps = Readonly<{
  upcomingEvent: UpcomingEventHero;
}>;

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center rounded-xl border border-white/10 bg-zinc-950/60 px-2 py-2.5 sm:min-w-[4rem] sm:px-3 sm:py-3">
      <span className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {padUnit(value)}
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

function ChallengeCountdown({
  initial,
}: Readonly<{ initial: ChallengeCountdown }>) {
  const [countdown, setCountdown] = useState(initial);

  useEffect(() => {
    const tick = () => setCountdown(getChallengeCountdown());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/90">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Cycle ends in</span>
      </div>
      <div
        className="flex flex-wrap gap-2 sm:gap-2.5"
        role="timer"
        aria-live="polite"
        aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds remaining in this challenge cycle`}
      >
        <CountdownUnit label="Days" value={countdown.days} />
        <CountdownUnit label="Hours" value={countdown.hours} />
        <CountdownUnit label="Mins" value={countdown.minutes} />
        <CountdownUnit label="Secs" value={countdown.seconds} />
      </div>
    </div>
  );
}

export default function HomeHero({ upcomingEvent }: HomeHeroProps) {
  const initialCountdown = getChallengeCountdown();

  return (
    <section
      className="relative overflow-hidden border-b border-white/10 bg-zinc-950"
      aria-labelledby="home-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_20%_-10%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(251,191,36,0.08),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgb(9_9_11)_88%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-3 py-10 sm:px-6 sm:py-14 md:py-16 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
          {/* Part 1 — Investment Game Challenge */}
          <article className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/90 to-zinc-950 p-5 shadow-xl shadow-black/30 sm:rounded-3xl sm:p-7 md:p-8">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                Live challenge
              </div>

              <div className="space-y-3">
                <h1
                  id="home-hero-heading"
                  className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.6rem] md:leading-[1.1]"
                >
                  The 10-Day Investment Challenge
                </h1>
                <p className="max-w-xl text-pretty text-base leading-relaxed text-zinc-200 sm:text-lg">
                  <Sparkles
                    className="mr-1.5 inline h-4 w-4 -translate-y-px text-amber-300"
                    aria-hidden="true"
                  />
                  Play now for a chance to win{" "}
                  <span className="font-semibold text-amber-200">
                    Ocean Park tickets!
                  </span>
                </p>
              </div>

              <ChallengeCountdown initial={initialCountdown} />

              <div className="pt-1">
                <Link
                  href="/market-pulse"
                  className={`inline-flex w-full items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-300 active:bg-emerald-500 sm:w-auto sm:px-8 sm:py-3.5 sm:text-base ${focusRing}`}
                >
                  Play Now
                </Link>
              </div>
            </div>
          </article>

          {/* Part 2 — Upcoming Event */}
          <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:rounded-3xl sm:p-7 md:p-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/90">
              <Mic2 className="h-3.5 w-3.5" aria-hidden="true" />
              Upcoming
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              Next Fireside Chat
            </h2>

            <dl className="mt-5 flex flex-1 flex-col gap-4">
              <div className="rounded-xl border border-white/8 bg-zinc-950/50 px-4 py-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Guest speaker
                </dt>
                <dd className="mt-1 text-base font-medium text-white sm:text-lg">
                  {upcomingEvent.speakerName}
                </dd>
              </div>

              <div className="rounded-xl border border-white/8 bg-zinc-950/50 px-4 py-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Event topic
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                  {upcomingEvent.topic}
                </dd>
              </div>

              <div className="rounded-xl border border-white/8 bg-zinc-950/50 px-4 py-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Date
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-200 sm:text-base">
                  {upcomingEvent.date}
                </dd>
              </div>
            </dl>

            <div className="mt-6 pt-2">
              <Link
                href={upcomingEvent.href}
                className={`inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/15 sm:w-auto sm:px-8 ${focusRing}`}
              >
                Register for Free
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
