"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

export type AdminMemberRow = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: string | null;
  createdAt: string;
  gameScoreCount: number;
};

const columnHelper = createColumnHelper<AdminMemberRow>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue()?.trim() || "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="break-all font-mono text-xs sm:text-sm">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("role", {
    header: "Role",
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
    header: "Scores",
    cell: (info) => (
      <span className="tabular-nums">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("emailVerified", {
    header: "Verified",
    cell: (info) =>
      info.getValue() ? (
        <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
      ) : (
        <span className="text-foreground/45">No</span>
      ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Joined",
    cell: (info) => formatDate(info.getValue()),
  }),
];

function MemberMobileCard({ member }: Readonly<{ member: AdminMemberRow }>) {
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
          <dt className="text-foreground/45">Scores</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            {member.gameScoreCount}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/45">Verified</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {member.emailVerified ? "Yes" : "No"}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/45">Joined</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatDate(member.createdAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function AdminMembersTable({
  members,
}: Readonly<{ members: AdminMemberRow[] }>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const data = useMemo(() => members, [members]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/55">
        No members found.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2 md:hidden" aria-label="Members">
        {table.getRowModel().rows.map((row) => (
          <li key={row.id}>
            <MemberMobileCard member={row.original} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-foreground/10 bg-background shadow-sm md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
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
