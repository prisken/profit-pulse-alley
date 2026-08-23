import type { Metadata } from "next";
import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.privacy.title"),
    description: translate(locale, "meta.privacy.description"),
  };
}

export default async function PrivacyPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("legal.privacy.title")}>

      <p>{t("legal.privacy.intro")}</p>

      <h2>{t("legal.privacy.marketPulseHeading")}</h2>
      <p>{t("legal.privacy.marketPulseBody1")}</p>
      <p>
        {t("legal.privacy.marketPulseBody2Prefix")}{" "}
        <Link href="/contest-rules">{t("legal.privacy.link.contest")}</Link>
        {t("legal.privacy.marketPulseBody2Suffix")}
      </p>
    </ContentPageLayout>
  );
}
