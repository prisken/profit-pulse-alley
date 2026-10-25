import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const weekParam = new URL(request.url).searchParams.get("week");
  const week = Number(weekParam);
  const filter = Number.isInteger(week) && week > 0 ? week : undefined;

  const rows = await prisma.webinarRegistration.findMany({
    where: filter ? { week: filter } : undefined,
    orderBy: [{ week: "asc" }, { createdAt: "asc" }],
  });

  const header = [
    "registered_at_hkt",
    "week",
    "slug",
    "name",
    "email",
    "phone",
    "company",
    "locale",
    "answers",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Intl.DateTimeFormat("en-HK", {
          dateStyle: "short",
          timeStyle: "medium",
          timeZone: "Asia/Hong_Kong",
        }).format(r.createdAt),
        r.week,
        r.slug,
        r.name ?? "",
        r.email,
        r.phone ?? "",
        r.company ?? "",
        r.locale ?? "",
        r.answers ? JSON.stringify(r.answers) : "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ppa-webinar-registrations-${filter ? `w${filter}-` : ""}${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
