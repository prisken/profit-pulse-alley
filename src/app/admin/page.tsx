import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminGameSettings from "@/components/admin/AdminGameSettings";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import { auth } from "@/auth";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate, translateWith } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.admin.title"),
    description: translate(locale, "auth.meta.admin.description"),
  };
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { t, locale } = await getServerTranslations();

  let members: Array<{
    id: string;
    name: string | null;
    email: string;
    contactNumber: string | null;
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
        contactNumber: true,
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
      contactNumber: user.contactNumber,
      role: user.role,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      gameScoreCount: user._count.gameScores,
    }));
  } catch (error) {
    console.error("[admin] Failed to load members:", error);
  }

  const signedInLine =
    members.length === 1
      ? translateWith(locale, "auth.admin.signedInAs", {
          email: session.user.email ?? "",
          count: members.length,
        })
      : translateWith(locale, "auth.admin.signedInAsPlural", {
          email: session.user.email ?? "",
          count: members.length,
        });

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-12">
      <header className="border-b border-foreground/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">
          {t("auth.admin.badge")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("auth.admin.dashboardTitle")}
        </h1>
        <p className="mt-2 text-sm text-foreground/65">{signedInLine}</p>
        <p className="mt-3 text-sm">
          <Link
            href="/admin/market-pulse"
            className="font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("auth.admin.marketPulseLink")}
          </Link>
        </p>
      </header>

      <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
        <AdminGameSettings />

        <AdminUserManagement
          members={members}
          currentAdminUserId={session.user.id}
        />
      </div>
    </main>
  );
}
