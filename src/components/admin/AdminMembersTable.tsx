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

import {
  deleteAdminUserAction,
  updateAdminUserRoleAction,
} from "@/lib/admin-user-actions";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import type { MessageKey } from "@/lib/i18n/messages";

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
  onActionMessage: (message: string, isError: boolean) => void;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonClass = `min-h-9 rounded-md border border-foreground/15 bg-foreground/5 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 sm:text-sm ${focusRing}`;

const dangerButtonClass = `min-h-9 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/15 disabled:opacity-50 dark:text-red-300 sm:text-sm ${focusRing}`;

const columnHelper = createColumnHelper<AdminMemberRow>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function MemberActions({
  member,
  currentAdminUserId,
  onActionMessage,
}: Readonly<{
  member: AdminMemberRow;
  currentAdminUserId: string;
  onActionMessage: (message: string, isError: boolean) => void;
}>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSelf = member.id === currentAdminUserId;

  function refreshAfterAction(message: string) {
    onActionMessage(message, false);
    setConfirmDelete(false);
    router.refresh();
  }

  function handleRoleChange(nextRole: Role) {
    if (nextRole === member.role) {
      return;
    }
    startTransition(async () => {
      const result = await updateAdminUserRoleAction(member.id, nextRole);
      if (!result.ok) {
        onActionMessage(translateAuthMessage(locale, result.error), true);
        return;
      }
      refreshAfterAction(
        translateAuthMessage(locale, result.message ?? t("auth.admin.users.roleUpdated")),
      );
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdminUserAction(member.id);
      if (!result.ok) {
        onActionMessage(translateAuthMessage(locale, result.error), true);
        return;
      }
      refreshAfterAction(
        translateAuthMessage(locale, result.message ?? t("auth.admin.users.userDeleted")),
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex items-center gap-2 text-xs text-foreground/70">
        <span className="sr-only">Role for {member.email}</span>
        <select
          className={`min-h-9 rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-xs font-medium text-foreground disabled:opacity-50 sm:text-sm ${focusRing}`}
          value={member.role}
          disabled={isPending}
          onChange={(event) => handleRoleChange(event.target.value as Role)}
          aria-label={`Change role for ${member.email}`}
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </label>

      {isSelf ? (
        <span className="text-[11px] text-foreground/45">{t("auth.admin.users.cannotDeleteSelf")}</span>
      ) : confirmDelete ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground/70">
            {t("auth.admin.users.deletePrompt").replace("{email}", member.email)}
          </span>
          <button
            type="button"
            className={dangerButtonClass}
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? t("auth.admin.users.deleting") : t("auth.admin.users.confirm")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={isPending}
            onClick={() => setConfirmDelete(false)}
          >
            {t("auth.admin.users.cancel")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={dangerButtonClass}
          disabled={isPending}
          onClick={() => setConfirmDelete(true)}
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
        <span className="break-all font-mono text-xs sm:text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("role", {
      header: t("auth.admin.users.colRole"),
      cell: (info) => {
        const role = info.getValue();
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              role === "ADMIN"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-foreground/8 text-foreground/70"
            }`}
          >
            {role}
          </span>
        );
      },
    }),
    columnHelper.accessor("gameScoreCount", {
      header: t("auth.admin.users.colScores"),
      cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
    }),
    columnHelper.accessor("emailVerified", {
      header: t("auth.admin.users.colVerified"),
      cell: (info) =>
        info.getValue() ? (
          <span className="text-emerald-600 dark:text-emerald-400">{t("auth.admin.users.yes")}</span>
        ) : (
          <span className="text-foreground/45">{t("auth.admin.users.no")}</span>
        ),
    }),
    columnHelper.accessor("createdAt", {
      header: t("auth.admin.users.colJoined"),
      cell: (info) => formatDate(info.getValue()),
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
  onActionMessage,
}: Readonly<{
  member: AdminMemberRow;
  currentAdminUserId: string;
  onActionMessage: (message: string, isError: boolean) => void;
}>) {
  const { t } = useTranslations();

  return (
    <article className="rounded-xl border border-foreground/10 bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {member.name?.trim() || "—"}
          </p>
          <p className="mt-0.5 break-all font-mono text-xs text-foreground/70">
            {member.email}
          </p>
          {member.contactNumber ? (
            <p className="mt-0.5 text-xs text-foreground/55">{member.contactNumber}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            member.role === "ADMIN"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-foreground/8 text-foreground/70"
          }`}
        >
          {member.role}
        </span>
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-foreground/45">{t("auth.admin.users.colScores")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            {member.gameScoreCount}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/45">{t("auth.admin.users.colVerified")}</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {member.emailVerified ? t("auth.admin.users.yes") : t("auth.admin.users.no")}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/45">{t("auth.admin.users.colJoined")}</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatDate(member.createdAt)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 border-t border-foreground/10 pt-3">
        <MemberActions
          member={member}
          currentAdminUserId={currentAdminUserId}
          onActionMessage={onActionMessage}
        />
      </div>
    </article>
  );
}

export default function AdminMembersTable({
  members,
  currentAdminUserId,
}: Readonly<{ members: AdminMemberRow[]; currentAdminUserId: string }>) {
  const { t, locale } = useTranslations();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionIsError, setActionIsError] = useState(false);

  const onActionMessage = (message: string, isError: boolean) => {
    setActionMessage(message);
    setActionIsError(isError);
  };

  const tableMeta = useMemo<MembersTableMeta>(
    () => ({
      currentAdminUserId,
      onActionMessage,
    }),
    [currentAdminUserId],
  );

  const data = useMemo(() => members, [members]);
  const columns = useMemo(() => buildColumns(t), [t]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: tableMeta,
  });

  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/55">
        {t("auth.admin.users.noMembers")}
      </p>
    );
  }

  return (
    <>
      {actionMessage ? (
        <p
          className={`mb-3 text-sm font-medium ${
            actionIsError
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
          role="status"
        >
          {translateAuthMessage(locale, actionMessage)}
        </p>
      ) : null}

      <ul className="space-y-2 lg:hidden" aria-label={t("auth.admin.users.membersAria")}>
        {table.getRowModel().rows.map((row) => (
          <li key={row.id}>
            <MemberMobileCard
              member={row.original}
              currentAdminUserId={currentAdminUserId}
              onActionMessage={onActionMessage}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-foreground/10 bg-background shadow-sm lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-foreground/10">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/55"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground disabled:cursor-default"
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
                className="border-b border-foreground/5 last:border-b-0 hover:bg-foreground/[0.02]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 align-middle text-foreground/90"
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
  );
}
