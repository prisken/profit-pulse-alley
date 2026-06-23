import ContentPageLayout from "@/components/layout/ContentPageLayout";

export const metadata = {
  title: "Investment Disclaimer | Profit Pulse Ally",
  description:
    "Important disclaimer regarding financial and investment information on Profit Pulse Ally.",
};

export default function InvestmentDisclaimerPage() {
  return (
    <ContentPageLayout title="Investment Disclaimer">
      <div className="not-prose mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold leading-relaxed text-amber-200">
          This is placeholder legal text. It must be reviewed and replaced by a
          qualified legal professional before the site is used by the public.
        </p>
      </div>

      <h3>No Financial Advice</h3>
      <p>
        The information provided on the Profit Pulse Ally website, including
        through the Market Pulse game, events, and all related content, is for
        educational and informational purposes only. It is not intended as, and
        shall not be understood or construed as, financial advice, investment
        advice, trading advice, or any other sort of advice that would trigger a
        fiduciary relationship.
      </p>

      <h3>Not a Fiduciary</h3>
      <p>
        We are not financial advisors, and we are not licensed to provide
        financial advice. Your participation in any activity on this site does
        not create a fiduciary relationship between you and Profit Pulse Ally or
        any of its employees or affiliates.
      </p>

      <h3>Accuracy of Information</h3>
      <p>
        While we strive to provide accurate and up-to-date information, we make
        no representation or warranty of any kind, express or implied,
        regarding the accuracy, adequacy, validity, reliability, availability,
        or completeness of any information on the site.
      </p>

      <h3>Use at Your Own Risk</h3>
      <p>
        You agree that you are using the site and its information at your own
        risk. You should consult with a professional financial advisor before
        making any investment decisions. Under no circumstance shall we have any
        liability to you for any loss or damage of any kind incurred as a result
        of the use of the site or reliance on any information provided.
      </p>
    </ContentPageLayout>
  );
}
