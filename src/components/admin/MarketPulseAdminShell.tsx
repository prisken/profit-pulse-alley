"use client";

import Link from "next/link";

import type { MarketPulseStatusSnapshot, PlayabilityAlert } from "@/lib/market-pulse/admin-mp-status";
import { getMarketPulseAdminNavSections } from "@/lib/market-pulse/admin-mp-navigation";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

function statusPillClass(tone: "emerald" | "amber" | "red" | "zinc"): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "amber":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "red":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-zinc-700";
  }
}

function runtimeTone(
  status: MarketPulseStatusSnapshot["runtimeStatus"],
): "emerald" | "amber" | "red" {
  if (status === "OPEN") {
    return "emerald";
  }
  if (status === "MAINTENANCE") {
    return "amber";
  }
  return "red";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type StatusHeaderProps = {
  snapshot: MarketPulseStatusSnapshot;
};

export function MarketPulseAdminStatusHeader({ snapshot }: Readonly<StatusHeaderProps>) {
  const { t, locale } = useTranslations();

  const todayLabel = snapshot.todayCard
    ? translateWith(
        locale,
        snapshot.todayCard.shellMessage.key,
        snapshot.todayCard.shellMessage.params,
      )
    : t("auth.admin.mp.shell.todayCardUnavailable");

  const items: Array<{
    label: string;
    value: string;
    pill: "emerald" | "amber" | "red" | "zinc";
    hint?: string | null;
  }> = [
    {
      label: t("auth.admin.mp.shell.runtime"),
      value: snapshot.runtimeStatus,
      pill: runtimeTone(snapshot.runtimeStatus),
    },
    {
      label: t("auth.admin.mp.shell.activeCycle"),
      value: snapshot.activeCycleName ?? t("auth.admin.mp.none"),
      pill: snapshot.activeCycleName ? "zinc" : "amber",
    },
    {
      label: t("auth.admin.mp.shell.playerVisibility"),
      value: snapshot.playerVisible
        ? t("auth.admin.overview.playable")
        : t("auth.admin.overview.notPlayable"),
      pill: snapshot.playerVisible ? "emerald" : "amber",
      hint: snapshot.playerVisibilityReason,
    },
    {
      label: t("auth.admin.mp.shell.todayCard"),
      value: todayLabel,
      pill:
        snapshot.todayCard?.tone === "ok"
          ? "emerald"
          : snapshot.todayCard
            ? "amber"
            : "zinc",
    },
    {
      label: t("auth.admin.mp.statRevealDate"),
      value: snapshot.revealAt ? formatDateTime(snapshot.revealAt) : "—",
      pill: "zinc",
    },
    {
      label: t("auth.admin.mp.statPrize"),
      value: snapshot.prizeLabel?.trim() || "—",
      pill: "zinc",
    },
  ];

  return (
    <div className="sticky top-0 z-30 -mx-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex max-w-full rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(item.pill)}`}
              >
                <span className="truncate">{item.value}</span>
              </span>
            </div>
            {item.hint ? (
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type QuickActionsProps = {
  onQuickCreateNextCycle?: () => void;
  quickCreateDisabled?: boolean;
};

export function MarketPulseAdminQuickActions({
  onQuickCreateNextCycle,
  quickCreateDisabled = false,
}: Readonly<QuickActionsProps> = {}) {
  const { t } = useTranslations();

  const linkClass = `inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 ${focusRing}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="w-full text-xs text-zinc-500 sm:mr-auto sm:w-auto">
        {t("auth.admin.mp.nav.playerLinksHint")}
      </p>
      <Link href="/market-pulse" className={linkClass}>
        {t("auth.admin.quickActions.hub")}
      </Link>
      <Link href="/market-pulse/play" className={linkClass}>
        {t("auth.admin.quickActions.play")}
      </Link>
      <Link href="/market-pulse/leaderboard" className={linkClass}>
        {t("auth.admin.quickActions.leaderboard")}
      </Link>
      <Link href="/market-pulse/reveal" className={linkClass}>
        {t("auth.admin.mp.nav.publicReveal")}
      </Link>
      {onQuickCreateNextCycle ? (
        <button
          type="button"
          className={`${linkClass} border-emerald-600/40 text-emerald-200 hover:bg-emerald-500/10 sm:ml-auto`}
          disabled={quickCreateDisabled}
          onClick={onQuickCreateNextCycle}
        >
          {t("auth.admin.mp.quickCreate.button")}
        </button>
      ) : null}
    </div>
  );
}

type AlertsProps = {
  alerts: PlayabilityAlert[];
};

export function MarketPulseAdminAlerts({ alerts }: Readonly<AlertsProps>) {
  const { t } = useTranslations();

  if (alerts.length === 0) {
    return (
      <div
        className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200"
        role="status"
      >
        {t("auth.admin.mp.shell.noAlerts")}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      role="alert"
    >
      <p className="text-sm font-semibold text-amber-100">
        {t("auth.admin.mp.shell.alertsTitle")}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm text-amber-100/90">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex gap-2">
            <span
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                alert.severity === "error" ? "bg-red-400" : "bg-amber-400"
              }`}
              aria-hidden
            />
            <span>{alert.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PpaRevealWarningBannerProps = {
  revealAtLabel: string;
  missingCount: number;
  cards: Array<{
    id: string;
    dayIndex: number;
    ticker: string;
    headline: string;
    missingFieldsLabel: string;
  }>;
  onEditCard: (cardId: string) => void;
};

export function MarketPulsePpaRevealWarningBanner({
  revealAtLabel,
  missingCount,
  cards,
  onEditCard,
}: Readonly<PpaRevealWarningBannerProps>) {
  const { t, locale } = useTranslations();

  return (
    <div
      className="rounded-xl border-2 border-red-500/40 bg-red-500/10 px-4 py-4 shadow-lg shadow-red-950/20"
      role="alert"
    >
      <p className="text-base font-semibold text-red-100">
        {t("auth.admin.mp.ppaWarning.title")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-red-100/90">
        {translateWith(locale, "auth.admin.mp.ppaWarning.message", {
          revealAt: revealAtLabel,
          count: String(missingCount),
        })}
      </p>
      <ul className="mt-3 space-y-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex flex-col gap-2 rounded-lg border border-red-500/25 bg-zinc-950/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-sm text-red-50/95">
              <p className="font-medium">
                {translateWith(locale, "auth.admin.mp.ppaWarning.cardLine", {
                  day: String(card.dayIndex),
                  ticker: card.ticker,
                })}
              </p>
              <p className="mt-0.5 truncate text-xs text-red-100/75">{card.headline}</p>
              <p className="mt-1 text-xs text-red-200/80">
                {translateWith(locale, "auth.admin.mp.ppaWarning.missingFields", {
                  fields: card.missingFieldsLabel,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditCard(card.id)}
              className={`shrink-0 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-50 transition-colors hover:bg-red-500/25 ${focusRing}`}
            >
              {t("auth.admin.mp.ppaWarning.editCard")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketPulsePpaCompleteBadge() {
  const { t } = useTranslations();

  return (
    <div
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
      role="status"
    >
      {t("auth.admin.mp.ppaWarning.allComplete")}
    </div>
  );
}

export type { MarketPulseAdminNavSection } from "@/lib/market-pulse/admin-mp-navigation";

export function MarketPulseAdminSectionNav() {
  const { t } = useTranslations();
  const sections = getMarketPulseAdminNavSections();

  return (
    <nav
      aria-label={t("auth.admin.mp.shell.sectionNav")}
      className="sticky top-[calc(var(--mp-status-offset,0px)+0.5rem)] z-20 -mx-1 overflow-x-auto px-1 py-2"
    >
      <ul className="flex min-w-max gap-1.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`inline-flex min-h-9 items-center rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 sm:text-sm ${focusRing}`}
            >
              {t(section.labelKey as MessageKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type SectionProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function MarketPulseAdminSection({
  id,
  title,
  description,
  children,
}: Readonly<SectionProps>) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-36 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm sm:p-5 lg:scroll-mt-44"
    >
      <h2 id={`${id}-heading`} className="text-base font-semibold text-zinc-50 sm:text-lg">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
