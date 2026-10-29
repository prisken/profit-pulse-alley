import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Group medical leads | PPA Admin" };

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(d);
}

export default async function AdminGroupMedicalPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [rows, total, last7] = await Promise.all([
    prisma.groupMedicalLead.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.groupMedicalLead.count(),
    prisma.groupMedicalLead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">PPA Group Medical</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Quote requests</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} lead{total === 1 ? "" : "s"} · {last7} in the last 7 days · times in HKT
          </p>
        </div>
        <a
          href="/api/admin/group-medical/export"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Export CSV
        </a>
      </header>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900/80 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-4 py-3 font-semibold">Received</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Size</th>
              <th className="px-4 py-3 font-semibold">Renews</th>
              <th className="px-4 py-3 font-semibold">Current premium</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Lang</th>
              <th className="px-4 py-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No quote requests yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800/80">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{fmt(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div>{r.name}</div>
                    {r.role ? <div className="text-[11px] text-zinc-500">{r.role}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{r.company ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-emerald-400">{r.companySize}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{r.renewalMonth ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-zinc-300">{r.existingPremium ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {r.preferredContact === "whatsapp"
                      ? `WhatsApp ${r.phone ?? ""}`.trim()
                      : r.phone
                        ? `Email · ${r.phone}`
                        : "Email"}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase text-zinc-500">{r.locale === "zh-Hant" ? "ZH" : "EN"}</td>
                  <td className="px-4 py-3 text-[11px] text-zinc-500">{r.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-zinc-500">
        Newest {Math.min(rows.length, 500)} shown. Source: /api/group-medical/lead
      </p>
    </div>
  );
}
