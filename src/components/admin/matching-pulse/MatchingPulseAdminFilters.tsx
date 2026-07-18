"use client";

import type { MatchingPulseAdminFilterState } from "@/lib/matching-pulse/admin-filters";
import {
  parseMatchingPulseAdminCategoryFilter,
  parseMatchingPulseAdminStatusFilter,
} from "@/lib/matching-pulse/admin-filters";
import {
  MATCHING_PULSE_CATEGORIES,
  MATCHING_PULSE_STATUSES,
} from "@/lib/matching-pulse/constants";
import {
  MATCHING_PULSE_CATEGORY_LABELS,
  MATCHING_PULSE_STATUS_LABELS,
} from "@/lib/matching-pulse/labels";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 ${focusRing}`;

type MatchingPulseAdminFiltersProps = Readonly<{
  filters: MatchingPulseAdminFilterState;
  onChange: (filters: MatchingPulseAdminFilterState) => void;
  resultCount: number;
  totalCount: number;
  onExportCsv?: () => void;
  exportDisabled?: boolean;
}>;

export default function MatchingPulseAdminFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  onExportCsv,
  exportDisabled = false,
}: MatchingPulseAdminFiltersProps) {
  function patch(partial: Partial<MatchingPulseAdminFilterState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-300">Filters</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-zinc-500">
            {resultCount === totalCount
              ? `${totalCount} request${totalCount === 1 ? "" : "s"}`
              : `Showing ${resultCount} of ${totalCount}`}
          </p>
          {onExportCsv ? (
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exportDisabled}
              className={`min-h-9 shrink-0 rounded-lg border border-zinc-600 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-4 sm:text-sm ${focusRing}`}
            >
              Export CSV
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="Search title, company, name, email…"
            className={fieldClass}
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="sr-only">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              patch({
                status: parseMatchingPulseAdminStatusFilter(event.target.value),
              })
            }
            className={fieldClass}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            {MATCHING_PULSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MATCHING_PULSE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Category</span>
          <select
            value={filters.category}
            onChange={(event) =>
              patch({
                category: parseMatchingPulseAdminCategoryFilter(
                  event.target.value,
                ),
              })
            }
            className={fieldClass}
            aria-label="Filter by category"
          >
            <option value="ALL">All categories</option>
            {MATCHING_PULSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {MATCHING_PULSE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
