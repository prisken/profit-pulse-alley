"use client";

import type { AdminMemberRoleFilter } from "@/lib/admin/user-member-filter";
import { useTranslations } from "@/components/providers/LocaleProvider";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

type Props = {
  query: string;
  roleFilter: AdminMemberRoleFilter;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: AdminMemberRoleFilter) => void;
  disabled?: boolean;
};

export default function AdminUserFilters({
  query,
  roleFilter,
  onQueryChange,
  onRoleFilterChange,
  disabled = false,
}: Readonly<Props>) {
  const { t } = useTranslations();

  const fieldClass = `min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 ${focusRing}`;

  return (
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
  );
}
