import ContentPageLayout from "@/components/layout/ContentPageLayout";

export const metadata = {
  title: "Careers | Profit Pulse Ally",
  description: "Join the Profit Pulse Ally team.",
};

export default function CareersPage() {
  return (
    <ContentPageLayout title="Careers">
      <p>
        We are always looking for talented individuals to join our mission.
        While we have no open positions at this time, you can send your resume to{" "}
        <a href="mailto:careers@profitpulseally.com">
          careers@profitpulseally.com
        </a>
        , and we will keep it on file for future opportunities.
      </p>
    </ContentPageLayout>
  );
}
