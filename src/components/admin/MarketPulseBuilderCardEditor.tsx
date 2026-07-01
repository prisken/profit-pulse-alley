"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  CardStatusBadge,
  IndicatorBadge,
  PpaStatusBadge,
  getPpaStatusMessageKey,
  ppaStatusBadgeTone,
} from "@/components/admin/AdminCardStatusBadge";
import MarketPulseAdminCardPreview from "@/components/admin/MarketPulseAdminCardPreview";
import MarketPulseCardForm from "@/components/admin/MarketPulseCardForm";
import {
  buildCardPayload,
  cardToFormValues,
} from "@/components/admin/MarketPulseCardPanel";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  requestFormDraftSave,
  shouldTriggerDraftSaveShortcut,
} from "@/lib/market-pulse/admin-card-form-ui";
import {
  lockMarketPulseCardPpaAction,
  publishMarketPulseCardAction,
  updateMarketPulseCardDraftAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import { buildBuilderCardValidationSummary } from "@/lib/market-pulse/admin-builder-card-validation";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  getAdminCardPpaStatus,
  isCardLiveForPlayers,
} from "@/lib/market-pulse/admin-card-ppa-status";
import { formatBuilderDayCardLabel, sortMarketPulseBuilderCards } from "@/lib/market-pulse/admin-card-scheduling";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import type { MarketPulseCardFormValues } from "@/lib/market-pulse/card-validation";
import { cardFormValuesToPreview } from "@/lib/market-pulse/card-validation";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const BUILDER_CARD_FORM_ID = "mp-builder-card-form";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `min-h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

const primaryButtonClass = `min-h-9 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

type Props = {
  card: MarketPulseAdminCardRow;
  cards: MarketPulseAdminCardRow[];
  cycleStartsAt: string;
  cycleEndsAt: string;
  cycleName?: string;
  existingDayIndexes: number[];
  disabled: boolean;
  revealUrgent?: boolean;
  previewOpen?: boolean;
  onPreviewOpenChange?: (open: boolean) => void;
  onRefresh: () => void;
  onDuplicate: (cardId: string) => void;
  onSelectCard: (cardId: string) => void;
  onAddAnother: () => void;
  autoFocusFirstField?: boolean;
  onAutoFocusHandled?: () => void;
};

