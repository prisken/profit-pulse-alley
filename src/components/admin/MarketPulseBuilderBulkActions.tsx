"use client";

import { useMemo, useState, useTransition } from "react";

import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  bulkPublishAllReadyMarketPulseCardsAction,
  bulkPublishMarketPulseCardsAction,
  bulkUnpublishMarketPulseCardsAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import {
  getReadyToPublishCards,
  type BulkPublishCardsResult,
  type BulkUnpublishCardsResult,
} from "@/lib/market-pulse/admin-bulk-card-actions";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { translateWith } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `min-h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

const primaryButtonClass = `min-h-9 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

type BulkConfirmKind = "publish" | "unpublish" | "publish_all_ready" | null;

type BulkResult =
  | { kind: "publish"; data: BulkPublishCardsResult }
  | { kind: "unpublish"; data: BulkUnpublishCardsResult };

type Props = {
  cycleId: string;
  cards: MarketPulseAdminCardRow[];
  selectedCardIds: Set<string>;
  onSelectedCardIdsChange: (ids: Set<string>) => void;
  disabled: boolean;
  onRefresh: () => void;
};

export default function MarketPulseBuilderBulkActions({
  cycleId,
  cards,
  selectedCardIds,
  onSelectedCardIdsChange,
  disabled,
  onRefresh,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [confirmKind, setConfirmKind] = useState<BulkConfirmKind>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const busy = disabled || isPending;
  const selectedCount = selectedCardIds.size;
  const readyCount = useMemo(() => getReadyToPublishCards(cards).length, [cards]);
  const allSelected = cards.length > 0 && selectedCount === cards.length;

  function toggleAll() {
    if (allSelected) {
      onSelectedCardIdsChange(new Set());
      return;
    }
    onSelectedCardIdsChange(new Set(cards.map((card) => card.id)));
  }

  function runBulkPublishAction(
    action: () => Promise<AdminActionResult<BulkPublishCardsResult>>,
  ) {
    setBulkResult(null);
    startTransition(async () => {
      await invokeAdminAction(
        action as () => Promise<AdminActionResult>,
        {
        onSuccess: (_message, _warning, result) => {
          if (result?.data && "publishedCardIds" in result.data) {
            setBulkResult({ kind: "publish", data: result.data });
          }
          onSelectedCardIdsChange(new Set());
          onRefresh();
        },
        onError: () => onRefresh(),
        onThrow: () => onRefresh(),
      });
      setConfirmKind(null);
    });
  }

  function runBulkUnpublishAction(
    action: () => Promise<AdminActionResult<BulkUnpublishCardsResult>>,
  ) {
    setBulkResult(null);
    startTransition(async () => {
      await invokeAdminAction(
        action as () => Promise<AdminActionResult>,
        {
        onSuccess: (_message, _warning, result) => {
          if (result?.data && "unpublishedCardIds" in result.data) {
            setBulkResult({ kind: "unpublish", data: result.data });
          }
          onSelectedCardIdsChange(new Set());
          onRefresh();
        },
        onError: () => onRefresh(),
        onThrow: () => onRefresh(),
      });
      setConfirmKind(null);
    });
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500"
              checked={allSelected}
              onChange={toggleAll}
              disabled={busy || cards.length === 0}
              aria-label={t("auth.admin.mp.builder.bulk.selectAll")}
            />
            <span>
              {translateWith(locale, "auth.admin.mp.builder.bulk.selectedCount", {
                count: selectedCount,
              })}
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={busy || selectedCount === 0}
            onClick={() => setConfirmKind("publish")}
          >
            {t("auth.admin.mp.builder.bulk.publishSelected")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={busy || readyCount === 0}
            onClick={() => setConfirmKind("publish_all_ready")}
          >
            {translateWith(locale, "auth.admin.mp.builder.bulk.publishAllReady", {
              count: readyCount,
            })}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={
              busy ||
              selectedCount === 0 ||
              !cards.some(
                (card) => selectedCardIds.has(card.id) && isCardPublished(card),
              )
            }
            onClick={() => setConfirmKind("unpublish")}
          >
            {t("auth.admin.mp.builder.bulk.unpublishSelected")}
          </button>
        </div>
      </div>

      {bulkResult ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
          <p className="font-medium text-zinc-100">
            {bulkResult.kind === "publish"
              ? translateWith(locale, "auth.admin.mp.builder.bulk.publishSummary", {
                  published: bulkResult.data.publishedCount,
                  skipped: bulkResult.data.skippedCount,
                })
              : translateWith(locale, "auth.admin.mp.builder.bulk.unpublishSummary", {
                  unpublished: bulkResult.data.unpublishedCount,
                  skipped: bulkResult.data.skippedCount,
                })}
          </p>
          {bulkResult.data.skipped.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
              {bulkResult.data.skipped.map((skip) => (
                <li key={`${skip.cardId}-${skip.reason}`}>
                  {skip.dayIndex > 0
                    ? translateWith(locale, "auth.admin.mp.builder.bulk.skippedItem", {
                        day: skip.dayIndex,
                        headline: skip.headline,
                        reason: skip.reason,
                      })
                    : `${skip.headline}: ${skip.reason}`}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmKind === "publish"}
        title={t("auth.admin.mp.builder.bulk.confirmPublishTitle")}
        description={
          <div className="space-y-2">
            <p>{t("auth.admin.mp.builder.bulk.confirmPublishBody")}</p>
            <p className="text-zinc-500">
              {translateWith(locale, "auth.admin.mp.builder.bulk.confirmPublishSelected", {
                count: selectedCount,
              })}
            </p>
          </div>
        }
        confirmLabel={t("auth.admin.mp.builder.bulk.confirmPublishButton")}
        cancelLabel={t("auth.admin.users.cancel")}
        isPending={isPending}
        pendingLabel={t("auth.admin.mp.cards.publishing")}
        onConfirm={() =>
          runBulkPublishAction(() =>
            bulkPublishMarketPulseCardsAction({
              cycleId,
              cardIds: [...selectedCardIds],
            }),
          )
        }
        onCancel={() => setConfirmKind(null)}
      />

      <AdminConfirmDialog
        open={confirmKind === "publish_all_ready"}
        title={t("auth.admin.mp.builder.bulk.confirmPublishTitle")}
        description={
          <div className="space-y-2">
            <p>{t("auth.admin.mp.builder.bulk.confirmPublishBody")}</p>
            <p className="text-zinc-500">
              {translateWith(locale, "auth.admin.mp.builder.bulk.confirmPublishAllReady", {
                count: readyCount,
              })}
            </p>
          </div>
        }
        confirmLabel={t("auth.admin.mp.builder.bulk.confirmPublishButton")}
        cancelLabel={t("auth.admin.users.cancel")}
        isPending={isPending}
        pendingLabel={t("auth.admin.mp.cards.publishing")}
        onConfirm={() =>
          runBulkPublishAction(() => bulkPublishAllReadyMarketPulseCardsAction(cycleId))
        }
        onCancel={() => setConfirmKind(null)}
      />

      <AdminConfirmDialog
        open={confirmKind === "unpublish"}
        title={t("auth.admin.mp.builder.bulk.confirmUnpublishTitle")}
        description={
          <div className="space-y-2">
            <p>{t("auth.admin.mp.builder.bulk.confirmUnpublishBody")}</p>
            <p className="text-zinc-500">
              {translateWith(locale, "auth.admin.mp.builder.bulk.confirmUnpublishSelected", {
                count: selectedCount,
              })}
            </p>
          </div>
        }
        confirmLabel={t("auth.admin.mp.builder.bulk.confirmUnpublishButton")}
        cancelLabel={t("auth.admin.users.cancel")}
        variant="danger"
        isPending={isPending}
        pendingLabel={t("auth.admin.mp.builder.bulk.unpublishing")}
        onConfirm={() =>
          runBulkUnpublishAction(() =>
            bulkUnpublishMarketPulseCardsAction({
              cycleId,
              cardIds: [...selectedCardIds],
            }),
          )
        }
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  );
}

export function BuilderCardCheckbox({
  cardId,
  checked,
  disabled,
  onToggle,
  label,
}: Readonly<{
  cardId: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (cardId: string) => void;
  label: string;
}>) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500"
      checked={checked}
      disabled={disabled}
      onChange={() => onToggle(cardId)}
      aria-label={label}
    />
  );
}
