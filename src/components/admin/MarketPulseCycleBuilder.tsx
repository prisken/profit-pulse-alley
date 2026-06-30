"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CardStatusBadge } from "@/components/admin/AdminCardStatusBadge";
import MarketPulseBuilderBulkActions, {
  BuilderCardCheckbox,
} from "@/components/admin/MarketPulseBuilderBulkActions";
import MarketPulseCycleReadinessPanel from "@/components/admin/MarketPulseCycleReadinessPanel";
import MarketPulseCycleCardDefaultsPanel from "@/components/admin/MarketPulseCycleCardDefaultsPanel";
import MarketPulseCycleForm from "@/components/admin/MarketPulseCycleForm";
import MarketPulseBuilderCardEditor from "@/components/admin/MarketPulseBuilderCardEditor";
import { CreateCardSection } from "@/components/admin/MarketPulseCardPanel";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  duplicateMarketPulseCardAction,
  publishMarketPulseCardAction,
  quickCreateMarketPulseCardDraftAction,
  updateMarketPulseCycleAction,
  reorderMarketPulseCardAction,
  fillMissingCardSourceDatesAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import {
  findDuplicateDayIndexes,
  findDuplicateSourceDateKeys,
  getCardSchedulingConflictMessages,
  sourceDateHktDayKey,
} from "@/lib/market-pulse/admin-card-scheduling";
import {
  getBuilderCardValidationStatus,
  type BuilderCardValidationStatus,
} from "@/lib/market-pulse/admin-builder-card-status";
import type { MarketPulseCycleBuilderData } from "@/lib/market-pulse/admin-builder-data";
import {
  buildQuickDraftCardDefaults,
  deriveCycleCardCreationDefaults,
} from "@/lib/market-pulse/cycle-card-defaults";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { isRevealWithinPpaWarningWindow } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import { evaluateCycleReadiness } from "@/lib/market-pulse/admin-cycle-readiness";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";
import { toDatetimeLocalValue } from "@/lib/market-pulse/cycle-validation";
import { toCardDatetimeLocalValue } from "@/lib/market-pulse/card-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const buttonClass = `min-h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

const primaryButtonClass = `min-h-9 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${focusRing}`;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateRange(startsAt: string, endsAt: string): string {
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

function cycleStatusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-200";
    case "DRAFT":
      return "bg-zinc-500/15 text-zinc-300";
    case "CLOSED":
      return "bg-amber-500/15 text-amber-200";
    case "REVEALED":
      return "bg-sky-500/15 text-sky-200";
    default:
      return "bg-zinc-500/15 text-zinc-300";
  }
}

function validationStatusBadge(status: BuilderCardValidationStatus): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/15 text-emerald-200";
    case "ready_to_publish":
      return "bg-sky-500/15 text-sky-200";
    case "ppa_incomplete":
      return "bg-amber-500/15 text-amber-200";
    default:
      return "bg-red-500/15 text-red-200";
  }
}

function validationStatusKey(status: BuilderCardValidationStatus): MessageKey {
  switch (status) {
    case "published":
      return "auth.admin.mp.builder.validation.published";
    case "ready_to_publish":
      return "auth.admin.mp.builder.validation.ready";
    case "ppa_incomplete":
      return "auth.admin.mp.builder.validation.ppaIncomplete";
    default:
      return "auth.admin.mp.builder.validation.missingRequired";
  }
}

type Props = {
  initialData: MarketPulseCycleBuilderData;
};

