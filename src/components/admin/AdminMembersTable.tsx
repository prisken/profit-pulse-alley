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
      <span className="font-mono text-xs sm:text-sm">{info.getValue()}</span>
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

  return (
    <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-background shadow-sm">
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
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-foreground/55"
              >
                No members found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
