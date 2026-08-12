"use client";

import { downloadCsv } from "@/lib/admin/csv-download";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";
import { buildWorkshopLeadsCsv } from "@/lib/workshop/leads-csv";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

function formatCreatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

type WorkshopLeadsAdminTableProps = Readonly<{
  leads: WorkshopAdminLeadRow[];
}>;

export default function WorkshopLeadsAdminTable({
  leads,
}: WorkshopLeadsAdminTableProps) {
  function handleExportCsv() {
    if (leads.length === 0) {
      return;
    }
    const csv = buildWorkshopLeadsCsv(leads);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `workshop-leads-${dateStamp}.csv`);
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-zinc-300 sm:text-base">
          No Workshop Pyramid Lab leads yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {leads.length} lead{leads.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={handleExportCsv}
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3 font-semibold sm:px-4">Name</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Email</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Phone</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Industry</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Age</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Ret. age</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Runway Δ</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Levers</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Weakest</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Risk profile</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Rating score</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Selected goal</th>
              <th className="px-3 py-3 font-semibold sm:px-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
            {leads.map((lead) => (
              <tr key={lead.id} className="align-top hover:bg-zinc-900/40">
                <td className="px-3 py-3 font-medium text-zinc-100 sm:px-4">
                  {lead.name}
                </td>
                <td className="px-3 py-3 text-zinc-300 sm:px-4">{lead.email}</td>
                <td className="px-3 py-3 text-zinc-400 sm:px-4">
                  {lead.phone}
                </td>
                <td className="px-3 py-3 text-zinc-300 sm:px-4">
                  {lead.industry}
                </td>
                <td className="px-3 py-3 font-mono tabular-nums text-zinc-300 sm:px-4">
                  {lead.age}
                </td>
                <td className="px-3 py-3 font-mono tabular-nums text-zinc-300 sm:px-4">
                  {lead.retirementAge ?? "—"}
                </td>
                <td className="px-3 py-3 font-mono tabular-nums text-zinc-300 sm:px-4">
                  {lead.runwayBeforeAge == null && lead.runwayAfterAge == null
                    ? "—"
                    : lead.runwayBeforeAge == null
                      ? `${lead.runwayAfterAge} (90+)`
                      : lead.runwayAfterAge == null
                        ? `90+ (was ${lead.runwayBeforeAge})`
                        : `${lead.runwayAfterAge} (was ${lead.runwayBeforeAge})`}
                </td>
                <td className="px-3 py-3 font-mono text-[11px] tabular-nums text-zinc-400 sm:px-4">
                  {lead.actionGoalLevers ?? "—"}
                </td>
                <td className="px-3 py-3 capitalize text-zinc-300 sm:px-4">
                  {lead.weakestLayer ?? "—"}
                </td>
                <td className="px-3 py-3 capitalize text-zinc-300 sm:px-4">
                  {lead.riskProfile ?? "—"}
                </td>
                <td className="px-3 py-3 font-mono tabular-nums text-zinc-300 sm:px-4">
                  {lead.ratingScore == null ? "—" : lead.ratingScore}
                </td>
                <td className="max-w-[14rem] px-3 py-3 text-zinc-300 sm:px-4">
                  <span className="line-clamp-2">
                    {lead.selectedGoal?.trim() || "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-zinc-500 sm:px-4">
                  {formatCreatedDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
