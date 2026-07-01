import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import ContentPageLayout from "@/components/layout/ContentPageLayout";
import MarketPulseLaunchAnnouncement from "@/components/market-pulse/MarketPulseLaunchAnnouncement";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import { getServerTranslations, getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { CHALLENGE_CYCLE_DAYS } from "@/lib/market-pulse/challenge-cycle";
import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
  STREAK_INTERVAL,
} from "@/lib/market-pulse/constants";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "mp.meta.rules.title"),
    description: translate(locale, "mp.meta.rules.description"),
  };
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

function RulesCard({
  title,
  children,
  collapsibleOnMobile = false,
}: Readonly<{
  title: string;
  children: ReactNode;
  collapsibleOnMobile?: boolean;
}>) {
  const body = (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
      {children}
    </div>
  );

  if (collapsibleOnMobile) {
    return (
      <>
        <details className="group rounded-xl border border-zinc-800 bg-zinc-950/50 sm:hidden">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            {title}
            <span
              className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              ▾
            </span>
          </summary>
          <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-300">
            {children}
          </div>
        </details>

        <section className="hidden rounded-2xl sm:block">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="mt-3">{body}</div>
        </section>
      </>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:rounded-2xl sm:border-zinc-800/80 sm:bg-transparent sm:p-0">
      <h2 className="text-base font-semibold text-white sm:text-xl">{title}</h2>
      <div className="mt-3">{body}</div>
    </section>
  );
}

export default async function MarketPulseRulesPage() {
  const { t } = await getServerTranslations();
  const cycleDays = String(CHALLENGE_CYCLE_DAYS);

  return (
    <ContentPageLayout title={t("mp.rules.title")}>
      <div className="not-prose space-y-4 sm:space-y-8">
        <MarketPulseLaunchAnnouncement />

        <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-300 sm:border-0 sm:bg-transparent sm:p-0 sm:text-lg sm:text-zinc-300">
          {t("mp.rules.intro")}
        </p>

        <RulesCard title={t("mp.rules.section.whatIs")}>
          <p>{t("mp.rules.section.whatIsBody")}</p>
        </RulesCard>

        <RulesCard
          title={t("mp.rules.section.howWorks").replace("{days}", cycleDays)}
          collapsibleOnMobile
        >
          <p>
            {t("mp.rules.section.howWorksIntro").replace("{days}", cycleDays)}
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>{t("mp.rules.section.howWorks1")}</li>
            <li>{t("mp.rules.section.howWorks2")}</li>
            <li>{t("mp.rules.section.howWorks3")}</li>
            <li>{t("mp.rules.section.howWorks4")}</li>
            <li>{t("mp.rules.section.howWorks5")}</li>
          </ul>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.restDays")} collapsibleOnMobile>
          <p>{t("mp.rules.section.restDaysBody")}</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>{t("mp.rules.section.restDays1")}</li>
            <li>{t("mp.rules.section.restDays2")}</li>
            <li>{t("mp.rules.section.restDays3")}</li>
            <li>{t("mp.rules.section.restDays4")}</li>
            <li>{t("mp.rules.section.restDays5")}</li>
          </ul>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.scoring")} collapsibleOnMobile>
          <p>{t("mp.rules.section.scoringIntro")}</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {t("mp.rules.section.scoringSignalParticipation").replace(
                "{points}",
                String(PARTICIPATION_POINTS),
              )}
            </li>
            <li>
              {t("mp.rules.section.scoringSignalMatch").replace(
                "{points}",
                String(MATCH_BONUS_POINTS),
              )}
            </li>
            <li>
              {t("mp.rules.section.scoringSignalStreak")
                .replace("{points}", String(STREAK_BONUS_POINTS))
                .replace("{interval}", String(STREAK_INTERVAL))}
            </li>
            <li>
              {t("mp.rules.section.scoringRestCard").replace(
                "{points}",
                String(PARTICIPATION_POINTS),
              )}
            </li>
          </ul>
          <p>{t("mp.rules.section.scoringNote")}</p>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.prize")} collapsibleOnMobile>
          <p>{t("mp.rules.section.prizeIntro")}</p>
          <p>{t("legal.contest.prizesCycle")}</p>
          <p>
            <strong className="font-semibold text-zinc-100">
              {t("legal.contest.prizesAward")}
            </strong>
          </p>
          <p>{t("mp.rules.section.prizeDisclaimer")}</p>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.fairPlay")} collapsibleOnMobile>
          <p>{t("mp.rules.section.fairPlayBody")}</p>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.disclaimer")} collapsibleOnMobile>
          <p>{t("legal.disclaimer.inlineMarketPulse")}</p>
          <p>
            {t("mp.rules.section.disclaimerBody")}{" "}
            <Link
              href="/investment-disclaimer"
              className={`text-zinc-200 underline-offset-4 hover:underline ${focusRing}`}
            >
              {t("mp.disclaimer.link.investment")}
            </Link>{" "}
            {t("legal.contest.leadMid")}{" "}
            <Link
              href="/contest-rules"
              className={`text-zinc-200 underline-offset-4 hover:underline ${focusRing}`}
            >
              {t("mp.disclaimer.link.contest")}
            </Link>
            .
          </p>
        </RulesCard>

        <RulesCard title={t("mp.rules.section.account")} collapsibleOnMobile>
          <p>{t("mp.rules.section.accountBody")}</p>
        </RulesCard>

        <MarketPulseInlineDisclaimer className="mt-6 sm:mt-10" showLinks />

        <p className="text-sm text-zinc-500">
          {t("mp.rules.footer.questions")}{" "}
          <Link
            href="/faq"
            className={`text-zinc-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            {t("footer.link.faqs")}
          </Link>{" "}
          {t("mp.rules.footer.or")}{" "}
          <Link
            href="/contact"
            className={`text-zinc-300 underline-offset-4 hover:underline ${focusRing}`}
          >
            {t("mp.rules.footer.contact")}
          </Link>
          {t("mp.rules.footer.suffix")}
        </p>
      </div>
    </ContentPageLayout>
  );
}
