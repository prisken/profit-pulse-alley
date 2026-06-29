"use client";

import { useState, useTransition } from "react";

import MarketPulseAdminCardPreview from "@/components/admin/MarketPulseAdminCardPreview";
import MarketPulseCardForm from "@/components/admin/MarketPulseCardForm";
import {
  createMarketPulseCardAction,
  lockMarketPulseCardPpaAction,
  publishMarketPulseCardAction,
  updateMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import {
  MARKET_PULSE_DEFAULT_USER_PROMPT,
  toCardDatetimeLocalValue,
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonClass = `min-h-11 w-full rounded-md border border-foreground/15 bg-foreground/5 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 sm:w-auto ${focusRing}`;

const primaryButtonClass = `min-h-11 w-full rounded-md bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto ${focusRing}`;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadge(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "READY":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
    case "CLOSED":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
    case "REVEALED":
      return "bg-violet-500/15 text-violet-800 dark:text-violet-200";
    default:
      return "bg-foreground/10 text-foreground/70";
  }
}

function cardToPreview(card: MarketPulseAdminCardRow): MarketPulseAdminCardPreviewData {
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

function buildCardPayload(values: MarketPulseCardFormValues) {
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
}: {
  cycleId: string;
  cycleName: string;
  nextDayIndex: number;
  existingDayIndexes: number[];
  disabled: boolean;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className={`${buttonClass} mt-3`}
        onClick={() => setOpen(true)}
      >
        + Create card
      </button>
    );
  }

  return (
    <div className="mt-4">
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
  onRefresh,
}: {
  card: MarketPulseAdminCardRow;
  cycleName?: string;
  existingDayIndexes: number[];
  disabled: boolean;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionIsError, setActionIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const locked = Boolean(card.ppaSignalLockedAt);
  const busy = disabled || isPending;
  const preview = cardToPreview(card);

  function runCardAction(
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) {
    setActionMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setActionIsError(true);
        setActionMessage(result.error ?? "Action failed.");
        return;
      }
      setActionIsError(false);
      setActionMessage(result.message ?? "Done.");
      onRefresh();
    });
  }

  return (
    <article className="rounded-lg border border-foreground/10 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">
              Day {card.dayIndex} · {card.companyName} ({card.ticker})
            </h3>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(card.status)}`}
            >
              {card.status}
            </span>
            {locked ? (
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                PPA locked
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{card.headline}</p>
          <p className="mt-1 text-xs text-foreground/50">
            {card.decisionCount} decisions
            {card.publishedAt ? ` · Published ${formatDateTime(card.publishedAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {card.status !== "PUBLISHED" ? (
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy || !locked}
              title={locked ? undefined : "Lock PPA signal before publishing"}
              onClick={() => runCardAction(() => publishMarketPulseCardAction(card.id))}
            >
              Publish
            </button>
          ) : null}
          {!locked ? (
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => runCardAction(() => lockMarketPulseCardPpaAction(card.id))}
            >
              Lock PPA signal
            </button>
          ) : null}
          <button
            type="button"
            className={buttonClass}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Hide edit" : "Edit"}
          </button>
        </div>
      </div>

      {actionMessage ? (
        <p
          className={`mt-3 text-sm font-medium ${
            actionIsError
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      {!editing ? (
        <div className="mt-4 rounded-2xl bg-zinc-950 p-3 sm:p-4">
          <MarketPulseAdminCardPreview card={preview} />
        </div>
      ) : (
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <MarketPulseCardForm
            mode="edit"
            cycleId={card.cycleId}
            cycleName={cycleName}
            cardId={card.id}
            existingDayIndexes={existingDayIndexes}
            ppaSignalLockedAt={card.ppaSignalLockedAt}
            disabled={busy}
            initialValues={cardToFormValues(card)}
            onCancel={() => setEditing(false)}
            onSuccess={() => {
              onRefresh();
              setEditing(false);
            }}
            onSubmit={(values) =>
              updateMarketPulseCardAction({
                cardId: card.id,
                ...buildCardPayload(values),
              })
            }
          />
        </div>
      )}
    </article>
  );
}
