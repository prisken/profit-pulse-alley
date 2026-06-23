import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";

export const metadata = {
  title: "Terms of Service | Profit Pulse Ally",
  description: "Terms of Service for Profit Pulse Ally.",
};

export default function TermsPage() {
  return (
    <ContentPageLayout title="Terms of Service">
      <LegalDraftNotice />

      <p>
        This page is currently under construction. Our full Terms of Service
        will be available here soon.
      </p>

      <h2>Market Pulse</h2>
      <p>
        Market Pulse is an educational game offered through Profit Pulse Ally.
        By participating, you agree to play in accordance with the{" "}
        <Link href="/market-pulse/rules">Market Pulse Rules</Link>,{" "}
        <Link href="/contest-rules">Contest Rules</Link>, and applicable site
        policies. Market Pulse does not create a client, advisory, or fiduciary
        relationship.
      </p>
      <p>
        We may update challenge cycles, scoring, prizes, and feature availability
        from time to time. Continued use after changes constitutes acceptance of
        the updated terms where permitted by law.
      </p>
    </ContentPageLayout>
  );
}
