import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import MarketPulseAdminDashboard from "@/components/admin/MarketPulseAdminDashboard";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate, translateWith } from "@/lib/i18n/messages";
import { getMarketPulseAdminDashboardData } from "@/lib/market-pulse/admin-data";
import { getMarketPulsePrizeReviewData } from "@/lib/market-pulse/prize-review-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.adminMp.title"),
    description: translate(locale, "auth.meta.adminMp.description"),
  };
}

export default async function MarketPulseAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ prizeCycleId?: string }>;
}) {
  const { prizeCycleId } = await searchParams;
  const [data, prizeReview] = await Promise.all([
    getMarketPulseAdminDashboardData(),
    getMarketPulsePrizeReviewData(prizeCycleId),
  ]);

  if (!data || !prizeReview) {
    redirect("/");
  }

  const { t, locale } = await getServerTranslations();

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
      <header className="border-b border-foreground/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">
          {t("auth.admin.badge")}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t("auth.admin.mpTitle")}
            </h1>
            <p className="mt-2 text-sm text-foreground/65">
              {translateWith(locale, "auth.admin.mpSignedInAs", {
                email: data.adminEmail,
              })}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("auth.admin.backToAdmin")}
          </Link>
        </div>
      </header>

      <div className="mt-6 sm:mt-8">
        <MarketPulseAdminDashboard initialData={data} prizeReview={prizeReview} />
      </div>
    </main>
  );
}
