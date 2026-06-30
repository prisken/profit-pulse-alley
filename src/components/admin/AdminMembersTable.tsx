"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Role } from "@prisma/client";

import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminRoleBadge from "@/components/admin/AdminRoleBadge";
import AdminUserFilters from "@/components/admin/AdminUserFilters";
import {
  deleteAdminUserAction,
  updateAdminUserRoleAction,
} from "@/lib/admin-user-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  filterAdminMembers,
  type AdminMemberRoleFilter,
} from "@/lib/admin/user-member-filter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";

export type AdminMemberRow = {
  id: string;
  name: string | null;
  email: string;
  contactNumber: string | null;
  role: "USER" | "ADMIN";
  emailVerified: string | null;
  createdAt: string;
  gameScoreCount: number;
};

type MembersTableMeta = {
  currentAdminUserId: string;
  isRowPending: (memberId: string) => boolean;
  onRequestDelete: (member: AdminMemberRow) => void;
  onActionMessage: (message: string, isError: boolean, warning?: string) => void;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

const dangerButtonClass = `min-h-9 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50 sm:text-sm ${focusRing}`;

const columnHelper = createColumnHelper<AdminMemberRow>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function displayName(member: AdminMemberRow): string {
  return member.name?.trim() || member.email;
}

function MemberActions({
  member,
  currentAdminUserId,
  isRowPending,
  onRequestDelete,
  onActionMessage,
}: Readonly<{
  member: AdminMemberRow;
  currentAdminUserId: string;
  isRowPending: boolean;
  onRequestDelete: (member: AdminMemberRow) => void;
  onActionMessage: (message: string, isError: boolean, warning?: string) => void;
}>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticRole, setOptimisticRole] = useState<Role | null>(null);
  const isSelf = member.id === currentAdminUserId;
  const busy = isPending || isRowPending;
  const roleValue = optimisticRole ?? member.role;

  function refreshAfterAction(message: string, warning?: string) {
    onActionMessage(message, false, warning);
    router.refresh();
  }

  function handleRoleChange(nextRole: Role) {
    if (nextRole === member.role) {
      return;
    }

    setOptimisticRole(nextRole);

    startTransition(async () => {
      const succeeded = await invokeAdminAction(
        () => updateAdminUserRoleAction(member.id, nextRole),
        {
          onSuccess: (successMessage, warning) => {
            setOptimisticRole(null);
            refreshAfterAction(
              translateAuthMessage(
                locale,
                successMessage ?? t("auth.admin.users.roleUpdated"),
              ),
              warning,
            );
          },
          onError: (error) => {
            setOptimisticRole(null);
            onActionMessage(translateAuthMessage(locale, error), true);
          },
          onThrow: () => {
            setOptimisticRole(null);
            router.refresh();
          },
        },
      );

      if (!succeeded) {
        setOptimisticRole(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        <span className="font-medium text-zinc-500">{t("auth.admin.users.role")}</span>
        <select
          className={`min-h-9 rounded-md border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-xs font-medium text-zinc-100 disabled:opacity-50 sm:text-sm ${focusRing}`}
          value={roleValue}
          disabled={busy}
          onChange={(event) => handleRoleChange(event.target.value as Role)}
          aria-label={`Change role for ${member.email}`}
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {isPending ? (
          <span className="text-[11px] text-zinc-500">
            {t("auth.admin.users.updatingRole")}
          </span>
        ) : null}
      </label>

      {isSelf ? (
        <p className="max-w-xs text-[11px] leading-relaxed text-zinc-500">
          {t("auth.admin.users.cannotDeleteSelf")}
        </p>
      ) : (
        <button
          type="button"
          className={dangerButtonClass}
          disabled={busy}
          onClick={() => onRequestDelete(member)}
        >
          {t("auth.admin.users.delete")}
        </button>
      )}
    </div>
  );
}

function buildColumns(t: (key: MessageKey) => string) {
  return [
    columnHelper.accessor("name", {
      header: t("auth.admin.users.colName"),
      cell: (info) => info.getValue()?.trim() || "—",
    }),
    columnHelper.accessor("email", {
      header: t("auth.admin.users.colEmail"),
      cell: (info) => (
        <span className="break-all font-mono text-xs text-zinc-300 sm:text-sm">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("contactNumber", {
      header: t("auth.admin.users.colContact"),
      cell: (info) => {
        const value = info.getValue()?.trim();
        return value ? (
          <span className="whitespace-nowrap tabular-nums text-zinc-200">
            {value}
          </span>
        ) : (
          <span className="text-zinc-500">—</span>
        );
      },
    }),
    columnHelper.accessor("role", {
      header: t("auth.admin.users.colRole"),
      cell: (info) => <AdminRoleBadge role={info.getValue()} />,
    }),
    columnHelper.accessor("gameScoreCount", {
      header: t("auth.admin.users.colScores"),
      cell: (info) => (
        <span className="tabular-nums text-zinc-200">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("emailVerified", {
      header: t("auth.admin.users.colVerified"),
      cell: (info) =>
        info.getValue() ? (
          <span className="text-emerald-400">{t("auth.admin.users.yes")}</span>
        ) : (
          <span className="text-zinc-500">{t("auth.admin.users.no")}</span>
        ),
    }),
    columnHelper.accessor("createdAt", {
      header: t("auth.admin.users.colJoined"),
      cell: (info) => (
        <span className="text-zinc-300">{formatDate(info.getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: t("auth.admin.users.colActions"),
      cell: (info) => {
        const meta = info.table.options.meta as MembersTableMeta | undefined;
        if (!meta) {
          return null;
        }
        return (
          <MemberActions
            member={info.row.original}
            currentAdminUserId={meta.currentAdminUserId}
            isRowPending={meta.isRowPending(info.row.original.id)}
            onRequestDelete={meta.onRequestDelete}
            onActionMessage={meta.onActionMessage}
          />
        );
      },
    }),
  ];
}

function MemberMobileCard({
  member,
  currentAdminUserId,
  isRowPending,
  onRequestDelete,
  onActionMessage,
}: Readonly<{
  member: AdminMemberRow;
  currentAdminUserId: string;
  isRowPending: boolean;
  onRequestDelete: (member: AdminMemberRow) => void;
  onActionMessage: (message: string, isError: boolean, warning?: string) => void;
}>) {
  const { t } = useTranslations();

  return (
    <article className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100">
            {member.name?.trim() || "—"}
          </p>
          <p className="mt-0.5 break-all font-mono text-xs text-zinc-400">
            {member.email}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            <span className="text-zinc-600">{t("auth.admin.users.colContact")}: </span>
            {member.contactNumber?.trim() || "—"}
          </p>
        </div>
        <AdminRoleBadge role={member.role} />
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-zinc-500">{t("auth.admin.users.colScores")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-zinc-200">
            {member.gameScoreCount}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("auth.admin.users.colVerified")}</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">
            {member.emailVerified ? t("auth.admin.users.yes") : t("auth.admin.users.no")}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("auth.admin.users.colJoined")}</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">
            {formatDate(member.createdAt)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 border-t border-zinc-800 pt-3">
        <MemberActions
          member={member}
          currentAdminUserId={currentAdminUserId}
          isRowPending={isRowPending}
          onRequestDelete={onRequestDelete}
          onActionMessage={onActionMessage}
        />
      </div>
    </article>
  );
}

function ActionFeedback({
  message,
  warning,
  isError,
  locale,
}: {
  message: string | null;
  warning: string | null;
  isError: boolean;
  locale: "en" | "zh-Hant";
}) {
  if (!message && !warning) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2" role="status" aria-live="polite">
      {message ? (
        <p
          className={`text-sm font-medium ${
            isError ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {translateAuthMessage(locale, message)}
        </p>
      ) : null}
      {warning ? (
        <p className="text-sm font-medium text-amber-300">{warning}</p>
      ) : null}
    </div>
  );
}

export default function AdminMembersTable({
  members,
  currentAdminUserId,
}: Readonly<{ members: AdminMemberRow[]; currentAdminUserId: string }>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminMemberRoleFilter>("ALL");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [actionIsError, setActionIsError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminMemberRow | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredMembers = useMemo(
    () => filterAdminMembers(members, query, roleFilter),
    [members, query, roleFilter],
  );

  const onActionMessage = (message: string, isError: boolean, warning?: string) => {
    setActionMessage(message);
    setActionIsError(isError);
    setActionWarning(warning ?? null);
  };

  const tableMeta = useMemo<MembersTableMeta>(
    () => ({
      currentAdminUserId,
      isRowPending: (memberId) =>
        pendingMemberId === memberId || (isDeleting && deleteTarget?.id === memberId),
      onRequestDelete: setDeleteTarget,
      onActionMessage,
    }),
    [currentAdminUserId, pendingMemberId, isDeleting, deleteTarget],
  );

  const columns = useMemo(() => buildColumns(t), [t]);

  const table = useReactTable({
    data: filteredMembers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: tableMeta,
  });

  function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    startDeleteTransition(async () => {
      setPendingMemberId(target.id);
      const succeeded = await invokeAdminAction(
        () => deleteAdminUserAction(target.id),
        {
          onSuccess: (successMessage, warning) => {
            onActionMessage(
              successMessage ?? t("auth.admin.users.userDeleted"),
              false,
              warning,
            );
            setDeleteTarget(null);
            router.refresh();
          },
          onError: (error) => {
            onActionMessage(error, true);
          },
          onThrow: () => {
            router.refresh();
          },
        },
      );

      setPendingMemberId(null);
      if (!succeeded) {
        return;
      }
    });
  }

  const countLabel =
    filteredMembers.length !== members.length
      ? translateWith(locale, "auth.admin.users.filteredCount", {
          shown: filteredMembers.length,
          total: members.length,
        })
      : members.length === 1
        ? translateWith(locale, "auth.admin.users.count", { count: members.length })
        : translateWith(locale, "auth.admin.users.countPlural", {
            count: members.length,
          });

  return (
    <>
      <AdminUserFilters
        query={query}
        roleFilter={roleFilter}
        onQueryChange={setQuery}
        onRoleFilterChange={setRoleFilter}
        disabled={isDeleting}
      />

      <p className="mt-3 text-sm text-zinc-500">{countLabel}</p>

      <ActionFeedback
        message={actionMessage}
        warning={actionWarning}
        isError={actionIsError}
        locale={locale}
      />

      {members.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
          {t("auth.admin.users.noMembers")}
        </p>
      ) : filteredMembers.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
          {t("auth.admin.users.noFilterResults")}
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 lg:hidden" aria-label={t("auth.admin.users.membersAria")}>
            {table.getRowModel().rows.map((row) => (
              <li key={row.id}>
                <MemberMobileCard
                  member={row.original}
                  currentAdminUserId={currentAdminUserId}
                  isRowPending={tableMeta.isRowPending(row.original.id)}
                  onRequestDelete={setDeleteTarget}
                  onActionMessage={onActionMessage}
                />
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-sm lg:block">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-zinc-800">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 transition-colors hover:text-zinc-200 disabled:cursor-default"
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? null}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/80 last:border-b-0 hover:bg-zinc-900/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle text-zinc-200"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title={t("auth.admin.users.deleteModalTitle")}
        description={
          deleteTarget ? (
            <p>
              {translateWith(locale, "auth.admin.users.deleteModalBody", {
                name: displayName(deleteTarget),
                email: deleteTarget.email,
              })}
            </p>
          ) : null
        }
        confirmLabel={t("auth.admin.users.deleteModalConfirm")}
        cancelLabel={t("auth.admin.users.cancel")}
        pendingLabel={t("auth.admin.users.deleting")}
        isPending={isDeleting}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