export default function MarketPulseCycleBuilder({ initialData }: Readonly<Props>) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingFocusCardId, setPendingFocusCardId] = useState<string | null>(null);
  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [saveCycleOpen, setSaveCycleOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [promptOverride, setPromptOverride] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { cycle, cards, runtimeStatus } = initialData;
  const disabled = runtimeStatus === "MAINTENANCE" || isPending;

  const publishedCount = useMemo(
    () => cards.filter((card) => isCardPublished(card)).length,
    [cards],
  );
  const draftCount = cards.length - publishedCount;

  const dayIndexes = useMemo(
    () => cards.map((card) => card.dayIndex).sort((a, b) => a - b),
    [cards],
  );

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const revealUrgent =
    cycle.status !== "REVEALED" &&
    isRevealWithinPpaWarningWindow(cycle.revealAt, new Date());

  const readinessReport = useMemo(
    () => evaluateCycleReadiness(cycle, cards),
    [cycle, cards],
  );

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.dayIndex - b.dayIndex),
    [cards],
  );

  const duplicateDayIndexes = useMemo(
    () => findDuplicateDayIndexes(cards),
    [cards],
  );
  const duplicateSourceDates = useMemo(
    () => findDuplicateSourceDateKeys(cards),
    [cards],
  );

  const cycleSpan = useMemo(
    () => ({ startsAt: cycle.startsAt, endsAt: cycle.endsAt }),
    [cycle.startsAt, cycle.endsAt],
  );

  function getCardScheduleWarning(card: (typeof cards)[number]): string | null {
    if (duplicateDayIndexes.has(card.dayIndex)) {
      return t("auth.admin.mp.builder.schedule.duplicateDay");
    }
    if (
      card.sourceDate &&
      duplicateSourceDates.has(sourceDateHktDayKey(card.sourceDate))
    ) {
      return t("auth.admin.mp.builder.schedule.duplicateSourceDate");
    }
    const conflicts = getCardSchedulingConflictMessages(card, cycleSpan, cards);
    return conflicts[0] ?? null;
  }

  function handleReorder(cardId: string, direction: "up" | "down") {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      await invokeAdminAction(() => reorderMarketPulseCardAction({ cardId, direction }), {
        onSuccess: (successMessage) => {
          setMessage(successMessage ?? t("auth.admin.mp.done"));
          refresh();
        },
        onError: (actionError) => {
          setError(actionError ?? t("auth.admin.mp.actionFailed"));
        },
        onThrow: () => refresh(),
      });
    });
  }

  function handleFillMissingDates(apply: boolean) {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      const result = await fillMissingCardSourceDatesAction({
        cycleId: cycle.id,
        apply,
      });
      if (!result.ok) {
        setError(result.error ?? t("auth.admin.mp.actionFailed"));
        return;
      }
      if (apply) {
        setMessage(result.message ?? t("auth.admin.mp.done"));
      } else {
        const count = result.data?.preview.updates.length ?? 0;
        setMessage(
          count > 0
            ? t("auth.admin.mp.builder.schedule.previewFillDatesResult").replace(
                "{count}",
                String(count),
              )
            : t("auth.admin.mp.builder.schedule.noMissingDates"),
        );
      }
      setWarning(result.warning ?? null);
      if (apply) {
        refresh();
      }
    });
  }

  const cardReferences = useMemo(
    () =>
      cards.map((card) => ({
        id: card.id,
        dayIndex: card.dayIndex,
        sourceDate: card.sourceDate,
        userPrompt: card.userPrompt,
        exchange: card.exchange,
        sourceName: card.sourceName,
        sourceUrl: card.sourceUrl,
        headline: card.headline,
        companyName: card.companyName,
        ticker: card.ticker,
      })),
    [cards],
  );

  const cycleDefaults = useMemo(
    () =>
      deriveCycleCardCreationDefaults({
        cycle: {
          startsAt: cycle.startsAt,
          endsAt: cycle.endsAt,
          revealAt: cycle.revealAt,
          prizeLabel: cycle.prizeLabel,
        },
        cards: cardReferences,
      }),
    [cycle.startsAt, cycle.endsAt, cycle.revealAt, cycle.prizeLabel, cardReferences],
  );

  const createCardPrefill = useMemo(() => {
    const draft = buildQuickDraftCardDefaults({
      cycle: {
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        revealAt: cycle.revealAt,
        prizeLabel: cycle.prizeLabel,
      },
      cards: cardReferences,
    });
    const effectivePrompt = promptOverride.trim() || draft.userPrompt;

    return {
      dayIndex: draft.dayIndex,
      userPrompt: effectivePrompt,
      exchange: draft.exchange ?? "",
      sourceName: draft.sourceName ?? "",
      sourceUrl: draft.sourceUrl ?? "",
      sourceDate: toCardDatetimeLocalValue(draft.sourceDate.toISOString()),
    };
  }, [
    cycle.startsAt,
    cycle.endsAt,
    cycle.revealAt,
    cycle.prizeLabel,
    cardReferences,
    promptOverride,
  ]);

  function handleOpenCardPreview(cardId: string) {
    handleSelectCard(cardId);
    setPreviewCardId(cardId);
  }

  function refresh() {
    router.refresh();
  }

  function runAction(action: () => Promise<AdminActionResult>) {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      await invokeAdminAction(action, {
        onSuccess: (successMessage, successWarning) => {
          setMessage(successMessage ?? t("auth.admin.mp.done"));
          setWarning(successWarning ?? null);
          refresh();
        },
        onError: (actionError) => {
          setError(actionError ?? t("auth.admin.mp.actionFailed"));
        },
        onThrow: () => refresh(),
      });
    });
  }

  function handlePublish(cardId: string) {
    runAction(() => publishMarketPulseCardAction(cardId));
  }

  function handleAddCardDraft() {
    setMessage(null);
    setWarning(null);
    setError(null);
    setCreateCardOpen(false);
    startTransition(async () => {
      try {
        const result = await quickCreateMarketPulseCardDraftAction(cycle.id, {
          promptOverride: promptOverride.trim() || undefined,
        });
        if (!result.ok) {
          setError(result.error ?? t("auth.admin.mp.actionFailed"));
          return;
        }

        if (result.data?.cardId) {
          setPendingFocusCardId(result.data.cardId);
          setSelectedCardId(result.data.cardId);
        }

        setMessage(result.message ?? t("auth.admin.mp.done"));
        setWarning(result.warning ?? null);
        refresh();
      } catch (actionError) {
        console.error("[admin] add card draft failed:", actionError);
        refresh();
        setError(t("auth.admin.mp.actionFailed"));
      }
    });
  }

  function handleAddAnother() {
    handleAddCardDraft();
  }

  function handleSelectCard(cardId: string) {
    setPendingFocusCardId(null);
    setSelectedCardId(cardId);
  }

  function handleDuplicate(sourceCardId: string) {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await duplicateMarketPulseCardAction({
          sourceCardId,
          targetCycleId: cycle.id,
        });
        if (!result.ok) {
          setError(result.error ?? t("auth.admin.mp.actionFailed"));
          return;
        }

        if (result.data?.cardId) {
          setPendingFocusCardId(result.data.cardId);
          setSelectedCardId(result.data.cardId);
        }

        setMessage(result.message ?? t("auth.admin.mp.done"));
        setWarning(result.warning ?? null);
        refresh();
      } catch (actionError) {
        console.error("[admin] duplicate card failed:", actionError);
        refresh();
        setError(t("auth.admin.mp.actionFailed"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {(message || warning || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
          role="status"
        >
          {error
            ? translateAuthMessage(locale, error)
            : message
              ? translateAuthMessage(locale, message)
              : null}
          {warning ? <p className="mt-2 text-amber-200">{warning}</p> : null}
        </div>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-100">{cycle.name}</h2>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${cycleStatusBadge(cycle.status)}`}
              >
                {cycle.status}
              </span>
              {cycle.isActive ? (
                <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-200">
                  {t("auth.admin.mp.active")}
                </span>
              ) : null}
            </div>
            <dl className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  {t("auth.admin.mp.builder.dateRange")}
                </dt>
                <dd className="mt-0.5 text-zinc-300">
                  {formatDateRange(cycle.startsAt, cycle.endsAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  {t("auth.admin.mp.statRevealDate")}
                </dt>
                <dd className="mt-0.5 text-zinc-300">{formatDateTime(cycle.revealAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  {t("auth.admin.mp.builder.cardCounts")}
                </dt>
                <dd className="mt-0.5 text-zinc-300">
                  {translateWith(locale, "auth.admin.mp.builder.cardCountsValue", {
                    total: cards.length,
                    published: publishedCount,
                    draft: draftCount,
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <MarketPulseCycleCardDefaultsPanel
          cycle={cycle}
          cards={cards}
          promptOverride={promptOverride}
          onPromptOverrideChange={setPromptOverride}
          onSelectReferenceCard={handleSelectCard}
        />

        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={disabled}
            onClick={handleAddCardDraft}
          >
            {t("auth.admin.mp.builder.addCardDraft")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={disabled}
            onClick={() => {
              setCreateCardOpen(true);
              setSelectedCardId(null);
            }}
          >
            {t("auth.admin.mp.builder.addCard")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={disabled}
            onClick={() => setSaveCycleOpen((open) => !open)}
          >
            {saveCycleOpen
              ? t("auth.admin.mp.builder.hideSaveCycle")
              : t("auth.admin.mp.builder.saveCycle")}
          </button>
          <Link href="/market-pulse/hub" className={buttonClass} target="_blank" rel="noreferrer">
            {t("auth.admin.mp.builder.previewCycle")}
          </Link>
          <button
            type="button"
            className={buttonClass}
            onClick={() => setValidateOpen((open) => !open)}
          >
            {validateOpen
              ? t("auth.admin.mp.builder.hideValidate")
              : t("auth.admin.mp.builder.validateReadiness")}
          </button>
          <Link href="/admin/market-pulse" className={buttonClass}>
            {t("auth.admin.mp.builder.backToDashboard")}
          </Link>
        </div>

        {createCardOpen ? (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-3 text-sm text-zinc-400">
              {t("auth.admin.mp.builder.fullCreateHelp")}
            </p>
            <CreateCardSection
              cycleId={cycle.id}
              cycleName={cycle.name}
              nextDayIndex={cycleDefaults.dayIndex}
              existingDayIndexes={dayIndexes}
              disabled={disabled}
              open={createCardOpen}
              onOpenChange={setCreateCardOpen}
              onRefresh={refresh}
              createPrefill={createCardPrefill}
            />
          </div>
        ) : null}

        {saveCycleOpen ? (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <MarketPulseCycleForm
              mode="edit"
              cycleId={cycle.id}
              isActive={cycle.isActive}
              disabled={disabled}
              initialValues={{
                name: cycle.name,
                startsAt: toDatetimeLocalValue(cycle.startsAt),
                endsAt: toDatetimeLocalValue(cycle.endsAt),
                revealAt: toDatetimeLocalValue(cycle.revealAt),
                prizeLabel: cycle.prizeLabel ?? "",
                status: cycle.status,
                setActive: cycle.isActive,
              }}
              onCancel={() => setSaveCycleOpen(false)}
              onSuccess={() => {
                refresh();
                setSaveCycleOpen(false);
              }}
              onSubmit={(values) =>
                updateMarketPulseCycleAction({
                  cycleId: cycle.id,
                  name: values.name,
                  startsAt: values.startsAt,
                  endsAt: values.endsAt,
                  revealAt: values.revealAt,
                  prizeLabel: values.prizeLabel,
                  status: values.status,
                  setActive: values.setActive,
                })
              }
            />
          </div>
        ) : null}

        {validateOpen ? (
          <MarketPulseCycleReadinessPanel
            report={readinessReport}
            onSelectCard={handleSelectCard}
          />
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
        <section className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.cardListTitle")}
          </h3>

          {cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
              {t("auth.admin.mp.builder.emptyCards")}
            </p>
          ) : (
            <>
              <MarketPulseBuilderBulkActions
                cycleId={cycle.id}
                cards={cards}
                selectedCardIds={selectedCardIds}
                onSelectedCardIdsChange={setSelectedCardIds}
                disabled={disabled}
                onRefresh={refresh}
              />

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={disabled}
                  onClick={() => handleFillMissingDates(false)}
                >
                  {t("auth.admin.mp.builder.schedule.previewFillDates")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={disabled}
                  onClick={() => handleFillMissingDates(true)}
                >
                  {t("auth.admin.mp.builder.schedule.fillMissingDates")}
                </button>
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">
                        <span className="sr-only">{t("auth.admin.mp.builder.bulk.selectColumn")}</span>
                      </th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colDay")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colHeadline")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colTicker")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colStatus")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colValidation")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("auth.admin.mp.builder.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {sortedCards.map((card, cardOrderIndex) => {
                      const validationStatus = getBuilderCardValidationStatus(card);
                      const published = isCardPublished(card);
                      const selected = card.id === selectedCardId;
                      const scheduleWarning = getCardScheduleWarning(card);
                      const canPublish =
                        validationStatus === "ready_to_publish" && !scheduleWarning;
                      return (
                        <tr
                          key={card.id}
                          className={selected ? "bg-emerald-500/5" : "hover:bg-zinc-900/40"}
                        >
                          <td className="px-3 py-2.5">
                            <BuilderCardCheckbox
                              cardId={card.id}
                              checked={selectedCardIds.has(card.id)}
                              disabled={disabled}
                              onToggle={(cardId) => {
                                const next = new Set(selectedCardIds);
                                if (next.has(cardId)) {
                                  next.delete(cardId);
                                } else {
                                  next.add(cardId);
                                }
                                setSelectedCardIds(next);
                              }}
                              label={translateWith(locale, "auth.admin.mp.cards.dayLabel", {
                                day: card.dayIndex,
                              })}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className={buttonClass}
                                disabled={disabled || cardOrderIndex === 0}
                                aria-label={t("auth.admin.mp.builder.schedule.moveUp")}
                                onClick={() => handleReorder(card.id, "up")}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className={buttonClass}
                                disabled={
                                  disabled || cardOrderIndex === sortedCards.length - 1
                                }
                                aria-label={t("auth.admin.mp.builder.schedule.moveDown")}
                                onClick={() => handleReorder(card.id, "down")}
                              >
                                ↓
                              </button>
                              <span>
                                {translateWith(locale, "auth.admin.mp.cards.dayLabel", {
                                  day: card.dayIndex,
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2.5 text-zinc-200">
                            {card.headline}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-zinc-400">
                            {card.ticker}
                          </td>
                          <td className="px-3 py-2.5">
                            <CardStatusBadge status={card.status} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="space-y-1">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-medium ${validationStatusBadge(validationStatus)}`}
                              >
                                {t(validationStatusKey(validationStatus))}
                              </span>
                              {scheduleWarning ? (
                                <p
                                  className="max-w-[12rem] text-xs text-amber-300"
                                  role="alert"
                                >
                                  {scheduleWarning}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                className={buttonClass}
                                onClick={() => handleSelectCard(card.id)}
                              >
                                {t("auth.admin.mp.cards.edit")}
                              </button>
                              <button
                                type="button"
                                className={buttonClass}
                                disabled={disabled}
                                onClick={() => handleDuplicate(card.id)}
                              >
                                {t("auth.admin.mp.builder.duplicate")}
                              </button>
                              <button
                                type="button"
                                className={buttonClass}
                                onClick={() => handleOpenCardPreview(card.id)}
                              >
                                {t("auth.admin.mp.cards.preview")}
                              </button>
                              {!published ? (
                                <button
                                  type="button"
                                  className={buttonClass}
                                  disabled={disabled || !canPublish}
                                  title={scheduleWarning ?? undefined}
                                  onClick={() => handlePublish(card.id)}
                                >
                                  {t("auth.admin.mp.cards.publish")}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 md:hidden" aria-label={t("auth.admin.mp.cards.listAria")}>
                {sortedCards.map((card, cardOrderIndex) => {
                  const validationStatus = getBuilderCardValidationStatus(card);
                  const published = isCardPublished(card);
                  const selected = card.id === selectedCardId;
                  const scheduleWarning = getCardScheduleWarning(card);
                  const canPublish =
                    validationStatus === "ready_to_publish" && !scheduleWarning;
                  return (
                    <li
                      key={card.id}
                      className={`rounded-xl border p-3 ${selected ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/40"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <BuilderCardCheckbox
                          cardId={card.id}
                          checked={selectedCardIds.has(card.id)}
                          disabled={disabled}
                          onToggle={(cardId) => {
                            const next = new Set(selectedCardIds);
                            if (next.has(cardId)) {
                              next.delete(cardId);
                            } else {
                              next.add(cardId);
                            }
                            setSelectedCardIds(next);
                          }}
                          label={translateWith(locale, "auth.admin.mp.cards.dayLabel", {
                            day: card.dayIndex,
                          })}
                        />
                        <span className="text-xs font-medium text-zinc-500">
                          {translateWith(locale, "auth.admin.mp.cards.dayLabel", {
                            day: card.dayIndex,
                          })}
                        </span>
                        <CardStatusBadge status={card.status} />
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${validationStatusBadge(validationStatus)}`}
                        >
                          {t(validationStatusKey(validationStatus))}
                        </span>
                      </div>
                      {scheduleWarning ? (
                        <p className="mt-2 text-xs text-amber-300" role="alert">
                          {scheduleWarning}
                        </p>
                      ) : null}
                      <p className="mt-2 font-medium text-zinc-100">{card.headline}</p>
                      <p className="mt-1 text-sm text-zinc-400">{card.ticker}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={disabled || cardOrderIndex === 0}
                          onClick={() => handleReorder(card.id, "up")}
                        >
                          {t("auth.admin.mp.builder.schedule.moveUp")}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={
                            disabled || cardOrderIndex === sortedCards.length - 1
                          }
                          onClick={() => handleReorder(card.id, "down")}
                        >
                          {t("auth.admin.mp.builder.schedule.moveDown")}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => handleSelectCard(card.id)}
                        >
                          {t("auth.admin.mp.cards.edit")}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={disabled}
                          onClick={() => handleDuplicate(card.id)}
                        >
                          {t("auth.admin.mp.builder.duplicate")}
                        </button>
                        {!published ? (
                          <button
                            type="button"
                            className={buttonClass}
                            disabled={disabled || !canPublish}
                            title={scheduleWarning ?? undefined}
                            onClick={() => handlePublish(card.id)}
                          >
                            {t("auth.admin.mp.cards.publish")}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.editorTitle")}
          </h3>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            {selectedCard ? (
              <MarketPulseBuilderCardEditor
                key={selectedCard.id}
                card={selectedCard}
                cards={cards}
                cycleStartsAt={cycle.startsAt}
                cycleEndsAt={cycle.endsAt}
                cycleName={cycle.name}
                existingDayIndexes={dayIndexes}
                disabled={disabled}
                revealUrgent={revealUrgent}
                previewOpen={previewCardId === selectedCard.id}
                onPreviewOpenChange={(open) => {
                  if (!open) {
                    setPreviewCardId(null);
                  } else {
                    setPreviewCardId(selectedCard.id);
                  }
                }}
                onRefresh={refresh}
                onDuplicate={handleDuplicate}
                onSelectCard={handleSelectCard}
                onAddAnother={handleAddAnother}
                autoFocusFirstField={pendingFocusCardId === selectedCard.id}
                onAutoFocusHandled={() => setPendingFocusCardId(null)}
              />
            ) : (
              <p className="text-sm text-zinc-500">
                {t("auth.admin.mp.builder.selectCardHint")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
