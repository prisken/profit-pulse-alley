"use client";

import type { AdminAcquisitionFilter, AdminMemberRoleFilter } from "@/lib/admin/user-member-filter";
import {
  LEARNING_INTEREST_OPTIONS,
  NEXT_STEP_PREFERENCE_OPTIONS,
} from "@/lib/acquisition/constants";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

type Props = {
  query: string;
  roleFilter: AdminMemberRoleFilter;
  learningInterestFilter: AdminAcquisitionFilter;
  nextStepPreferenceFilter: AdminAcquisitionFilter;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: AdminMemberRoleFilter) => void;
  onLearningInterestFilterChange: (value: AdminAcquisitionFilter) => void;
  onNextStepPreferenceFilterChange: (value: AdminAcquisitionFilter) => void;
  onExportCsv?: () => void;
  exportDisabled?: boolean;
  disabled?: boolean;
};

function learningInterestMessageKey(slug: string): MessageKey {
  return `acquisition.learningInterest.option.${slug}` as MessageKey;
}

function nextStepMessageKey(slug: string): MessageKey {
  return `acquisition.nextStep.option.${slug}` as MessageKey;
}

export default function AdminUserFilters({
  query,
  roleFilter,
  learningInterestFilter,
  nextStepPreferenceFilter,
  onQueryChange,
  onRoleFilterChange,
  onLearningInterestFilterChange,
  onNextStepPreferenceFilterChange,
  onExportCsv,
  exportDisabled = false,
  disabled = false,
}: Readonly<Props>) {
  const { t } = useTranslations();

  const fieldClass = `min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 ${focusRing}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="block flex-1">
          <span className="sr-only">{t("auth.admin.users.searchLabel")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("auth.admin.users.searchPlaceholder")}
            disabled={disabled}
            className={fieldClass}
            autoComplete="off"
          />
        </label>
        <label className="block w-full sm:w-40">
          <span className="sr-only">{t("auth.admin.users.filterRole")}</span>
          <select
            value={roleFilter}
            onChange={(event) =>
              onRoleFilterChange(event.target.value as AdminMemberRoleFilter)
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.users.filterRole")}
          >
            <option value="ALL">{t("auth.admin.users.filterAll")}</option>
            <option value="USER">{t("auth.admin.users.filterUser")}</option>
            <option value="ADMIN">{t("auth.admin.users.filterAdmin")}</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="block flex-1">
          <span className="sr-only">{t("auth.admin.users.filterLearning")}</span>
          <select
            value={learningInterestFilter}
            onChange={(event) =>
              onLearningInterestFilterChange(event.target.value as AdminAcquisitionFilter)
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.users.filterLearning")}
          >
            <option value="ALL">{t("auth.admin.users.filterLearningAll")}</option>
            <option value="UNSET">{t("auth.admin.users.filterUnset")}</option>
            {LEARNING_INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(learningInterestMessageKey(option))}
              </option>
            ))}
          </select>
        </label>

        <label className="block flex-1">
          <span className="sr-only">{t("auth.admin.users.filterNextStep")}</span>
          <select
            value={nextStepPreferenceFilter}
            onChange={(event) =>
              onNextStepPreferenceFilterChange(
                event.target.value as AdminAcquisitionFilter,
              )
            }
            disabled={disabled}
            className={fieldClass}
            aria-label={t("auth.admin.users.filterNextStep")}
          >
            <option value="ALL">{t("auth.admin.users.filterNextStepAll")}</option>
            <option value="UNSET">{t("auth.admin.users.filterUnset")}</option>
            {NEXT_STEP_PREFERENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(nextStepMessageKey(option))}
              </option>
            ))}
          </select>
        </label>

        {onExportCsv ? (
          <button
            type="button"
            onClick={onExportCsv}
            disabled={disabled || exportDisabled}
            className={`min-h-11 shrink-0 rounded-lg border border-zinc-600 bg-zinc-900 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {t("auth.admin.users.exportAcquisitionCsv")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
