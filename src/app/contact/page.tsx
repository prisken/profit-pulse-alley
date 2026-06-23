import ContentPageLayout from "@/components/layout/ContentPageLayout";

export const metadata = {
  title: "Contact Us | Profit Pulse Ally",
  description: "Get in touch with the Profit Pulse Ally team.",
};

export default function ContactPage() {
  return (
    <ContentPageLayout title="Contact Us">
      <p>
        For all inquiries, please email us at{" "}
        <a href="mailto:contact@profitpulseally.com">
          contact@profitpulseally.com
        </a>
        .
      </p>
    </ContentPageLayout>
  );
}
