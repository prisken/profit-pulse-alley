import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await prisma.groupMedicalLead.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["received_hkt", "name", "email", "phone", "company_size", "locale"];
  const lines = [header.map(cell).join(",")];

  for (const r of rows) {
    lines.push(
      [
        new Intl.DateTimeFormat("en-HK", {
          dateStyle: "short",
          timeStyle: "medium",
          timeZone: "Asia/Hong_Kong",
        }).format(r.createdAt),
        r.name,
        r.email,
        r.phone,
        r.companySize,
        r.locale ?? "",
      ]
        .map(cell)
        .join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ppa-group-medical-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
