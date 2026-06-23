import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";

export const metadata = {
  title: "Privacy Policy | Profit Pulse Ally",
  description: "How Profit Pulse Ally handles your personal data.",
};

export default function PrivacyPage() {
  return (
    <ContentPageLayout title="Privacy Policy">
      <LegalDraftNotice />

      <p>
        This page is currently under construction. Our Privacy Policy, detailing
        how we handle your data, will be available here soon.
      </p>

      <h2>Market Pulse</h2>
      <p>
        When you play Market Pulse, we may process information such as your
        account identifier, display name, gameplay decisions, timestamps,
        leaderboard rankings, and technical signals used for integrity review
        (for example, hashed IP or user-agent values). We use this data to
        operate the game, display leaderboards, administer prizes, and detect
        abuse.
      </p>
      <p>
        Prize winners may be contacted using the email on file for verification
        and fulfilment. For contest administration, see our{" "}
        <Link href="/contest-rules">Contest Rules</Link>.
      </p>
    </ContentPageLayout>
  );
}
