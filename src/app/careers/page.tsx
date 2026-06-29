import type { Metadata } from "next";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.careers.title"),
    description: translate(locale, "meta.careers.description"),
  };
}

export default async function CareersPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("careers.title")}>
      <p>
        {t("careers.bodyPrefix")}{" "}
        <a href="mailto:careers@profitpulseally.com">
          careers@profitpulseally.com
        </a>
        {t("careers.bodySuffix")}
      </p>
    </ContentPageLayout>
  );
}
