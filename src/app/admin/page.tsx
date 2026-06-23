import Link from "next/link";
import { redirect } from "next/navigation";

import AdminGameSettings from "@/components/admin/AdminGameSettings";
import AdminMembersTable from "@/components/admin/AdminMembersTable";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin | Profit Pulse Ally",
  description: "Manage members and VC game settings.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  let members: Array<{
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN";
    emailVerified: string | null;
    createdAt: string;
    gameScoreCount: number;
  }> = [];

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: { gameScores: true },
        },
      },
    });

    members = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      gameScoreCount: user._count.gameScores,
    }));
  } catch (error) {
    console.error("[admin] Failed to load members:", error);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-foreground/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-foreground/65">
          Signed in as {session.user.email} · {members.length} member
          {members.length === 1 ? "" : "s"}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/admin/market-pulse"
            className="font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
          >
            Market Pulse admin →
          </Link>
        </p>
      </header>

      <div className="mt-8 space-y-10">
        <AdminGameSettings />

        <section aria-labelledby="members-table-heading">
          <h2
            id="members-table-heading"
            className="text-lg font-semibold text-foreground sm:text-xl"
          >
            Members
          </h2>
          <p className="mt-1 text-sm text-foreground/65">
            All registered users and their game score counts.
          </p>
          <div className="mt-5">
            <AdminMembersTable members={members} />
          </div>
        </section>
      </div>
    </main>
  );
}
