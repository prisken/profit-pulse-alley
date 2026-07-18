import Link from "next/link";

import MatchingPulseStatusBadge from "@/components/matching-pulse/MatchingPulseStatusBadge";
import type { MatchingPulseProfileSummary } from "@/lib/matching-pulse/data";
import type { MessageKey } from "@/lib/i18n/messages";
import { translateWith } from "@/lib/i18n/messages";
import type { SiteLocale } from "@/lib/i18n/locales";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";

const primaryCtaClass = `inline-flex min-h-11 items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 ${focusRing}`;

const secondaryCtaClass = `inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/20 bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5 ${focusRing}`;

type ProfileMatchingPulseCardProps = Readonly<{
  summary: MatchingPulseProfileSummary;
  locale: SiteLocale;
  t: (key: MessageKey) => string;
}>;

export default function ProfileMatchingPulseCard({
  summary,
  locale,
  t,
}: ProfileMatchingPulseCardProps) {
  const countLabel =
    summary.totalCount === 0
      ? t("auth.profile.matchingPulse.empty")
      : summary.totalCount === 1
        ? translateWith(locale, "auth.profile.matchingPulse.countOne", {
            count: summary.totalCount,
          })
        : translateWith(locale, "auth.profile.matchingPulse.countPlural", {
            count: summary.totalCount,
          });

  return (
    <section aria-labelledby="matching-pulse-profile-heading" className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2
            id="matching-pulse-profile-heading"
            className="text-base font-semibold text-foreground sm:text-lg"
          >
            {t("auth.profile.matchingPulse.title")}
          </h2>
          <p className="mt-0.5 text-xs text-foreground/65 sm:text-sm">
            {countLabel}
          </p>
        </div>
        <Link
          href="/matching-pulse"
          className={`inline-flex min-h-11 items-center text-xs font-medium text-foreground/60 underline-offset-4 hover:text-foreground hover:underline sm:text-sm ${focusRing}`}
        >
          {t("auth.profile.matchingPulse.learnMore")}
        </Link>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-foreground/60 sm:text-sm">
        {t("auth.profile.matchingPulse.bridge")}
      </p>

      {summary.latest ? (
        <div className="mt-4 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-3 sm:px-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
            {t("auth.profile.matchingPulse.latestLabel")}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
              {summary.latest.title}
            </p>
            <MatchingPulseStatusBadge status={summary.latest.status} />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-6 text-center sm:px-5">
          <p className="text-sm text-foreground/75">
            {t("auth.profile.matchingPulse.emptyCta")}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link href="/matching-pulse/request" className={primaryCtaClass}>
          {t("auth.profile.matchingPulse.postCta")}
        </Link>
        <Link href="/matching-pulse/my-requests" className={secondaryCtaClass}>
          {t("auth.profile.matchingPulse.viewCta")}
        </Link>
      </div>
    </section>
  );
}
