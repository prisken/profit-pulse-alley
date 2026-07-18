import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import MatchingPulseAdminDetail from "@/components/admin/matching-pulse/MatchingPulseAdminDetail";
import { getMatchingPulseAdminRequestDetail } from "@/lib/matching-pulse/admin-data";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";

export const metadata: Metadata = {
  title: "Review Matching Pulse request | Profit Pulse Ally",
  description:
    "Admin review for a Matching Pulse collaboration request. Internal notes and tags are admin-only.",
};

type MatchingPulseAdminDetailPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

export default async function MatchingPulseAdminDetailPage({
  params,
}: MatchingPulseAdminDetailPageProps) {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/");
  }

  const { requestId } = await params;
  const data = await getMatchingPulseAdminRequestDetail(requestId);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
        <MatchingPulseAdminDetail request={data.request} />
      </div>
    </main>
  );
}
