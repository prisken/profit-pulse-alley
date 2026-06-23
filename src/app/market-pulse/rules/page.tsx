import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { CHALLENGE_CYCLE_DAYS } from "@/lib/market-pulse/challenge-cycle";

export const metadata = {
  title: "Market Pulse Rules | Profit Pulse Ally",
  description:
    "How Market Pulse works — challenge cycles, scoring, leaderboards, and fair play.",
};

export default function MarketPulseRulesPage() {
  return (
    <ContentPageLayout title="Market Pulse Rules">
      <p className="lead text-zinc-300">
        Market Pulse is Profit Pulse Ally&apos;s recurring investment challenge.
        Play a simulated startup portfolio game, post your best score, and see
        how you rank on the leaderboard. Rules and prizes may be updated from
        time to time; this page describes how the challenge generally works
        today.
      </p>

      <h2>What Market Pulse is</h2>
      <p>
        Market Pulse is an educational simulation. You review fictional startup
        deals, decide where to allocate virtual capital, and respond to themed
        market events over a multi-year in-game timeline. It is designed to
        practice judgment and portfolio thinking — not to recommend real
        investments.
      </p>

      <h2>How the {CHALLENGE_CYCLE_DAYS}-day challenge works</h2>
      <p>
        Leaderboard competition runs in recurring{" "}
        <strong>{CHALLENGE_CYCLE_DAYS}-day cycles</strong> (Hong Kong time). Each
        cycle has a fixed start and end; the homepage countdown shows time
        remaining in the current cycle.
      </p>
      <ul>
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

      <h2>How scores are calculated</h2>
      <p>
        When a run ends, your score is your <strong>total net worth</strong> in
        the simulation: remaining virtual cash plus the value of portfolio
        holdings, rounded to the nearest whole number. Bankrupt or invalid runs
        may not be saved. Exact deal data, themes, and events can change as we
        refine the game.
      </p>

      <h2>Leaderboard and prizes</h2>
      <p>
        The Market Pulse Hub shows top scores for the current cycle when
        available. If no scores have been posted yet in a cycle, we may display
        all-time leaders until the cycle board fills up.
      </p>
      <p>
        Prize details — including what is offered, how many winners there are,
        and how they are notified — are announced on the homepage, in admin
        settings, or through official Profit Pulse Ally channels.{" "}
        <strong>
          Participation does not guarantee a prize.
        </strong>{" "}
        We reserve the right to verify eligibility, withhold or substitute
        prizes, and update prize terms for future cycles.
      </p>

      <h2>Fair play</h2>
      <p>
        Scores must come from normal play in the official Market Pulse game.
        Manipulating client data, automating play, sharing accounts, or
        attempting to bypass server checks may result in score removal or
        account restrictions. We may apply additional validation over time;
        this is not an exhaustive anti-cheat system.
      </p>

      <h2>Educational disclaimer</h2>
      <p>
        Market Pulse is for learning and entertainment. It does{" "}
        <strong>not</strong> constitute financial, investment, tax, or legal
        advice. Simulated outcomes do not predict real-world results. See our{" "}
        <Link href="/investment-disclaimer">Investment Disclaimer</Link> for
        more information.
      </p>

      <h2>Account requirement</h2>
      <p>
        You must sign in with a Profit Pulse Ally member account to play and
        save scores to the leaderboard. Guest visitors can view Market Pulse Hub
        but cannot post scores. One account per person is expected; profile history
        shows your saved runs.
      </p>

      <p className="not-prose mt-10 text-sm text-zinc-500">
        Questions? Visit the{" "}
        <Link href="/faq" className="text-zinc-300 underline-offset-4 hover:underline">
          FAQ
        </Link>{" "}
        or{" "}
        <Link
          href="/contact"
          className="text-zinc-300 underline-offset-4 hover:underline"
        >
          contact us
        </Link>
        .
      </p>
    </ContentPageLayout>
  );
}
