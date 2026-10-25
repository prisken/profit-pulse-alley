import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Webinar registrations | PPA Admin",
};

const WEEK_LABEL: Record<number, string> = {
  1: "W1 · Founder Protection",
  2: "W2 · Asset-Holding Shell",
  3: "W3 · New Family Risk Reset",
  4: "W4 · Tax-Smart Retirement",
  5: "W5 · SME Hidden Liability",
  6: "W6 · Premium Financing",
  7: "W7 · Homebuyer Playbook",
  8: "W8 · Legacy Architecture",
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(d);
}

function answerSummary(answers: unknown): string {
  if (!answers || typeof answers !== "object") return "—";
  const a = answers as Record<string, unknown>;
  return ["shareholders", "agreement", "cover", "concern", "lifeStage", "vip", "xray", "checklist"]
    .map((k) => (typeof a[k] === "string" && a[k] ? `${k}: ${a[k]}` : null))
    .filter(Boolean)
    .join(" · ") || "—";
}

export default async function AdminWebinarsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const week = Number(sp.week);
  const filter = Number.isInteger(week) && week > 0 ? week : undefined;

  const [rows, grouped, total] = await Promise.all([
    prisma.webinarRegistration.findMany({
      where: filter ? { week: filter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.webinarRegistration.groupBy({ by: ["week"], _count: { _all: true } }),
    prisma.webinarRegistration.count(),
  ]);

  const counts = new Map(grouped.map((g) => [g.week, g._count._all]));
  const exportHref = `/api/admin/webinar-registrations/export${filter ? `?week=${filter}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            PPA Webinar Series 2026
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Webinar registrations</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} registration{total === 1 ? "" : "s"} across the series. Times shown in HKT.
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Export CSV
        </a>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((w) => (
          <Link
            key={w}
            href={filter === w ? "/admin/webinars" : `/admin/webinars?week=${w}`}
            className={`rounded-xl border p-4 transition ${
              filter === w
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{WEEK_LABEL[w]}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{counts.get(w) ?? 0}</p>
          </Link>
        ))}
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/admin/webinars"
          className={`rounded-full px-3 py-1.5 ${!filter ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-100"}`}
        >
          All weeks
        </Link>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
          <Link
            key={w}
            href={`/admin/webinars?week=${w}`}
            className={`rounded-full px-3 py-1.5 ${filter === w ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-100"}`}
          >
            W{w}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900/80 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-4 py-3 font-semibold">Registered</th>
              <th className="px-4 py-3 font-semibold">Week</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">WhatsApp</th>
              <th className="px-4 py-3 font-semibold">Lang</th>
              <th className="px-4 py-3 font-semibold">Answers</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800/80 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{fmt(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-emerald-400">W{r.week}</td>
                  <td className="px-4 py-3">{r.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-xs uppercase text-zinc-500">
                    {r.locale === "zh-Hant" ? "ZH" : "EN"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{answerSummary(r.answers)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-zinc-500">
        Showing the newest {Math.min(rows.length, 500)} registrations{filter ? ` for week ${filter}` : ""}.
        Registrations are recorded by <code className="text-zinc-400">/api/events/register</code>.
      </p>
    </div>
  );
}
