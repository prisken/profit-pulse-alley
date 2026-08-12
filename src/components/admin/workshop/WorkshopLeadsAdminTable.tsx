"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { downloadCsv } from "@/lib/admin/csv-download";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";
import { buildWorkshopLeadsCsv } from "@/lib/workshop/leads-csv";
import WorkshopSessionDetail from "@/components/admin/workshop/WorkshopSessionDetail";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

function formatCreatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

/** Proxy label for leads captured without contact details. */
export const ANONYMOUS_PLAYER_LABEL = "Anonymous player";

type WorkshopLeadsAdminTableProps = Readonly<{
  leads: WorkshopAdminLeadRow[];
}>;

export default function WorkshopLeadsAdminTable({
  leads,
}: WorkshopLeadsAdminTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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
              <th className="w-8 px-2 py-3" aria-label="Expand" />
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
            {leads.map((lead) => {
              const isOpen = expanded.has(lead.id);
              return (
                <WorkshopRow
                  key={lead.id}
                  lead={lead}
                  isOpen={isOpen}
                  onToggle={() => toggleExpanded(lead.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkshopRow({
  lead,
  isOpen,
  onToggle,
}: {
  lead: WorkshopAdminLeadRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasName = Boolean(lead.name.trim());
  const hasEmail = Boolean(lead.email.trim());
  const hasPhone = Boolean(lead.phone.trim());

  return (
    <>
      <tr
        className="cursor-pointer align-top hover:bg-zinc-900/40"
        onClick={onToggle}
      >
        <td className="px-2 py-3">
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 ${focusRing}`}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse session details" : "Expand session details"}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-3 font-medium text-zinc-100 sm:px-4">
          {hasName ? (
            lead.name
          ) : (
            <span className="font-normal italic text-zinc-500">
              {ANONYMOUS_PLAYER_LABEL}
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-zinc-300 sm:px-4">
          {hasEmail ? lead.email : <span className="text-zinc-600">—</span>}
        </td>
        <td className="px-3 py-3 text-zinc-400 sm:px-4">
          {hasPhone ? lead.phone : <span className="text-zinc-600">—</span>}
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
      {isOpen && lead.sessionJson && (
        <tr className="bg-zinc-900/30">
          <td colSpan={14} className="px-4 py-5 sm:px-6">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Session — what the user entered
            </h4>
            <div className="mt-3">
              <WorkshopSessionDetail lead={lead} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
