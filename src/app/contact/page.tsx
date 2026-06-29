import type { Metadata } from "next";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.contact.title"),
    description: translate(locale, "meta.contact.description"),
  };
}

export default async function ContactPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("contact.title")}>
      <p>
        {t("contact.bodyPrefix")}{" "}
        <a href="mailto:contact@profitpulseally.com">
          contact@profitpulseally.com
        </a>
        {t("contact.bodySuffix")}
      </p>
    </ContentPageLayout>
  );
}
