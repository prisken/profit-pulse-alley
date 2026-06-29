"use client";

import { useState, useTransition } from "react";

import { CardStatusBadge, IndicatorBadge, PpaStatusBadge, getPpaStatusMessageKey, ppaStatusBadgeTone } from "@/components/admin/AdminCardStatusBadge";
import MarketPulseAdminCardPreview from "@/components/admin/MarketPulseAdminCardPreview";
import MarketPulseCardForm from "@/components/admin/MarketPulseCardForm";
import {
  createMarketPulseCardAction,
  lockMarketPulseCardPpaAction,
  publishMarketPulseCardAction,
  updateMarketPulseCardAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  getAdminCardPpaStatus,
  isCardLiveForPlayers,
} from "@/lib/market-pulse/admin-card-ppa-status";
import {
  isCardImageMissing,
  isCardPublished,
} from "@/lib/market-pulse/admin-card-filter";
import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import {
  MARKET_PULSE_DEFAULT_USER_PROMPT,
  toCardDatetimeLocalValue,
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `min-h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:text-sm ${focusRing}`;

const primaryButtonClass = `min-h-9 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:text-sm ${focusRing}`;

type ExpandedMode = null | "preview" | "edit";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function cardToPreview(card: MarketPulseAdminCardRow): MarketPulseAdminCardPreviewData {
  return {
    companyName: card.companyName,
    companyNameZh: card.companyNameZh,
    ticker: card.ticker,
    exchange: card.exchange,
    logoUrl: card.logoUrl,
    logoInitials: card.logoInitials,
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    newsBody: card.newsBody,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    sourceDate: card.sourceDate,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
    summary: card.summary,
    userPrompt: card.userPrompt,
    ppaSignal: card.ppaSignal,
    ppaInsight: card.ppaInsight,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  };
}

function cardToFormValues(card: MarketPulseAdminCardRow): Partial<MarketPulseCardFormValues> {
  return {
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    companyName: card.companyName,
    companyNameZh: card.companyNameZh ?? "",
    ticker: card.ticker,
    exchange: card.exchange ?? "",
    logoUrl: card.logoUrl ?? "",
    logoInitials: card.logoInitials ?? "",
    priceLabel: card.priceLabel ?? "",
    priceDirection: card.priceDirection ?? "",
    headline: card.headline,
    newsBody: card.newsBody ?? "",
    sourceName: card.sourceName ?? "",
    sourceUrl: card.sourceUrl ?? "",
    sourceDate: toCardDatetimeLocalValue(card.sourceDate),
    cardImageUrl: card.cardImageUrl ?? "",
    cardImageAlt: card.cardImageAlt ?? "",
    summary: card.summary ?? "",
    userPrompt: card.userPrompt ?? MARKET_PULSE_DEFAULT_USER_PROMPT,
    ppaSignal: card.ppaSignal ?? "",
    ppaInsight: card.ppaInsight ?? "",
    status: card.status,
    publishedAt: toCardDatetimeLocalValue(card.publishedAt),
    revealAt: toCardDatetimeLocalValue(card.revealAt),
    changeReason: "",
  };
}

export function buildCardPayload(values: MarketPulseCardFormValues) {
  return {
    cycleId: values.cycleId,
    dayIndex: values.dayIndex,
    companyName: values.companyName,
    companyNameZh: values.companyNameZh,
    ticker: values.ticker,
    exchange: values.exchange,
    logoUrl: values.logoUrl,
    logoInitials: values.logoInitials,
    priceLabel: values.priceLabel,
    priceDirection: values.priceDirection,
    headline: values.headline,
    newsBody: values.newsBody,
    sourceName: values.sourceName,
    sourceUrl: values.sourceUrl,
    sourceDate: values.sourceDate,
    cardImageUrl: values.cardImageUrl,
    cardImageAlt: values.cardImageAlt,
    summary: values.summary,
    userPrompt: values.userPrompt,
    ppaSignal: values.ppaSignal || null,
    ppaInsight: values.ppaInsight,
    status: values.status,
    publishedAt: values.publishedAt,
    revealAt: values.revealAt,
    changeReason: values.changeReason,
  };
}

export function CreateCardSection({
  cycleId,
  cycleName,
  nextDayIndex,
  existingDayIndexes,
  disabled,
  onRefresh,
  open: controlledOpen,
  onOpenChange,
}: {
  cycleId: string;
  cycleName: string;
  nextDayIndex: number;
  existingDayIndexes: number[];
  disabled: boolean;
  onRefresh: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  if (!open) {
    return (
      <button
        type="button"
        className={`${buttonClass} mt-1`}
        onClick={() => setOpen(true)}
      >
        {t("auth.admin.mp.createCard")}
      </button>
    );
  }

  return (
    <div className="mt-2">
      <MarketPulseCardForm
        mode="create"
        cycleId={cycleId}
        cycleName={cycleName}
        existingDayIndexes={existingDayIndexes}
        disabled={disabled}
        initialValues={{ dayIndex: nextDayIndex }}
        onCancel={() => setOpen(false)}
        onSuccess={() => {
          onRefresh();
          setOpen(false);
        }}
        onSubmit={(values) => createMarketPulseCardAction(buildCardPayload(values))}
      />
    </div>
  );
}

export function MarketPulseCardPanel({
  card,
  cycleName,
  existingDayIndexes,
  disabled,
  revealUrgent = false,
  onRefresh,
}: {
  card: MarketPulseAdminCardRow;
  cycleName?: string;
  existingDayIndexes: number[];
  disabled: boolean;
  revealUrgent?: boolean;
  onRefresh: () => void;
}) {
  const { t, locale } = useTranslations();
  const [expandedMode, setExpandedMode] = useState<ExpandedMode>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [actionIsError, setActionIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ppaStatus = getAdminCardPpaStatus(card);
  const published = isCardPublished(card);
  const playerLive = isCardLiveForPlayers(card);
  const imageMissing = isCardImageMissing(card);
  const busy = disabled || isPending;
  const preview = cardToPreview(card);
  const ppaUrgent = revealUrgent && ppaStatus.needsPpa;
  const ppaBadgeTone = ppaStatusBadgeTone(ppaStatus.kind, ppaUrgent);
  const ppaStatusLabel = t(getPpaStatusMessageKey(ppaStatus.kind));
  const canLockPpa =
    !card.ppaSignalLockedAt &&
    Boolean(card.ppaSignal) &&
    Boolean(card.ppaInsight?.trim());

  function openEdit(mode: ExpandedMode = "edit") {
    setExpandedMode(mode);
  }

  function toggleMode(mode: ExpandedMode) {
    setExpandedMode((current) => (current === mode ? null : mode));
  }

  function runCardAction(action: () => Promise<AdminActionResult>) {
    setActionMessage(null);
    setActionWarning(null);
    startTransition(async () => {
      await invokeAdminAction(action, {
        onSuccess: (successMessage, warning) => {
          setActionIsError(false);
          setActionMessage(successMessage ?? t("auth.admin.mp.saved"));
          setActionWarning(warning ?? null);
          onRefresh();
        },
        onError: (error) => {
          setActionIsError(true);
          setActionWarning(null);
          setActionMessage(error);
        },
        onThrow: () => onRefresh(),
      });
    });
  }

  return (
    <article
      id={`mp-card-${card.id}`}
      className={`scroll-mt-44 rounded-xl border p-3 sm:p-4 ${
        ppaUrgent
          ? "border-red-500/45 bg-red-500/5 shadow-sm shadow-red-950/20"
          : ppaStatus.needsPpa
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      {ppaUrgent ? (
        <p
          className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-200"
          role="status"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-red-400" aria-hidden />
          {t("auth.admin.mp.cards.ppaStatus.neededBeforeReveal")}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-zinc-800 px-2 py-1 text-xs font-bold tabular-nums text-zinc-100">
              {t("auth.admin.mp.cards.dayLabel").replace("{day}", String(card.dayIndex))}
            </span>
            <CardStatusBadge status={card.status} />
            <IndicatorBadge
              label={
                playerLive
                  ? t("auth.admin.mp.cards.playerLive")
                  : t("auth.admin.mp.cards.playerNotLive")
              }
              tone={playerLive ? "ok" : "neutral"}
            />
            <PpaStatusBadge label={ppaStatusLabel} tone={ppaBadgeTone} />
            <IndicatorBadge
              label={
                imageMissing
                  ? t("auth.admin.mp.cards.imageMissing")
                  : t("auth.admin.mp.cards.imagePresent")
              }
              tone={imageMissing ? "warn" : "ok"}
            />
          </div>

          <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-100">
            {card.headline || "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-emerald-400/90">{card.ticker}</p>
          {ppaStatus.needsPpa ? (
            <p
              className={`mt-1.5 text-xs ${
                ppaUrgent ? "font-medium text-red-200/90" : "text-amber-200/80"
              }`}
            >
              {t("auth.admin.mp.cards.ppaStatus.revealRequiredNote")}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {cycleName ? `${cycleName} · ` : ""}
            {card.decisionCount} {t("auth.admin.mp.cards.decisions")}
            {card.publishedAt
              ? ` · ${t("auth.admin.mp.cards.publishedAt")} ${formatDateTime(card.publishedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ppaStatus.needsPpa ? (
            <button
              type="button"
              className={`${ppaUrgent ? primaryButtonClass : buttonClass} ${expandedMode === "edit" ? "border-emerald-500/40 bg-emerald-500/10" : ""}`}
              disabled={busy}
              onClick={() => openEdit("edit")}
            >
              {t("auth.admin.mp.cards.editPpa")}
            </button>
          ) : null}
          <button
            type="button"
            className={`${buttonClass} ${expandedMode === "preview" ? "border-emerald-500/40 bg-emerald-500/10" : ""}`}
            disabled={busy}
            onClick={() => toggleMode("preview")}
          >
            {expandedMode === "preview"
              ? t("auth.admin.mp.cards.hidePreview")
              : t("auth.admin.mp.cards.preview")}
          </button>
          <button
            type="button"
            className={`${buttonClass} ${expandedMode === "edit" ? "border-emerald-500/40 bg-emerald-500/10" : ""}`}
            disabled={busy}
            onClick={() => toggleMode("edit")}
          >
            {expandedMode === "edit"
              ? t("auth.admin.mp.cards.hideEdit")
              : t("auth.admin.mp.cards.editCard")}
          </button>
          {canLockPpa ? (
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => runCardAction(() => lockMarketPulseCardPpaAction(card.id))}
            >
              {isPending ? t("auth.admin.mp.cards.locking") : t("auth.admin.mp.cards.lockPpa")}
            </button>
          ) : null}
          {!published ? (
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy || ppaStatus.needsPpa}
              title={ppaStatus.needsPpa ? t("auth.admin.mp.cards.lockBeforePublish") : undefined}
              onClick={() => runCardAction(() => publishMarketPulseCardAction(card.id))}
            >
              {isPending ? t("auth.admin.mp.cards.publishing") : t("auth.admin.mp.cards.publish")}
            </button>
          ) : null}
        </div>
      </div>

      {actionMessage ? (
        <p
          className={`mt-3 text-sm font-medium ${
            actionIsError ? "text-red-400" : "text-emerald-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {translateAuthMessage(locale, actionMessage)}
        </p>
      ) : null}
      {actionWarning ? (
        <p className="mt-2 text-sm font-medium text-amber-200" role="status">
          {actionWarning}
        </p>
      ) : null}

      {expandedMode === "preview" ? (
        <div className="mt-4 rounded-2xl bg-zinc-950 p-3 sm:p-4">
          <MarketPulseAdminCardPreview card={preview} />
        </div>
      ) : null}

      {expandedMode === "edit" ? (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <MarketPulseCardForm
            mode="edit"
            cycleId={card.cycleId}
            cycleName={cycleName}
            cardId={card.id}
            existingDayIndexes={existingDayIndexes}
            ppaSignalLockedAt={card.ppaSignalLockedAt}
            disabled={busy}
            initialValues={cardToFormValues(card)}
            onCancel={() => setExpandedMode(null)}
            onSuccess={() => {
              onRefresh();
              setExpandedMode(null);
            }}
            onSubmit={(values) =>
              updateMarketPulseCardAction({
                cardId: card.id,
                ...buildCardPayload(values),
              })
            }
          />
        </div>
      ) : null}
    </article>
  );
}
