import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";
import { MARKET_PULSE_INLINE_DISCLAIMER } from "@/lib/market-pulse/legal-copy";

export const metadata = {
  title: "Investment Disclaimer | Profit Pulse Ally",
  description:
    "Important disclaimer regarding financial and investment information on Profit Pulse Ally.",
};

export default function InvestmentDisclaimerPage() {
  return (
    <ContentPageLayout title="Investment Disclaimer">
      <LegalDraftNotice />

      <h2>No Financial Advice</h2>
      <p>
        The information provided on the Profit Pulse Ally website, including
        through the Market Pulse game, events, and all related content, is for
        educational and informational purposes only. It is not intended as, and
        shall not be understood or construed as, financial advice, investment
        advice, trading advice, or any other sort of advice that would trigger a
        fiduciary relationship.
      </p>

      <h2>Not a Fiduciary</h2>
      <p>
        We are not financial advisors, and we are not licensed to provide
        financial advice. Your participation in any activity on this site does
        not create a fiduciary relationship between you and Profit Pulse Ally or
        any of its employees or affiliates.
      </p>

      <h2>Accuracy of Information</h2>
      <p>
        While we strive to provide accurate and up-to-date information, we make
        no representation or warranty of any kind, express or implied,
        regarding the accuracy, adequacy, validity, reliability, availability,
        or completeness of any information on the site.
      </p>

      <h2>Use at Your Own Risk</h2>
      <p>
        You agree that you are using the site and its information at your own
        risk. You should consult with a professional financial advisor before
        making any investment decisions. Under no circumstance shall we have any
        liability to you for any loss or damage of any kind incurred as a result
        of the use of the site or reliance on any information provided.
      </p>

      <h2>Market Pulse</h2>
      <p>{MARKET_PULSE_INLINE_DISCLAIMER}</p>
      <p>
        News-style cards, PPA signals, insights, leaderboards, and simulated
        outcomes in Market Pulse are for education and entertainment only. They
        may be delayed, simplified, or fictionalised for the game and must not be
        relied upon for real trading or portfolio decisions. Contest prizes do
        not imply endorsement of any issuer or security. See{" "}
        <Link href="/contest-rules">Contest Rules</Link> and{" "}
        <Link href="/market-pulse/rules">Market Pulse Rules</Link>.
      </p>
    </ContentPageLayout>
  );
}
