import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Member Profile | Profit Pulse Ally",
  description: "View your membership profile and game scores.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const { user } = session;

  const gameScores = await prisma.gameScore.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const displayName = user.name?.trim() || "Member";

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-foreground/10 pb-6 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-foreground/70">{user.email}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-foreground/45">
                Role: {user.role}
              </p>
            </div>
          </div>

          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className={`inline-flex min-h-10 items-center justify-center rounded-full border border-foreground/20 bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/35 hover:bg-foreground/5 ${focusRing}`}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <section
        className="mt-8 sm:mt-10"
        aria-labelledby="game-scores-heading"
      >
        <h2
          id="game-scores-heading"
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          Your Game Scores
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Scores saved from the VC Investment Challenge and other games.
        </p>

        {gameScores.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground/80">
              No scores yet
            </p>
            <p className="mt-1 text-sm text-foreground/55">
              Play the{" "}
              <a
                href="/investment-challenge"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                VC Investment Challenge
              </a>{" "}
              to record your first score.
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-foreground/10 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm">
            {gameScores.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/55">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
                  {formatScore(entry.score)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
