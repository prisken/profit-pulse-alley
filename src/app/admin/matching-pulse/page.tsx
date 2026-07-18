import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import MatchingPulseAdminList from "@/components/admin/matching-pulse/MatchingPulseAdminList";
import { getMatchingPulseAdminListData } from "@/lib/matching-pulse/admin-data";

export const metadata: Metadata = {
  title: "Matching Pulse Admin | Profit Pulse Ally",
  description:
    "Review Matching Pulse collaboration requests submitted by members and event attendees.",
};

export default async function MatchingPulseAdminPage() {
  const data = await getMatchingPulseAdminListData();

  if (!data) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
        <header className="border-b border-zinc-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Admin
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Matching Pulse Admin
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Review collaboration requests submitted by members and event
                attendees.
              </p>
              {data.adminEmail ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Signed in as {data.adminEmail}
                </p>
              ) : null}
            </div>
            <Link
              href="/admin"
              className="text-sm font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
            >
              Back to admin
            </Link>
          </div>
        </header>

        <div className="mt-6 sm:mt-8">
          <MatchingPulseAdminList requests={data.requests} />
        </div>
      </div>
    </main>
  );
}
