"use client";

import type { MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import type {
  AdminCardFilterState,
  AdminCardPublishFilter,
  AdminCardStatusFilter,
  AdminCardTypeFilter,
} from "@/lib/market-pulse/admin-card-filter";
import { MARKET_PULSE_CARD_STATUS_OPTIONS } from "@/lib/market-pulse/card-validation";
import { useTranslations } from "@/components/providers/LocaleProvider";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  cycles: MarketPulseAdminCycleRow[];
  filters: AdminCardFilterState;
  onChange: (filters: AdminCardFilterState) => void;
  disabled?: boolean;
  resultCount: number;
  totalCount: number;
};

const fieldClass = `min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none disabled:opacity-60 ${focusRing}`;

export default function MarketPulseCardFilters({
  cycles,
  filters,
  onChange,
  disabled = false,
  resultCount,
  totalCount,
}: Readonly<Props>) {
  const { t } = useTranslations();

  function patch(partial: Partial<AdminCardFilterState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-300">
          {t("auth.admin.mp.cards.filterTitle")}
        </p>
        <p className="text-xs text-zinc-500">
          {resultCount === totalCount
            ? t("auth.admin.mp.cards.filterCount").replace("{count}", String(totalCount))
            : t("auth.admin.mp.cards.filterCountFiltered")
                .replace("{shown}", String(resultCount))
                .replace("{total}", String(totalCount))}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="sr-only">{t("auth.admin.mp.cards.filterCycle")}</span>
          <select
            value={filters.cycleId}
            onChange={(event) => patch({ cycleId: event.target.value })}
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.mp.cards.filterCycle")}
          >
            <option value="ALL">{t("auth.admin.mp.cards.filterAllCycles")}</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">{t("auth.admin.mp.cards.filterStatus")}</span>
          <select
            value={filters.status}
            onChange={(event) =>
              patch({ status: event.target.value as AdminCardStatusFilter })
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.mp.cards.filterStatus")}
          >
            <option value="ALL">{t("auth.admin.mp.cards.filterAllStatuses")}</option>
            {MARKET_PULSE_CARD_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">{t("auth.admin.mp.cards.filterPublish")}</span>
          <select
            value={filters.publishFilter}
            onChange={(event) =>
              patch({ publishFilter: event.target.value as AdminCardPublishFilter })
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.mp.cards.filterPublish")}
          >
            <option value="ALL">{t("auth.admin.mp.cards.filterAllPublish")}</option>
            <option value="PUBLISHED">{t("auth.admin.mp.cards.filterPublished")}</option>
            <option value="UNPUBLISHED">{t("auth.admin.mp.cards.filterUnpublished")}</option>
          </select>
        </label>

        <label className="block">
          <span className="sr-only">{t("auth.admin.mp.cards.filterCardType")}</span>
          <select
            value={filters.cardTypeFilter}
            onChange={(event) =>
              patch({ cardTypeFilter: event.target.value as AdminCardTypeFilter })
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.mp.cards.filterCardType")}
          >
            <option value="ALL">{t("auth.admin.mp.cards.filterAllCardTypes")}</option>
            <option value="SIGNAL">{t("auth.admin.mp.cards.filterSignalCards")}</option>
            <option value="REST">{t("auth.admin.mp.cards.filterRestCards")}</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={filters.missingImageOnly}
            onChange={(event) => patch({ missingImageOnly: event.target.checked })}
            disabled={disabled}
            className="size-4 rounded border-zinc-600 bg-zinc-950 text-emerald-600"
          />
          {t("auth.admin.mp.cards.filterMissingImage")}
        </label>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={filters.needsPpaOnly}
            onChange={(event) => patch({ needsPpaOnly: event.target.checked })}
            disabled={disabled}
            className="size-4 rounded border-zinc-600 bg-zinc-950 text-emerald-600"
          />
          {t("auth.admin.mp.cards.filterNeedsPpa")}
        </label>
      </div>
    </div>
  );
}
