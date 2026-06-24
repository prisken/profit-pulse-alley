import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";

import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import {
  formatMarketPulseHistoryCycleLabel,
  getUserMarketPulseHistory,
} from "@/lib/market-pulse/queries";
import type { MarketPulseHistoryEntry } from "@/lib/market-pulse/types";

export const metadata = {
  title: "Member Profile | Profit Pulse Ally",
  description: "View your membership profile and Market Pulse game history.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";

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

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function HistoryRow({ entry }: Readonly<{ entry: MarketPulseHistoryEntry }>) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
          {formatScore(entry.score)} pts
        </p>
        <p className="mt-0.5 text-xs text-foreground/60 sm:text-sm">
          <span className="sm:hidden">{formatShortDate(entry.createdAt)}</span>
          <span className="hidden sm:inline">{formatDate(entry.createdAt)}</span>
        </p>
        {entry.cycleId ? (
          <p className="mt-0.5 text-[11px] text-foreground/45 sm:text-xs">
            Cycle {formatMarketPulseHistoryCycleLabel(entry.cycleId)}
          </p>
        ) : null}
      </div>
      <Trophy
        className="h-4 w-4 shrink-0 text-amber-500/70 sm:h-5 sm:w-5"
        aria-hidden="true"
      />
    </li>
  );
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const { user } = session;
  const displayName = user.name?.trim() || "Member";

  let gameScores: MarketPulseHistoryEntry[] = [];

  try {
    gameScores = await getUserMarketPulseHistory(user.id);
  } catch (error) {
    console.error("[profile] Failed to load game scores:", error);
  }

  const latestScore = gameScores[0]?.score;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 overflow-x-hidden px-3 py-6 sm:space-y-6 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-xs text-foreground/65 sm:text-sm">
          Your Market Pulse history and membership details.
        </p>
      </header>

      <section
        aria-labelledby="member-summary-heading"
        className={`${cardClass} flex items-center gap-3 sm:gap-4`}
      >
        {user.image ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-foreground/10 sm:h-14 sm:w-14">
            <Image
              src={user.image}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-base font-semibold text-foreground/70 sm:h-14 sm:w-14 sm:text-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2
            id="member-summary-heading"
            className="truncate text-base font-semibold text-foreground sm:text-lg"
          >
            {displayName}
          </h2>
          <p className="mt-0.5 truncate text-xs text-foreground/60 sm:text-sm">
            {user.email}
          </p>
          {latestScore != null ? (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 sm:text-sm">
              Latest score:{" "}
              <span className="font-semibold tabular-nums">
                {formatScore(latestScore)}
              </span>
            </p>
          ) : null}
        </div>

        <Link
          href="/market-pulse/play"
          className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-amber-400 sm:text-sm ${focusRing}`}
        >
          Play
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="game-history-heading" className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id="game-history-heading"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              Market Pulse History
            </h2>
            <p className="mt-0.5 text-xs text-foreground/65 sm:text-sm">
              {gameScores.length === 0
                ? "No challenge runs saved yet."
                : `${gameScores.length} run${gameScores.length === 1 ? "" : "s"} recorded`}
            </p>
          </div>
          {gameScores.length > 0 ? (
            <Link
              href="/market-pulse"
              className={`inline-flex min-h-11 items-center text-xs font-medium text-foreground/60 underline-offset-4 hover:text-foreground hover:underline sm:text-sm ${focusRing}`}
            >
              View hub
            </Link>
          ) : null}
        </div>

        {gameScores.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-8 text-center sm:mt-5 sm:px-5 sm:py-10">
            <p className="text-sm text-foreground/75">
              Play today&apos;s card to start building your history.
            </p>
            <Link
              href="/market-pulse/play"
              className={`mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 sm:mt-4 ${focusRing}`}
            >
              Play Today&apos;s Card
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
            {gameScores.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="profile-details-heading" className={cardClass}>
        <h2
          id="profile-details-heading"
          className="text-sm font-semibold text-foreground/80 sm:text-base"
        >
          Account details
        </h2>
        <dl className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2 sm:gap-3">
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              Name
            </dt>
            <dd className="mt-0.5 text-foreground">{displayName}</dd>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              Role
            </dt>
            <dd className="mt-0.5 text-foreground">{formatRole(user.role)}</dd>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              Email
            </dt>
            <dd className="mt-0.5 break-all text-foreground">{user.email}</dd>
          </div>
        </dl>

        <form action={signOutAction} className="mt-4 border-t border-foreground/10 pt-4">
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center px-2 text-sm font-medium text-foreground/55 underline-offset-4 transition-colors hover:text-foreground hover:underline ${focusRing}`}
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
