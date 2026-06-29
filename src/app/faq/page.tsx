import type { Metadata } from "next";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.faq.title"),
    description: translate(locale, "meta.faq.description"),
  };
}

export default async function FaqPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("faq.title")}>
      <p>{t("faq.body")}</p>
    </ContentPageLayout>
  );
}
