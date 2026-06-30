import type { Metadata } from "next";
import Link from "next/link";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.contest.title"),
    description: translate(locale, "meta.contest.description"),
  };
}

export default async function ContestRulesPage() {
  const { t } = await getServerTranslations();

  return (
    <ContentPageLayout title={t("legal.contest.title")}>
      <MarketPulseLaunchAnnouncement />

      <p className="lead text-zinc-300">
        {t("legal.contest.leadPrefix")}{" "}
        <Link href="/terms">{t("legal.contest.link.terms")}</Link>{" "}
        {t("legal.contest.leadMid")}{" "}
        <Link href="/investment-disclaimer">
          {t("legal.contest.link.disclaimer")}
        </Link>
        {t("legal.contest.leadSuffix")}
      </p>

      <h2>{t("legal.contest.eligibilityHeading")}</h2>
      <ul>
        <li>{t("legal.contest.eligibility1")}</li>
        <li>
          <strong>{t("legal.contest.eligibility2Prefix")}</strong>{" "}
          {t("legal.contest.eligibility2Suffix")}
        </li>
        <li>{t("legal.contest.eligibility3")}</li>
      </ul>

      <h2>{t("legal.contest.howHeading")}</h2>
      <p>
        {t("legal.contest.howBodyPrefix")}{" "}
        <strong>{t("legal.contest.howBodyBold")}</strong>{" "}
        {t("legal.contest.howBodySuffix")}
      </p>

      <h2>{t("legal.contest.prizesHeading")}</h2>
      <ul>
        <li>{t("legal.contest.prizesCycle")}</li>
        <li>
          <strong>{t("legal.contest.prizesAward")}</strong>
        </li>
        <li>
          <strong>{t("legal.contest.prizesVerificationPrefix")}</strong>
          {t("legal.contest.prizesVerificationSuffix")}
        </li>
        <li>{t("legal.contest.prizesNoGuarantee")}</li>
        <li>{t("legal.contest.prizesWinners")}</li>
      </ul>

      <h2>{t("legal.contest.fairPlayHeading")}</h2>
      <p>{t("legal.contest.fairPlayIntro")}</p>
      <ul>
        <li>{t("legal.contest.fairPlay1")}</li>
        <li>{t("legal.contest.fairPlay2")}</li>
        <li>{t("legal.contest.fairPlay3")}</li>
        <li>{t("legal.contest.fairPlay4")}</li>
      </ul>
      <p>{t("legal.contest.fairPlayOutro")}</p>

      <h2>{t("legal.contest.changesHeading")}</h2>
      <p>{t("legal.contest.changesBody")}</p>

      <h2>{t("legal.contest.educationalHeading")}</h2>
      <p>
        {t("legal.contest.educationalBodyPrefix")}{" "}
        <Link href="/investment-disclaimer">
          {t("legal.contest.link.disclaimer")}
        </Link>{" "}
        {t("legal.contest.educationalBodySuffix")}
      </p>

      <h2>{t("legal.contest.privacyHeading")}</h2>
      <p>
        {t("legal.contest.privacyBodyPrefix")}{" "}
        <Link href="/privacy">{t("legal.contest.link.privacy")}</Link>{" "}
        {t("legal.contest.privacyBodySuffix")}
      </p>

      <p className="not-prose mt-10 text-sm text-zinc-500">
        {t("legal.contest.footerPrefix")}{" "}
        <Link
          href="/market-pulse/rules"
          className="text-zinc-300 underline-offset-4 hover:underline"
        >
          {t("legal.contest.link.rules")}
        </Link>
        {t("legal.contest.footerSuffix")}
      </p>
    </ContentPageLayout>
  );
}
