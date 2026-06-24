import Link from "next/link";
import { redirect } from "next/navigation";

import MarketPulseAdminDashboard from "@/components/admin/MarketPulseAdminDashboard";
import { getMarketPulseAdminDashboardData } from "@/lib/market-pulse/admin-data";
import { getMarketPulsePrizeReviewData } from "@/lib/market-pulse/prize-review-data";

export const metadata = {
  title: "Market Pulse Admin | Profit Pulse Ally",
  description: "Manage Market Pulse cycles, cards, and game runtime.",
};

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

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
      <header className="border-b border-foreground/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">
          Admin
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Market Pulse
            </h1>
            <p className="mt-2 text-sm text-foreground/65">
              Signed in as {data.adminEmail}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to admin
          </Link>
        </div>
      </header>

      <div className="mt-6 sm:mt-8">
        <MarketPulseAdminDashboard initialData={data} prizeReview={prizeReview} />
      </div>
    </main>
  );
}
