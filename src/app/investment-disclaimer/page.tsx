import type { Metadata } from "next";
import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.disclaimer.title"),
    description: translate(locale, "meta.disclaimer.description"),
  };
}

export default async function InvestmentDisclaimerPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("legal.disclaimer.title")}>

      <h2>{t("legal.disclaimer.noAdviceHeading")}</h2>
      <p>{t("legal.disclaimer.noAdviceBody")}</p>

      <h2>{t("legal.disclaimer.notFiduciaryHeading")}</h2>
      <p>{t("legal.disclaimer.notFiduciaryBody")}</p>

      <h2>{t("legal.disclaimer.accuracyHeading")}</h2>
      <p>{t("legal.disclaimer.accuracyBody")}</p>

      <h2>{t("legal.disclaimer.riskHeading")}</h2>
      <p>{t("legal.disclaimer.riskBody")}</p>

      <h2>{t("legal.disclaimer.marketPulseHeading")}</h2>
      <p>{t("legal.disclaimer.inlineMarketPulse")}</p>
      <p>
        {t("legal.disclaimer.marketPulseBodyPrefix")}{" "}
        <Link href="/contest-rules">{t("legal.disclaimer.link.contest")}</Link>{" "}
        {t("legal.disclaimer.marketPulseBodyMid")}{" "}
        <Link href="/market-pulse/rules">{t("legal.disclaimer.link.rules")}</Link>
        {t("legal.disclaimer.marketPulseBodySuffix")}
      </p>
    </ContentPageLayout>
  );
}
