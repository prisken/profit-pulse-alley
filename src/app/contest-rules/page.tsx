import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";

export const metadata = {
  title: "Market Pulse Contest Rules | Profit Pulse Ally",
  description:
    "Eligibility, fair play, prizes, and administration for Market Pulse challenges.",
};

export default function ContestRulesPage() {
  return (
    <ContentPageLayout title="Market Pulse Contest Rules">
      <LegalDraftNotice />

      <p className="lead text-zinc-300">
        These rules describe how Profit Pulse Ally (&quot;PPA&quot;) administers
        Market Pulse leaderboard challenges and prizes. They supplement our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/investment-disclaimer">Investment Disclaimer</Link>.
      </p>

      <h2>Eligibility</h2>
      <ul>
        <li>
          Participation requires a valid Profit Pulse Ally member account in good
          standing and any eligibility criteria we publish for a specific cycle
          (for example, age or region).
        </li>
        <li>
          <strong>One account per participant.</strong> Shared, duplicate, or
          misleading accounts are not permitted.
        </li>
        <li>
          PPA may request reasonable verification of identity or eligibility
          before awarding a prize.
        </li>
      </ul>

      <h2>How to participate</h2>
      <p>
        Market Pulse is a free educational game for registered members.{" "}
        <strong>No purchase is necessary</strong> to enter or play. Creating an
        account and submitting decisions during an active challenge cycle
        constitutes entry for that cycle&apos;s leaderboard, subject to these
        rules and any cycle-specific announcements.
      </p>

      <h2>Prizes</h2>
      <ul>
        <li>
          Prize descriptions (for example, tickets or reports) are announced per
          cycle on the site or through official PPA channels.
        </li>
        <li>
          <strong>All prizes are subject to verification</strong>, availability,
          and substitution of equal or greater value where permitted.
        </li>
        <li>Participation does not guarantee a prize.</li>
        <li>
          Winners may be asked to confirm contact details and comply with
          reasonable claim steps within a stated timeframe.
        </li>
      </ul>

      <h2>Fair play and disqualification</h2>
      <p>
        Scores and rankings must reflect genuine personal play through the
        official Market Pulse experience. PPA may review activity for integrity.
        Without limitation, we may disqualify a participant or void scores if we
        suspect:
      </p>
      <ul>
        <li>fraud or misrepresentation;</li>
        <li>duplicate or shared accounts;</li>
        <li>automation, bots, or scripted play;</li>
        <li>abuse of APIs, client tampering, or other circumvention of game rules.</li>
      </ul>
      <p>
        Disqualified participants forfeit prizes for the affected cycle. PPA&apos;s
        determinations in administering the contest are final, subject to
        applicable law.
      </p>

      <h2>Changes and cancellation</h2>
      <p>
        PPA reserves the right to modify, suspend, or cancel Market Pulse, any
        cycle, scoring method, or prize offer where legally required or for
        operational, security, or fairness reasons. Material changes will be
        communicated through reasonable channels when practicable.
      </p>

      <h2>Educational purpose</h2>
      <p>
        Market Pulse is an educational simulation. It does not provide investment
        advice, and contest outcomes do not endorse any security or strategy. See
        the <Link href="/investment-disclaimer">Investment Disclaimer</Link> for
        more information.
      </p>

      <h2>Privacy</h2>
      <p>
        We process account, gameplay, and anti-abuse data as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>, including information used
        for leaderboard display and prize verification.
      </p>

      <p className="not-prose mt-10 text-sm text-zinc-500">
        For gameplay mechanics, see{" "}
        <Link href="/market-pulse/rules" className="text-zinc-300 underline-offset-4 hover:underline">
          Market Pulse Rules
        </Link>
        .
      </p>
    </ContentPageLayout>
  );
}
