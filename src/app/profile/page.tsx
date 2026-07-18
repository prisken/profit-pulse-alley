import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";

import { auth } from "@/auth";
import ProfileContactNumberCard from "@/components/auth/ProfileContactNumberCard";
import ProfileNotificationPreferencesCard from "@/components/auth/ProfileNotificationPreferencesCard";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate, translateWith } from "@/lib/i18n/messages";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  DEFAULT_PROFILE_NOTIFICATION_PREFERENCES,
  loadProfileNotificationPreferences,
  type ProfileNotificationPreferences,
} from "@/lib/notifications/profile-notification-preferences";
import {
  formatMarketPulseHistoryCycleLabel,
  getUserMarketPulseHistory,
} from "@/lib/market-pulse/queries";
import type { MarketPulseHistoryEntry } from "@/lib/market-pulse/types";
import {
  getMatchingPulseProfileSummary,
  type MatchingPulseProfileSummary,
} from "@/lib/matching-pulse/data";
import ProfileMatchingPulseCard from "@/components/auth/ProfileMatchingPulseCard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.profile.title"),
    description: translate(locale, "auth.meta.profile.description"),
  };
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";

function formatScore(score: number, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.NumberFormat(intlLocale).format(score);
}

function formatDate(date: Date, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatShortDate(date: Date, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function HistoryRow({
  entry,
  locale,
  t,
}: Readonly<{
  entry: MarketPulseHistoryEntry;
  locale: SiteLocale;
  t: (key: import("@/lib/i18n/messages").MessageKey) => string;
}>) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
          {translateWith(locale, "auth.profile.points", {
            score: formatScore(entry.score, locale),
          })}
        </p>
        <p className="mt-0.5 text-xs text-foreground/60 sm:text-sm">
          <span className="sm:hidden">{formatShortDate(entry.createdAt, locale)}</span>
          <span className="hidden sm:inline">{formatDate(entry.createdAt, locale)}</span>
        </p>
        {entry.cycleId ? (
          <p className="mt-0.5 text-[11px] text-foreground/45 sm:text-xs">
            {t("auth.profile.cycleLabel").replace(
              "{id}",
              formatMarketPulseHistoryCycleLabel(entry.cycleId),
            )}
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

  const { t, locale } = await getServerTranslations();
  const { user } = session;
  const displayName = user.name?.trim() || t("auth.profile.memberFallback");

  let contactNumber: string | null = null;
  let notificationPreferences: ProfileNotificationPreferences =
    DEFAULT_PROFILE_NOTIFICATION_PREFERENCES;

  try {
    const profileUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { contactNumber: true },
    });
    contactNumber = profileUser?.contactNumber ?? null;
  } catch (error) {
    console.error("[profile] Failed to load contact number:", error);
  }

  try {
    notificationPreferences = await loadProfileNotificationPreferences(user.id);
  } catch (error) {
    console.error("[profile] Failed to load notification preferences:", error);
  }

  let gameScores: MarketPulseHistoryEntry[] = [];

  try {
    gameScores = await getUserMarketPulseHistory(user.id);
  } catch (error) {
    console.error("[profile] Failed to load game scores:", error);
  }

  let matchingPulseSummary: MatchingPulseProfileSummary = {
    totalCount: 0,
    latest: null,
  };

  try {
    matchingPulseSummary = await getMatchingPulseProfileSummary(user.id);
  } catch (error) {
    console.error("[profile] Failed to load Matching Pulse summary:", error);
  }

  const latestScore = gameScores[0]?.score;
  const historyCountLabel =
    gameScores.length === 0
      ? t("auth.profile.historyEmpty")
      : gameScores.length === 1
        ? translateWith(locale, "auth.profile.historyCount", {
            count: gameScores.length,
          })
        : translateWith(locale, "auth.profile.historyCountPlural", {
            count: gameScores.length,
          });

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 overflow-x-hidden px-3 py-6 sm:space-y-6 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("auth.profile.title")}
        </h1>
        <p className="mt-1 text-xs text-foreground/65 sm:text-sm">
          {t("auth.profile.subtitle")}
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
              {t("auth.profile.latestScore")}{" "}
              <span className="font-semibold tabular-nums">
                {formatScore(latestScore, locale)}
              </span>
            </p>
          ) : null}
        </div>

        <Link
          href="/market-pulse/play"
          className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-amber-400 sm:text-sm ${focusRing}`}
        >
          {t("auth.profile.play")}
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
              {t("auth.profile.historyTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-foreground/65 sm:text-sm">
              {historyCountLabel}
            </p>
          </div>
          {gameScores.length > 0 ? (
            <Link
              href="/market-pulse"
              className={`inline-flex min-h-11 items-center text-xs font-medium text-foreground/60 underline-offset-4 hover:text-foreground hover:underline sm:text-sm ${focusRing}`}
            >
              {t("auth.profile.viewHub")}
            </Link>
          ) : null}
        </div>

        {gameScores.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-8 text-center sm:mt-5 sm:px-5 sm:py-10">
            <p className="text-sm text-foreground/75">
              {t("auth.profile.historyCta")}
            </p>
            <Link
              href="/market-pulse/play"
              className={`mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 sm:mt-4 ${focusRing}`}
            >
              {t("auth.profile.playToday")}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
            {gameScores.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} locale={locale} t={t} />
            ))}
          </ul>
        )}
      </section>

      <ProfileMatchingPulseCard
        summary={matchingPulseSummary}
        locale={locale}
        t={t}
      />

      <ProfileContactNumberCard initialContactNumber={contactNumber} />

      <ProfileNotificationPreferencesCard
        initialPreferences={notificationPreferences}
      />

      <section aria-labelledby="profile-details-heading" className={cardClass}>
        <h2
          id="profile-details-heading"
          className="text-sm font-semibold text-foreground/80 sm:text-base"
        >
          {t("auth.profile.accountDetails")}
        </h2>
        <dl className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2 sm:gap-3">
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              {t("auth.profile.fieldName")}
            </dt>
            <dd className="mt-0.5 text-foreground">{displayName}</dd>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              {t("auth.profile.fieldRole")}
            </dt>
            <dd className="mt-0.5 text-foreground">{formatRole(user.role)}</dd>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
              {t("auth.profile.fieldEmail")}
            </dt>
            <dd className="mt-0.5 break-all text-foreground">{user.email}</dd>
          </div>
        </dl>

        <form action={signOutAction} className="mt-4 border-t border-foreground/10 pt-4">
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center px-2 text-sm font-medium text-foreground/55 underline-offset-4 transition-colors hover:text-foreground hover:underline ${focusRing}`}
          >
            {t("auth.profile.signOut")}
          </button>
        </form>
      </section>
    </main>
  );
}
