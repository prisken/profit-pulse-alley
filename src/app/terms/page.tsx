import type { Metadata } from "next";
import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import LegalDraftNotice from "@/components/legal/LegalDraftNotice";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.terms.title"),
    description: translate(locale, "meta.terms.description"),
  };
}

export default async function TermsPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("legal.terms.title")}>
      <LegalDraftNotice />

      <p>{t("legal.terms.intro")}</p>

      <h2>{t("legal.terms.marketPulseHeading")}</h2>
      <p>
        {t("legal.terms.marketPulseBody1Prefix")}{" "}
        <Link href="/market-pulse/rules">{t("legal.terms.link.rules")}</Link>,{" "}
        <Link href="/contest-rules">{t("legal.terms.link.contest")}</Link>{" "}
        {t("legal.terms.marketPulseBody1Suffix")}
      </p>
      <p>{t("legal.terms.marketPulseBody2")}</p>
    </ContentPageLayout>
  );
}
