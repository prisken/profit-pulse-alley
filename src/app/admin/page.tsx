import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminMatchingPulseOverview from "@/components/admin/AdminMatchingPulseOverview";
import AdminOverviewCards from "@/components/admin/AdminOverviewCards";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import { auth } from "@/auth";
import { loadAdminMembers } from "@/lib/admin/members-data";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate, translateWith } from "@/lib/i18n/messages";
import { getMatchingPulseAdminOverviewCounts } from "@/lib/matching-pulse/admin-data";
import { getAdminOverviewData } from "@/lib/market-pulse/admin-overview-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.admin.title"),
    description: translate(locale, "auth.meta.admin.description"),
  };
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { t, locale } = await getServerTranslations();

  const [overview, members, matchingPulseCounts] = await Promise.all([
    getAdminOverviewData(),
    loadAdminMembers(),
    getMatchingPulseAdminOverviewCounts(),
  ]);

  const signedInLine =
    members.length === 1
      ? translateWith(locale, "auth.admin.signedInAs", {
          email: session.user.email ?? "",
          count: members.length,
        })
      : translateWith(locale, "auth.admin.signedInAsPlural", {
          email: session.user.email ?? "",
          count: members.length,
        });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
        <header className="border-b border-zinc-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t("auth.admin.badge")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            {t("auth.admin.dashboardTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {t("auth.admin.opsSubtitle")}
          </p>
          <p className="mt-2 text-sm text-zinc-500">{signedInLine}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link
              href="/admin/market-pulse"
              className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
            >
              {t("auth.admin.marketPulseLink")}
            </Link>
            <Link
              href="/admin/matching-pulse"
              className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
            >
              {t("auth.admin.matchingPulseLink")}
            </Link>
            <Link
              href="/admin/workshop"
              className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
            >
              {t("auth.admin.quickActions.workshopLeads")}
            </Link>
          </p>
        </header>

        <div className="mt-8 space-y-10">
          <AdminOverviewCards overview={overview} />

          {matchingPulseCounts ? (
            <AdminMatchingPulseOverview counts={matchingPulseCounts} />
          ) : null}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm sm:p-6 lg:p-8">
            <AdminUserManagement
              members={members}
              currentAdminUserId={session.user.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
