"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { MarketPulseCycleStatus } from "@prisma/client";

import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import {
  revealMarketPulseCycleAction,
  type RevealCycleSummary,
} from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import type { RevealPpaMissingCard } from "@/lib/market-pulse/reveal-ppa-validation";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto ${focusRing}`;

const cautionButtonClass = `min-h-10 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${focusRing}`;

export function RevealCycleLinks() {
  const { t } = useTranslations();

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/market-pulse/leaderboard" className={`${buttonClass} inline-flex items-center`}>
        {t("auth.admin.quickActions.leaderboard")} →
      </Link>
      <Link href="/market-pulse/reveal" className={`${buttonClass} inline-flex items-center`}>
        {t("auth.admin.mp.reveal.viewRevealPage")} →
      </Link>
    </div>
  );
}

function RevealSummaryPanel({ summary }: { summary: RevealCycleSummary }) {
  const { t } = useTranslations();

  return (
    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
      <p className="font-semibold">{t("auth.admin.mp.reveal.summaryTitle")}</p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <div>
          <dt className="text-emerald-200/70">{t("auth.admin.mp.reveal.decisionsScored")}</dt>
          <dd className="font-medium">{summary.decisionsScored}</dd>
        </div>
        <div>
          <dt className="text-emerald-200/70">{t("auth.admin.mp.reveal.playersScored")}</dt>
          <dd className="font-medium">{summary.usersScored}</dd>
        </div>
        <div>
          <dt className="text-emerald-200/70">{t("auth.admin.mp.reveal.scoreEvents")}</dt>
          <dd className="font-medium">{summary.eventsCreated}</dd>
        </div>
        <div>
          <dt className="text-emerald-200/70">{t("auth.admin.mp.reveal.topScore")}</dt>
          <dd className="font-medium">
            {summary.topScore !== null ? summary.topScore : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <RevealCycleLinks />
      </div>
    </div>
  );
}

type RevealCycleButtonProps = {
  cycleId: string;
  cycleName: string;
  cycleStatus: MarketPulseCycleStatus;
  disabled?: boolean;
  blockMessage?: string | null;
  onSuccess?: () => void;
};

export default function RevealCycleButton({
  cycleId,
  cycleName,
  cycleStatus,
  disabled = false,
  blockMessage = null,
  onSuccess,
}: RevealCycleButtonProps) {
  const { t, locale } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingCards, setMissingCards] = useState<RevealPpaMissingCard[] | null>(
    null,
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<RevealCycleSummary | null>(null);

  const busy = disabled || isPending;

  if (cycleStatus === "REVEALED") {
    return (
      <div className="w-full sm:w-auto">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t("auth.admin.mp.reveal.alreadyRevealed")}
        </p>
        <div className="mt-2">
          <RevealCycleLinks />
        </div>
      </div>
    );
  }

  function runReveal() {
    setError(null);
    setMissingCards(null);
    setWarning(null);
    setMessage(null);
    setSummary(null);

    startTransition(async () => {
      await invokeAdminAction(() => revealMarketPulseCycleAction(cycleId), {
        onSuccess: (successMessage, successWarning, success) => {
          setMessage(
            success?.revealSummary
              ? t("auth.admin.mp.reveal.success")
              : (successMessage ?? t("auth.admin.mp.reveal.success")),
          );
          setWarning(successWarning ?? null);
          if (success?.revealSummary) {
            setSummary(success.revealSummary);
          }
          setConfirmOpen(false);
          onSuccess?.();
        },
        onError: (actionError, _fieldErrors, data) => {
          setError(actionError);
          const payload = data as { missingCards?: RevealPpaMissingCard[] } | undefined;
          setMissingCards(payload?.missingCards ?? null);
        },
        onThrow: () => {
          setConfirmOpen(false);
          onSuccess?.();
        },
      });
    });
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        className={cautionButtonClass}
        disabled={busy}
        title={blockMessage ?? undefined}
        onClick={() => setConfirmOpen(true)}
      >
        {isPending ? t("auth.admin.reveal.pending") : t("auth.admin.reveal.button")}
      </button>

      {blockMessage && disabled ? (
        <p className="mt-2 max-w-md text-xs text-zinc-500" role="note">
          {translateAuthMessage(locale, blockMessage)}
        </p>
      ) : null}

      {error ? (
        <div className="mt-2 max-w-md" role="alert">
          <p className="text-sm font-medium text-red-400">
            {translateAuthMessage(locale, error)}
          </p>
          {missingCards && missingCards.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-300/90">
              {missingCards.map((card) => (
                <li key={card.id}>
                  {translateWith(locale, "auth.admin.mp.reveal.missingCardLine", {
                    day: String(card.dayIndex),
                    company: card.companyName,
                    headline: card.headline,
                  })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 max-w-md text-sm font-medium text-emerald-300" role="status">
          {translateAuthMessage(locale, message)}
        </p>
      ) : null}

      {warning ? (
        <p className="mt-2 max-w-md text-sm font-medium text-amber-200" role="status">
          {warning}
        </p>
      ) : null}

      {summary ? <RevealSummaryPanel summary={summary} /> : null}

      <AdminConfirmDialog
        open={confirmOpen}
        title={t("auth.admin.mp.reveal.confirmTitle")}
        description={
          <div className="space-y-3">
            <p>
              {translateWith(locale, "auth.admin.mp.reveal.confirmBody", {
                name: cycleName,
              })}
            </p>
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>{t("auth.admin.mp.reveal.confirmPpa")}</li>
              <li>{t("auth.admin.mp.reveal.confirmScores")}</li>
              <li>{t("auth.admin.mp.reveal.confirmPrize")}</li>
            </ul>
          </div>
        }
        confirmLabel={t("auth.admin.mp.reveal.confirmButton")}
        cancelLabel={t("auth.admin.users.cancel")}
        pendingLabel={t("auth.admin.reveal.pending")}
        isPending={isPending}
        variant="danger"
        onConfirm={runReveal}
        onCancel={() => {
          if (!isPending) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}
