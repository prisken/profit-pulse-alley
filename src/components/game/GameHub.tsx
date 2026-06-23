"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trophy } from "lucide-react";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  playerName: string;
  score: number;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

export default function GameHub({
  leaderboard,
}: Readonly<{ leaderboard: LeaderboardEntry[] }>) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-500">
          <Trophy className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Game Hub
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/70">
          Compete in Market Pulse and climb the leaderboard.
        </p>
      </header>

      <section
        className="mt-8 sm:mt-10"
        aria-labelledby="leaderboard-heading"
      >
        <h2
          id="leaderboard-heading"
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          Leaderboard
        </h2>
        <p className="mt-1 text-sm text-foreground/60">Top 10 scores</p>

        {leaderboard.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground/80">
              No scores yet
            </p>
            <p className="mt-1 text-sm text-foreground/55">
              Be the first to post a score on the board.
            </p>
          </div>
        ) : (
          <ol className="mt-5 divide-y divide-foreground/10 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm">
            {leaderboard.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                    entry.rank === 1
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : entry.rank <= 3
                        ? "bg-foreground/8 text-foreground/80"
                        : "bg-foreground/5 text-foreground/55"
                  }`}
                  aria-label={`Rank ${entry.rank}`}
                >
                  {entry.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:text-base">
                  {entry.playerName}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:text-base">
                  {formatScore(entry.score)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8 sm:mt-10" aria-labelledby="play-game-heading">
        <h2 id="play-game-heading" className="sr-only">
          Play game
        </h2>
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-5 py-6 text-center sm:px-8 sm:py-8">
          {isAuthenticated ? (
            <Link
              href="/market-pulse"
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 ${focusRing}`}
            >
              Play Game
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full bg-foreground/40 px-8 py-3 text-sm font-semibold text-background/80"
            >
              {isLoading ? "Checking session…" : "Play Game"}
            </button>
          )}

          {!isAuthenticated && !isLoading ? (
            <p className="mt-3 text-sm text-foreground/65">
              <Link
                href="/login?callbackUrl=/game"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to play and save your score.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
