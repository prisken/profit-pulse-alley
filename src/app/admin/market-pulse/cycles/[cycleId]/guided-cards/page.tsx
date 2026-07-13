import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import MarketPulseGuidedCardsClient from "@/components/admin/MarketPulseGuidedCardsClient";
import MarketPulseAdminBreadcrumbs from "@/components/admin/MarketPulseAdminBreadcrumbs";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate, translateWith } from "@/lib/i18n/messages";
import {
  ADMIN_MARKET_PULSE_PATH,
  buildAdminMpGuidedCardsBreadcrumbs,
  marketPulseCycleBuilderPath,
} from "@/lib/market-pulse/admin-mp-navigation";
import { getGuidedCycleCardsPageData } from "@/lib/market-pulse/guided-cycle-cards-page-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}): Promise<Metadata> {
  const { cycleId } = await params;
  const locale = await getServerSiteLocale();
  const data = await getGuidedCycleCardsPageData(cycleId);

  return {
    title: translate(locale, "auth.meta.adminMpGuidedCards.title"),
    description: data
      ? translateWith(locale, "auth.meta.adminMpGuidedCards.description", {
          cycle: data.cycle.name,
        })
      : translate(locale, "auth.meta.adminMpGuidedCards.descriptionFallback"),
  };
}

export default async function MarketPulseGuidedCardsPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const data = await getGuidedCycleCardsPageData(cycleId);

  if (!data) {
    redirect("/");
  }

  const { t, locale } = await getServerTranslations();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
        <header className="border-b border-zinc-800 pb-6">
          <MarketPulseAdminBreadcrumbs
            items={buildAdminMpGuidedCardsBreadcrumbs(data.cycle.name)}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t("auth.admin.badge")}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {t("auth.admin.mp.guidedCards.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                {t("auth.admin.mp.guidedCards.subtitle")}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {translateWith(locale, "auth.admin.mpSignedInAs", {
                  email: data.adminEmail,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={marketPulseCycleBuilderPath(cycleId)}
                className="text-sm font-medium text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline"
              >
                {t("auth.admin.mp.guidedCards.openAdvancedBuilder")}
              </Link>
              <Link
                href={ADMIN_MARKET_PULSE_PATH}
                className="text-sm font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
              >
                {t("auth.admin.mp.guidedCycle.backLink")}
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 sm:mt-8">
          <MarketPulseGuidedCardsClient initialData={data} />
        </div>
      </div>
    </main>
  );
}