export default function MarketPulseBuilderCardEditor({
  card,
  cards,
  cycleStartsAt,
  cycleEndsAt,
  cycleName,
  existingDayIndexes,
  disabled,
  revealUrgent = false,
  previewOpen: controlledPreviewOpen,
  onPreviewOpenChange,
  onRefresh,
  onDuplicate,
  onSelectCard,
  onAddAnother,
  autoFocusFirstField = false,
  onAutoFocusHandled,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [internalPreviewOpen, setInternalPreviewOpen] = useState(false);
  const previewOpen = controlledPreviewOpen ?? internalPreviewOpen;
  const setPreviewOpen = onPreviewOpenChange ?? setInternalPreviewOpen;
  const validationSummaryRef = useRef<HTMLDivElement>(null);
  const initialFormValues = useMemo(
    () => cardToFormValues(card) as MarketPulseCardFormValues,
    [card],
  );
  const [formValues, setFormValues] = useState(initialFormValues);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [actionIsError, setActionIsError] = useState(false);

  const sortedCards = useMemo(
    () => sortMarketPulseBuilderCards(cards),
    [cards],
  );
  const cardIndex = sortedCards.findIndex((row) => row.id === card.id);
  const previousCard = cardIndex > 0 ? sortedCards[cardIndex - 1] : null;
  const nextCard =
    cardIndex >= 0 && cardIndex < sortedCards.length - 1
      ? sortedCards[cardIndex + 1]
      : null;

  const ppaStatus = getAdminCardPpaStatus(card);
  const published = isCardPublished(card);
  const playerLive = isCardLiveForPlayers(card, cycleStartsAt);
  const busy = disabled || isPending;
  const preview = useMemo(
    () => cardFormValuesToPreview(formValues, card.ppaSignalLockedAt),
    [formValues, card.ppaSignalLockedAt],
  );
  const ppaUrgent = revealUrgent && ppaStatus.needsPpa;
  const ppaBadgeTone = ppaStatusBadgeTone(ppaStatus.kind, ppaUrgent);
  const ppaStatusLabel = t(getPpaStatusMessageKey(ppaStatus.kind));

  const validationSummary = useMemo(
    () =>
      buildBuilderCardValidationSummary({
        values: formValues,
        existingDayIndexes,
        excludeDayIndex: card.dayIndex,
        ppaSignalLockedAt: card.ppaSignalLockedAt,
        cycle: { startsAt: cycleStartsAt, endsAt: cycleEndsAt },
        schedulingCards: cards,
        cardId: card.id,
      }),
    [
      formValues,
      existingDayIndexes,
      card.dayIndex,
      card.ppaSignalLockedAt,
      card.id,
      cycleStartsAt,
      cycleEndsAt,
      cards,
    ],
  );

  const canLockPpa =
    !card.ppaSignalLockedAt &&
    Boolean(formValues.ppaSignal) &&
    Boolean(formValues.ppaInsight.trim());

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldTriggerDraftSaveShortcut(event)) {
        event.preventDefault();
        if (!busy) {
          requestFormDraftSave(BUILDER_CARD_FORM_ID);
        }
        return;
      }

      if (event.key === "Escape" && previewOpen) {
        event.preventDefault();
        setPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, previewOpen, setPreviewOpen]);

  function focusValidationSummary() {
    validationSummaryRef.current?.focus();
    validationSummaryRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  function runCardAction(action: () => Promise<AdminActionResult>) {
    setMessage(null);
    setWarning(null);
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
          focusValidationSummary();
        },
        onThrow: () => onRefresh(),
      });
    });
  }

  function setMessage(message: string | null) {
    setActionMessage(message);
  }

  function setWarning(message: string | null) {
    setActionWarning(message);
  }

  function handlePublish() {
    if (!validationSummary.publishReady) {
      setActionIsError(true);
      setActionMessage(t("auth.admin.mp.builder.publishBlocked"));
      focusValidationSummary();
      return;
    }

    runCardAction(() => publishMarketPulseCardAction(card.id));
  }

  function handleSaveSuccess(intent?: "default" | "add_another" | "duplicate") {
    onRefresh();

    if (intent === "add_another") {
      onAddAnother();
      return;
    }

    if (intent === "duplicate") {
      onDuplicate(card.id);
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-zinc-800 px-2 py-1 text-xs font-bold tabular-nums text-zinc-100">
            {formatBuilderDayCardLabel(card.dayIndex, card.sortOrder)}
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
        </div>
        <p className="line-clamp-2 text-sm font-medium text-zinc-100">{card.headline || "—"}</p>
        <p className="font-mono text-xs text-emerald-400/90">{card.ticker}</p>
        {cycleName ? (
          <p className="text-xs text-zinc-500">{cycleName}</p>
        ) : null}
      </div>

      <div
        ref={validationSummaryRef}
        tabIndex={-1}
        className={`mb-4 rounded-lg border px-3 py-3 text-sm outline-none ${
          validationSummary.publishReady
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100"
            : "border-amber-500/30 bg-amber-500/5 text-amber-100"
        }`}
        role={validationSummary.publishReady ? "status" : "alert"}
        aria-live={validationSummary.publishReady ? "polite" : "assertive"}
      >
        <p className="font-medium">
          {validationSummary.publishReady
            ? t("auth.admin.mp.builder.validationSummaryReady")
            : t("auth.admin.mp.builder.validationIssues")}
        </p>
        {!validationSummary.publishReady ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
            {validationSummary.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {previewOpen ? (
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <MarketPulseAdminCardPreview
            card={preview}
            cardId={card.id}
            published={published}
            playerLive={playerLive}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pb-28">
        <MarketPulseCardForm
          key={card.id}
          mode="edit"
          variant="builder"
          formId={BUILDER_CARD_FORM_ID}
          hideFooter
          autoFocusFirstField={autoFocusFirstField}
          onAutoFocusHandled={onAutoFocusHandled}
          cycleId={card.cycleId}
          cycleName={cycleName}
          cardId={card.id}
          existingDayIndexes={existingDayIndexes}
          siblingCards={cards.map((row) => ({
            id: row.id,
            dayIndex: row.dayIndex,
            sortOrder: row.sortOrder,
          }))}
          ppaSignalLockedAt={card.ppaSignalLockedAt}
          disabled={busy}
          initialValues={cardToFormValues(card)}
          onValuesChange={setFormValues}
          onSaveDraft={(values) =>
            updateMarketPulseCardDraftAction({
              cardId: card.id,
              ...buildCardPayload(values),
            })
          }
          onSubmit={(values) =>
            updateMarketPulseCardDraftAction({
              cardId: card.id,
              ...buildCardPayload(values),
            })
          }
          onSuccess={handleSaveSuccess}
        />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:-mx-0 sm:rounded-b-xl">
        <p className="mb-2 text-[11px] text-zinc-500">
          {t("auth.admin.mp.builder.fastEntry.shortcutHint")}
        </p>

        {(actionMessage || actionWarning) && (
          <div className="mb-2">
            {actionMessage ? (
              <p
                className={`text-xs font-medium ${
                  actionIsError ? "text-red-400" : "text-emerald-400"
                }`}
                role={actionIsError ? "alert" : "status"}
                aria-live={actionIsError ? "assertive" : "polite"}
              >
                {translateAuthMessage(locale, actionMessage)}
              </p>
            ) : null}
            {actionWarning ? (
              <p className="text-xs font-medium text-amber-200" role="status">
                {actionWarning}
              </p>
            ) : null}
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-1">
          <button
            type="button"
            className={buttonClass}
            disabled={busy || !previousCard}
            onClick={() => previousCard && onSelectCard(previousCard.id)}
          >
            {t("auth.admin.mp.builder.fastEntry.previousCard")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={busy || !nextCard}
            onClick={() => nextCard && onSelectCard(nextCard.id)}
          >
            {t("auth.admin.mp.builder.fastEntry.nextCard")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            form={BUILDER_CARD_FORM_ID}
            name="saveIntent"
            value="draft"
            className={primaryButtonClass}
            disabled={busy}
          >
            {isPending
              ? t("auth.admin.mp.cards.saving")
              : t("auth.admin.mp.builder.saveDraft")}
          </button>
          <button
            type="submit"
            form={BUILDER_CARD_FORM_ID}
            name="saveIntent"
            value="add_another"
            className={buttonClass}
            disabled={busy}
          >
            {t("auth.admin.mp.builder.fastEntry.saveAndAddAnother")}
          </button>
          <button
            type="submit"
            form={BUILDER_CARD_FORM_ID}
            name="saveIntent"
            value="duplicate"
            className={buttonClass}
            disabled={busy}
          >
            {t("auth.admin.mp.builder.fastEntry.saveAndDuplicate")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            {previewOpen
              ? t("auth.admin.mp.cards.hidePreview")
              : t("auth.admin.mp.cards.preview")}
          </button>
          {!published ? (
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy || !validationSummary.publishReady}
              title={
                !validationSummary.publishReady
                  ? t("auth.admin.mp.builder.publishBlocked")
                  : undefined
              }
              onClick={handlePublish}
            >
              {isPending
                ? t("auth.admin.mp.cards.publishing")
                : t("auth.admin.mp.cards.publish")}
            </button>
          ) : null}
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
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => onDuplicate(card.id)}
          >
            {t("auth.admin.mp.builder.duplicate")}
          </button>
        </div>
      </div>
    </div>
  );
}
