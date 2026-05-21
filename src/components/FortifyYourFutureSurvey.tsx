import React from "react";
import { Gift } from "lucide-react";

export default function FortifyYourFutureSurvey() {
  return (
    <main className="min-h-dvh bg-gray-950 text-gray-200">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="w-full text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Fortify Your Future
          </h1>
          <p className="mt-3 text-pretty text-base text-gray-300 sm:mt-4 sm:text-lg">
            A Fireside Chat on Business Defense &amp; Investment.
          </p>
          <div
            className="mx-auto mt-6 flex items-center justify-center gap-3 sm:mt-8"
            aria-hidden="true"
          >
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/80 sm:w-24" />
            <span className="text-amber-400">♞</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/80 sm:w-24" />
          </div>
        </header>

        {/* Hook */}
        <section className="mt-10 w-full text-center sm:mt-12">
          <h2 className="text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-[1.65rem]">
            Trapped in the daily grind?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-gray-300 sm:text-lg">
            When was the last time you stopped working{" "}
            <em className="font-medium text-amber-200/95 not-italic">in</em> your
            business to work{" "}
            <em className="font-medium text-amber-200/95 not-italic">on</em> it?
          </p>
        </section>

        {/* Invitation */}
        <section className="mt-10 w-full sm:mt-12">
          <p className="text-center text-pretty text-sm leading-relaxed text-gray-300 sm:text-base sm:leading-relaxed">
            We are planning an exclusive fireside chat with Vicky Huang (Co-founder
            of Zeppelin Hot Dog) and Marcy Chan (Bestselling Investment Author).
            Before we finalize the details, we want to ensure this event is tailored
            to you. Your feedback is crucial.
          </p>
        </section>

        {/* Survey embed */}
        <section
          className="mt-10 w-full sm:mt-12"
          aria-labelledby="survey-heading"
        >
          <div className="rounded-2xl border border-amber-400/25 bg-gray-900/80 px-4 py-8 shadow-[0_0_40px_rgba(251,191,36,0.06)] sm:px-8 sm:py-10">
            <h2
              id="survey-heading"
              className="text-center font-serif text-2xl font-semibold text-amber-400 sm:text-3xl"
            >
              Register Your Interest
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-gray-400">
              Share your preferences below — it only takes a few minutes.
            </p>

            <div className="mx-auto mt-8 flex w-full max-w-[640px] justify-center overflow-hidden rounded-lg border border-gray-700/80 bg-gray-800/50">
              {/*
<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSccdr1mmGQghuBYcQ6gy9QYqCCOZG_zw_RuyStHgeOiWGv7ug/viewform?embedded=true" width="640" height="1455" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
              */}
              <div
                className="flex min-h-[280px] w-full items-center justify-center px-6 py-12 text-center text-sm text-gray-500 sm:min-h-[320px]"
                role="status"
              >
                Paste the Google Form iframe in the placeholder comment above.
              </div>
            </div>
          </div>
        </section>

        {/* Incentive */}
        <section className="mt-10 w-full sm:mt-12">
          <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-950 px-5 py-6 text-center sm:px-8 sm:py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
              <Gift className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Bonus
            </p>
            <p className="mt-3 text-pretty text-base font-medium leading-relaxed text-gray-100 sm:text-lg">
              <span className="text-amber-300">BONUS:</span> All attendees will
              receive a free professional headshot at the event. Plus, there might
              be hot dogs!
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 w-full border-t border-gray-800 pt-8 text-center sm:mt-14">
          <p className="text-xs text-gray-500 sm:text-sm">
            © 2026 ProfitPulseAlly. All Rights Reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
