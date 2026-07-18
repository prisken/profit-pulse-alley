"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import MatchingPulseAdminFilters from "@/components/admin/matching-pulse/MatchingPulseAdminFilters";
import MatchingPulseStatusBadge from "@/components/matching-pulse/MatchingPulseStatusBadge";
import { downloadCsv } from "@/lib/admin/csv-download";
import {
  filterMatchingPulseAdminRequests,
  type MatchingPulseAdminFilterState,
  type MatchingPulseAdminRequestRow,
} from "@/lib/matching-pulse/admin-filters";
import { buildMatchingPulseRequestsCsv } from "@/lib/matching-pulse/csv";
import {
  formatMatchingPulseCategoryLabel,
  formatMatchingPulseRequestTypeLabel,
  formatMatchingPulseUrgencyLabel,
} from "@/lib/matching-pulse/labels";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

const reviewLinkClass = `inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 sm:text-sm ${focusRing}`;

const INITIAL_FILTERS: MatchingPulseAdminFilterState = {
  status: "ALL",
  category: "ALL",
  query: "",
};

function formatCreatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

function requesterLabel(row: MatchingPulseAdminRequestRow): string {
  const name = row.user.name?.trim();
  if (name) {
    return name;
  }
  return row.user.email;
}

type MatchingPulseAdminListProps = Readonly<{
  requests: MatchingPulseAdminRequestRow[];
}>;

export default function MatchingPulseAdminList({
  requests,
}: MatchingPulseAdminListProps) {
  const [filters, setFilters] =
    useState<MatchingPulseAdminFilterState>(INITIAL_FILTERS);

  const filtered = useMemo(
    () => filterMatchingPulseAdminRequests(requests, filters),
    [requests, filters],
  );

  function handleExportCsv() {
    if (filtered.length === 0) {
      return;
    }
    const csv = buildMatchingPulseRequestsCsv(filtered);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `matching-pulse-requests-${dateStamp}.csv`);
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-zinc-300 sm:text-base">
          No Matching Pulse requests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <MatchingPulseAdminFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
        totalCount={requests.length}
        onExportCsv={handleExportCsv}
        exportDisabled={filtered.length === 0}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center sm:px-6">
          <p className="text-sm text-zinc-400">
            No requests match the current filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden" aria-label="Matching Pulse requests">
            {filtered.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-50">
                      {request.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {requesterLabel(request)}
                      <span className="text-zinc-600"> · </span>
                      <span className="break-all">{request.user.email}</span>
                    </p>
                  </div>
                  <MatchingPulseStatusBadge status={request.status} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-zinc-400">
                  <div>
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-zinc-300">
                      {formatCreatedDate(request.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Company</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {request.company?.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Type</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {formatMatchingPulseRequestTypeLabel(request.requestType)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Category</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {formatMatchingPulseCategoryLabel(request.category)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Urgency</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {request.urgency
                        ? formatMatchingPulseUrgencyLabel(request.urgency)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Source</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {request.source?.trim() || "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <Link
                    href={`/admin/matching-pulse/${request.id}`}
                    className={reviewLinkClass}
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 lg:block">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
              <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Created
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Requester
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Company
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Urgency
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Source
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                {filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-zinc-900/50">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs tabular-nums text-zinc-400">
                      {formatCreatedDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100">
                          {requesterLabel(request)}
                        </p>
                        <p className="mt-0.5 break-all text-xs text-zinc-500">
                          {request.user.email}
                        </p>
                        {request.user.contactNumber?.trim() ? (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {request.user.contactNumber}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="max-w-[8rem] truncate px-3 py-3 text-zinc-300">
                      {request.company?.trim() || "—"}
                    </td>
                    <td className="max-w-[14rem] px-3 py-3 font-medium text-zinc-100">
                      <span className="line-clamp-2">{request.title}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-300">
                      {formatMatchingPulseRequestTypeLabel(request.requestType)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-300">
                      {formatMatchingPulseCategoryLabel(request.category)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-300">
                      {request.urgency
                        ? formatMatchingPulseUrgencyLabel(request.urgency)
                        : "—"}
                    </td>
                    <td className="max-w-[8rem] truncate px-3 py-3 text-zinc-400">
                      {request.source?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <MatchingPulseStatusBadge status={request.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/matching-pulse/${request.id}`}
                        className={reviewLinkClass}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
