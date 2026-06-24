import Link from "next/link";
import type { ReactNode } from "react";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import { MARKET_PULSE_INLINE_DISCLAIMER } from "@/lib/market-pulse/legal-copy";
import { CHALLENGE_CYCLE_DAYS } from "@/lib/market-pulse/challenge-cycle";

export const metadata = {
  title: "Market Pulse Rules | Profit Pulse Ally",
  description:
    "How Market Pulse works — challenge cycles, scoring, leaderboards, and fair play.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

function RulesCard({
  title,
  children,
  collapsibleOnMobile = false,
}: Readonly<{
  title: string;
  children: ReactNode;
  collapsibleOnMobile?: boolean;
}>) {
  const body = (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
      {children}
    </div>
  );

  if (collapsibleOnMobile) {
    return (
      <>
        <details className="group rounded-xl border border-zinc-800 bg-zinc-950/50 sm:hidden">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            {title}
            <span
              className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              ▾
            </span>
          </summary>
          <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-300">
            {children}
          </div>
        </details>

        <section className="hidden rounded-2xl sm:block">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="mt-3">{body}</div>
        </section>
      </>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:rounded-2xl sm:border-zinc-800/80 sm:bg-transparent sm:p-0">
      <h2 className="text-base font-semibold text-white sm:text-xl">{title}</h2>
      <div className="mt-3">{body}</div>
    </section>
  );
}

export default function MarketPulseRulesPage() {
  return (
    <ContentPageLayout title="Market Pulse Rules">
      <div className="not-prose space-y-4 sm:space-y-8">
        <LegalDraftNotice />

        <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-300 sm:border-0 sm:bg-transparent sm:p-0 sm:text-lg sm:text-zinc-300">
          Market Pulse is Profit Pulse Ally&apos;s recurring investment challenge.
          Play a simulated startup portfolio game, post your best score, and see
          how you rank on the leaderboard. Rules and prizes may be updated from
          time to time; this page describes how the challenge generally works
          today.
        </p>

        <RulesCard title="What Market Pulse is">
          <p>
            Market Pulse is an educational simulation. You review fictional startup
            deals, decide where to allocate virtual capital, and respond to themed
            market events over a multi-year in-game timeline. It is designed to
            practice judgment and portfolio thinking — not to recommend real
            investments.
          </p>
        </RulesCard>

        <RulesCard
          title={`How the ${CHALLENGE_CYCLE_DAYS}-day challenge works`}
          collapsibleOnMobile
        >
          <p>
            Leaderboard competition runs in recurring{" "}
            <strong className="font-semibold text-zinc-100">
              {CHALLENGE_CYCLE_DAYS}-day cycles
            </strong>{" "}
            (Hong Kong time). Each cycle has a fixed start and end; the homepage
            countdown shows time remaining in the current cycle.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Cycles repeat on a regular schedule from our published epoch (see site
              countdown).
            </li>
            <li>
              Scores saved during a cycle are tagged with that cycle&apos;s ID for
              leaderboard purposes.
            </li>
            <li>
              When a new cycle begins, the current-cycle leaderboard resets for
              ranking; your past runs remain visible in your profile history.
            </li>
          </ul>
        </RulesCard>

        <RulesCard title="How scores are calculated" collapsibleOnMobile>
          <p>
            When a run ends, your score is your{" "}
            <strong className="font-semibold text-zinc-100">total net worth</strong>{" "}
            in the simulation: remaining virtual cash plus the value of portfolio
            holdings, rounded to the nearest whole number. Bankrupt or invalid runs
            may not be saved. Exact deal data, themes, and events can change as we
            refine the game.
          </p>
        </RulesCard>

        <RulesCard title="Leaderboard and prizes" collapsibleOnMobile>
          <p>
            The Market Pulse Hub shows top scores for the current cycle when
            available. If no scores have been posted yet in a cycle, we may display
            all-time leaders until the cycle board fills up.
          </p>
          <p>
            Prize details — including what is offered, how many winners there are,
            and how they are notified — are announced on the homepage, in admin
            settings, or through official Profit Pulse Ally channels.{" "}
            <strong className="font-semibold text-zinc-100">
              Participation does not guarantee a prize.
            </strong>{" "}
            We reserve the right to verify eligibility, withhold or substitute
            prizes, and update prize terms for future cycles.
          </p>
        </RulesCard>

        <RulesCard title="Fair play" collapsibleOnMobile>
          <p>
            Scores must come from normal play in the official Market Pulse game.
            Manipulating client data, automating play, sharing accounts, or
            attempting to bypass server checks may result in score removal or
            account restrictions. We may apply additional validation over time;
            this is not an exhaustive anti-cheat system.
          </p>
        </RulesCard>

        <RulesCard title="Educational disclaimer" collapsibleOnMobile>
          <p>{MARKET_PULSE_INLINE_DISCLAIMER}</p>
          <p>
            Simulated outcomes do not predict real-world results. See our{" "}
            <Link
              href="/investment-disclaimer"
              className={`text-zinc-200 underline-offset-4 hover:underline ${focusRing}`}
            >
              Investment Disclaimer
            </Link>{" "}
            and{" "}
            <Link
              href="/contest-rules"
              className={`text-zinc-200 underline-offset-4 hover:underline ${focusRing}`}
            >
              Contest Rules
            </Link>{" "}
            for eligibility, prizes, and fair play.
          </p>
        </RulesCard>

        <RulesCard title="Account requirement" collapsibleOnMobile>
          <p>
            You must sign in with a Profit Pulse Ally member account to play and
            save scores to the leaderboard. Guest visitors can view Market Pulse Hub
            but cannot post scores. One account per person is expected; profile history
            shows your saved runs.
          </p>
        </RulesCard>

        <MarketPulseInlineDisclaimer className="mt-6 sm:mt-10" showLinks />

        <p className="text-sm text-zinc-500">
          Questions? Visit the{" "}
          <Link
            href="/faq"
            className={`text-zinc-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            FAQ
          </Link>{" "}
          or{" "}
          <Link
            href="/contact"
            className={`text-zinc-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            contact us
          </Link>
          .
        </p>
      </div>
    </ContentPageLayout>
  );
}
