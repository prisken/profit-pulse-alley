import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Member Profile | Profit Pulse Ally",
  description: "View your membership profile and Market Pulse game history.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-5 shadow-sm sm:p-6";

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const { user } = session;
  const displayName = user.name?.trim() || "Member";

  let gameScores: Array<{ id: string; score: number; createdAt: Date }> = [];

  try {
    gameScores = await prisma.gameScore.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, createdAt: true },
    });
  } catch (error) {
    console.error("[profile] Failed to load game scores:", error);
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-3 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-foreground/65">
          Your membership details and Market Pulse challenge history.
        </p>
      </header>

      <section aria-labelledby="profile-details-heading" className={cardClass}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {user.image ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-foreground/10">
                <Image
                  src={user.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-lg font-semibold text-foreground/70">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h2
                id="profile-details-heading"
                className="text-lg font-semibold text-foreground"
              >
                Profile Details
              </h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt className="font-medium text-foreground/50">Name</dt>
                  <dd className="mt-0.5 text-foreground">{displayName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground/50">Email</dt>
                  <dd className="mt-0.5 break-all text-foreground">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground/50">Role</dt>
                  <dd className="mt-0.5 text-foreground">
                    {formatRole(user.role)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className={`inline-flex min-h-10 w-full items-center justify-center rounded-full border border-foreground/20 bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/35 hover:bg-foreground/5 sm:w-auto ${focusRing}`}
            >
              Sign Out
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="game-history-heading" className={cardClass}>
        <h2
          id="game-history-heading"
          className="text-lg font-semibold text-foreground"
        >
          Market Pulse History
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Scores from your Market Pulse challenge runs.
        </p>

        {gameScores.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-5 py-10 text-center">
            <p className="text-sm text-foreground/75">
              You haven&apos;t played a challenge yet. Head to the Game Hub to
              test your skills!
            </p>
            <Link
              href="/game"
              className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 ${focusRing}`}
            >
              Go to Game Hub
            </Link>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-foreground/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground/70 sm:px-5"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground/70 sm:px-5"
                  >
                    Played on
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {gameScores.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-foreground sm:px-5">
                      {formatScore(entry.score)}
                    </td>
                    <td className="px-4 py-3.5 text-foreground/70 sm:px-5">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
