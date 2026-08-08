import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PitchLeadsAdminTable from "@/components/admin/pitch/PitchLeadsAdminTable";
import { getPitchAdminLeadsData } from "@/lib/pitch-game/admin-data";

export const metadata: Metadata = {
  title: "Pitch Meeting Leads Admin | Profit Pulse Ally",
  description: "The Pitch Meeting lead captures — contacts and full game journeys.",
};

export default async function PitchAdminPage() {
  const data = await getPitchAdminLeadsData();

  if (!data) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
        <header className="border-b border-zinc-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Admin
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Pitch Meeting leads
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Every lead captured at profitpulseally.com/pitch — contact
                details, the numbers they entered, Elena&apos;s verdict, the
                term-sheet condition and the automation gap it exposed.
              </p>
              {data.adminEmail ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Signed in as {data.adminEmail} · {data.totalLeads} total
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/workshop"
                className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
              >
                Workshop leads →
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
              >
                Back to admin
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 sm:mt-8">
          <PitchLeadsAdminTable leads={data.leads} />
        </div>
      </div>
    </main>
  );
}
