"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketPulseCardStatus, MarketPulseSignal } from "@prisma/client";

import MarketPulseAdminCardPreview from "@/components/admin/MarketPulseAdminCardPreview";
import type { AdminActionResult } from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  cardFieldErrorId,
  cardFieldId,
  focusFirstInvalidCardField,
} from "@/lib/market-pulse/admin-card-form-ui";
import {
  cardFormValuesToPreview,
  DEFAULT_CARD_FORM_VALUES,
  MARKET_PULSE_CARD_IMAGE_GUIDANCE,
  MARKET_PULSE_CARD_STATUS_OPTIONS,
  MARKET_PULSE_DEFAULT_USER_PROMPT,
  MARKET_PULSE_SIGNAL_OPTIONS,
  validateCardPublishable,
  validateMarketPulseCardDraftSave,
  validateMarketPulseCardForm,
  type CardFormFieldErrors,
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const fieldErrorClass = "border-red-500/50";

type SubmitValues = MarketPulseCardFormValues & { cardId?: string };

type SaveSuccessIntent = "default" | "add_another" | "duplicate";

type MarketPulseCardFormProps = {
  mode: "create" | "edit";
  cycleId: string;
  cycleName?: string;
  cardId?: string;
  initialValues?: Partial<MarketPulseCardFormValues>;
  existingDayIndexes: number[];
  ppaSignalLockedAt?: string | null;
  disabled?: boolean;
  variant?: "default" | "builder";
  formId?: string;
  hideFooter?: boolean;
  autoFocusFirstField?: boolean;
  onAutoFocusHandled?: () => void;
  onSubmit: (values: SubmitValues) => Promise<AdminActionResult>;
  onSaveDraft?: (values: SubmitValues) => Promise<AdminActionResult>;
  onCancel?: () => void;
  onSuccess?: (intent?: SaveSuccessIntent) => void;
  onValuesChange?: (values: MarketPulseCardFormValues) => void;
};

function mergeInitialValues(
  cycleId: string,
  initialValues?: Partial<MarketPulseCardFormValues>,
): MarketPulseCardFormValues {
  return {
    ...DEFAULT_CARD_FORM_VALUES,
    cycleId,
    ...initialValues,
  };
}

function FieldLabel({
  children,
  error,
  errorId,
  hint,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  errorId?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-zinc-300">
      {children}
      {required ? <span className="text-red-400"> *</span> : null}
      {hint ? (
        <span className="mt-0.5 block text-xs font-normal text-zinc-500">{hint}</span>
      ) : null}
      {error ? (
        <span id={errorId} className="mt-1 block text-xs font-normal text-red-400" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
      {children}
    </h3>
  );
}

export default function MarketPulseCardForm({
  mode,
  cycleId,
  cycleName,
  cardId,
  initialValues,
  existingDayIndexes,
  ppaSignalLockedAt = null,
  disabled = false,
  variant = "default",
  formId,
  hideFooter = false,
  autoFocusFirstField = false,
  onAutoFocusHandled,
  onSubmit,
  onSaveDraft,
  onCancel,
  onSuccess,
  onValuesChange,
}: MarketPulseCardFormProps) {
  const { t, locale } = useTranslations();
  const isBuilder = variant === "builder";
  const excludeDayIndex =
    mode === "edit" ? initialValues?.dayIndex : undefined;

  const [values, setValues] = useState<MarketPulseCardFormValues>(() =>
    mergeInitialValues(cycleId, initialValues),
  );
  const [fieldErrors, setFieldErrors] = useState<CardFormFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  const locked = Boolean(ppaSignalLockedAt);

  const preview = useMemo(
    () => cardFormValuesToPreview(values, ppaSignalLockedAt),
    [values, ppaSignalLockedAt],
  );

  const publishBlocker = useMemo(
    () =>
      validateCardPublishable({
        headline: values.headline,
        companyName: values.companyName,
        ticker: values.ticker,
        summary: values.summary,
        ppaSignal: values.ppaSignal || null,
        ppaInsight: values.ppaInsight,
        ppaSignalLockedAt: ppaSignalLockedAt,
      }),
    [values, ppaSignalLockedAt],
  );

  useEffect(() => {
    if (!autoFocusFirstField) {
      return;
    }

    const element = document.getElementById(cardFieldId("headline"));
    element?.focus();
    onAutoFocusHandled?.();
  }, [autoFocusFirstField, cardId, mode, onAutoFocusHandled]);

  function updateField<K extends keyof MarketPulseCardFormValues>(
    key: K,
    value: MarketPulseCardFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      onValuesChange?.(next);
      return next;
    });
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setStatusMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const saveIntent = submitter?.value ?? "full";
    const draftSave =
      (saveIntent === "draft" ||
        saveIntent === "add_another" ||
        saveIntent === "duplicate") &&
      Boolean(onSaveDraft);
    const createAnother = saveIntent === "create_another";

    const validation = draftSave
      ? validateMarketPulseCardDraftSave(values, {
          existingDayIndexes,
          excludeDayIndex,
        })
      : validateMarketPulseCardForm(values, {
          existingDayIndexes,
          excludeDayIndex,
        });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setStatusIsError(true);
      setStatusMessage(t("auth.admin.mp.cards.fixFields"));
      focusFirstInvalidCardField(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const submitHandler = draftSave ? onSaveDraft! : onSubmit;

    try {
      const succeeded = await invokeAdminAction(
        () => submitHandler({ ...values, cycleId, cardId }),
        {
          onSuccess: (successMessage, warning) => {
            setStatusIsError(false);
            setStatusMessage(successMessage ?? t("auth.admin.mp.cards.saved"));
            setStatusWarning(warning ?? null);

            if (mode === "create") {
              setValues(
                mergeInitialValues(cycleId, {
                  dayIndex: values.dayIndex + 1,
                  ...(createAnother
                    ? {
                        headline: "",
                        companyName: "",
                        ticker: "",
                        summary: "",
                        newsBody: "",
                      }
                    : {}),
                }),
              );
            }

            if (saveIntent === "add_another" || saveIntent === "duplicate") {
              onSuccess?.(saveIntent);
            } else if (createAnother) {
              onSuccess?.("add_another");
            } else {
              onSuccess?.("default");
            }
          },
          onError: (error, serverFieldErrors) => {
            setStatusIsError(true);
            setStatusWarning(null);
            setStatusMessage(error);
            if (serverFieldErrors) {
              const nextErrors: CardFormFieldErrors = {};
              for (const [key, messages] of Object.entries(serverFieldErrors)) {
                if (messages[0]) {
                  nextErrors[key as keyof CardFormFieldErrors] = messages[0];
                }
              }
              setFieldErrors(nextErrors);
              focusFirstInvalidCardField(nextErrors);
            }
          },
          onThrow: () => onSuccess?.(),
        },
      );

      if (!succeeded) {
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = disabled || isSubmitting;

  return (
    <form
      id={formId}
      className={`space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm ${
        isBuilder ? "border-0 bg-transparent p-0" : "p-4 sm:p-6"
      }`}
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      {!isBuilder ? (
        <div>
          <p className="text-sm font-semibold text-zinc-100">
            {mode === "create"
              ? t("auth.admin.mp.cards.newCard")
              : t("auth.admin.mp.cards.editCard")}
          </p>
          {cycleName ? (
            <p className="mt-1 text-sm text-zinc-400">
              {t("auth.admin.mp.cards.cycleLabel")}: {cycleName}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={isBuilder ? "space-y-8" : "grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"}>
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2">
              <SectionHeading>{t("auth.admin.mp.cards.sectionContent")}</SectionHeading>
            </h3>
            <label className="block sm:col-span-2" htmlFor={cardFieldId("headline")}>
              <FieldLabel
                error={fieldErrors.headline}
                errorId={cardFieldErrorId("headline")}
                required
              >
                {t("auth.admin.mp.cards.fieldHeadline")}
              </FieldLabel>
              <input
                id={cardFieldId("headline")}
                className={`${fieldClass} ${fieldErrors.headline ? fieldErrorClass : ""}`}
                value={values.headline}
                onChange={(event) => updateField("headline", event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.headline)}
                aria-describedby={
                  fieldErrors.headline ? cardFieldErrorId("headline") : undefined
                }
              />
            </label>
            <label className="block sm:col-span-2" htmlFor={cardFieldId("newsBody")}>
              <FieldLabel>{t("auth.admin.mp.cards.fieldNewsBody")}</FieldLabel>
              <textarea
                id={cardFieldId("newsBody")}
                className={`${fieldClass} min-h-[5rem]`}
                value={values.newsBody}
                onChange={(event) => updateField("newsBody", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2" htmlFor={cardFieldId("summary")}>
              <FieldLabel
                error={fieldErrors.summary}
                errorId={cardFieldErrorId("summary")}
                required={!isBuilder}
              >
                {t("auth.admin.mp.cards.fieldSummary")}
              </FieldLabel>
              <textarea
                id={cardFieldId("summary")}
                className={`${fieldClass} min-h-[5rem] ${fieldErrors.summary ? fieldErrorClass : ""}`}
                value={values.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.summary)}
                aria-describedby={
                  fieldErrors.summary ? cardFieldErrorId("summary") : undefined
                }
              />
            </label>
            <label className="block sm:col-span-2" htmlFor={cardFieldId("userPrompt")}>
              <FieldLabel>{t("auth.admin.mp.cards.fieldUserPrompt")}</FieldLabel>
              <input
                id={cardFieldId("userPrompt")}
                className={fieldClass}
                value={values.userPrompt}
                onChange={(event) => updateField("userPrompt", event.target.value)}
                disabled={busy}
                placeholder={MARKET_PULSE_DEFAULT_USER_PROMPT}
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2">
              <SectionHeading>{t("auth.admin.mp.cards.sectionMarket")}</SectionHeading>
            </h3>
            <label className="block sm:col-span-2" htmlFor={cardFieldId("companyName")}>
              <FieldLabel
                error={fieldErrors.companyName}
                errorId={cardFieldErrorId("companyName")}
                required
              >
                {t("auth.admin.mp.cards.fieldCompany")}
              </FieldLabel>
              <input
                id={cardFieldId("companyName")}
                className={`${fieldClass} ${fieldErrors.companyName ? fieldErrorClass : ""}`}
                value={values.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.companyName)}
                aria-describedby={
                  fieldErrors.companyName ? cardFieldErrorId("companyName") : undefined
                }
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>{t("auth.admin.mp.cards.fieldCompanyZh")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.companyNameZh}
                onChange={(event) => updateField("companyNameZh", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block" htmlFor={cardFieldId("ticker")}>
              <FieldLabel
                error={fieldErrors.ticker}
                errorId={cardFieldErrorId("ticker")}
                required
              >
                {t("auth.admin.mp.cards.fieldTicker")}
              </FieldLabel>
              <input
                id={cardFieldId("ticker")}
                className={`${fieldClass} ${fieldErrors.ticker ? fieldErrorClass : ""}`}
                value={values.ticker}
                onChange={(event) => updateField("ticker", event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.ticker)}
                aria-describedby={
                  fieldErrors.ticker ? cardFieldErrorId("ticker") : undefined
                }
              />
            </label>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldExchange")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.exchange}
                onChange={(event) => updateField("exchange", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.logoUrl}>
                {t("auth.admin.mp.cards.fieldLogoUrl")}
              </FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.logoUrl ? fieldErrorClass : ""}`}
                value={values.logoUrl}
                onChange={(event) => updateField("logoUrl", event.target.value)}
                disabled={busy}
                placeholder="https://"
              />
            </label>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldPrice")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.priceLabel}
                onChange={(event) => updateField("priceLabel", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldPriceChange")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.priceDirection}
                onChange={(event) => updateField("priceDirection", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldSourceName")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.sourceName}
                onChange={(event) => updateField("sourceName", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.sourceDate}>
                {t("auth.admin.mp.cards.fieldSourceDate")}
              </FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.sourceDate ? fieldErrorClass : ""}`}
                value={values.sourceDate}
                onChange={(event) => updateField("sourceDate", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.sourceUrl}>
                {t("auth.admin.mp.cards.fieldSourceUrl")}
              </FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.sourceUrl ? fieldErrorClass : ""}`}
                value={values.sourceUrl}
                onChange={(event) => updateField("sourceUrl", event.target.value)}
                disabled={busy}
                placeholder="https://"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2">
              <SectionHeading>{t("auth.admin.mp.cards.sectionVisual")}</SectionHeading>
            </h3>
            <p className="sm:col-span-2 text-sm leading-relaxed text-zinc-400">
              {MARKET_PULSE_CARD_IMAGE_GUIDANCE}
            </p>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldLogoInitials")}</FieldLabel>
              <input
                className={fieldClass}
                value={values.logoInitials}
                onChange={(event) => updateField("logoInitials", event.target.value)}
                disabled={busy}
                maxLength={4}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel
                error={fieldErrors.cardImageUrl}
                hint={t("auth.admin.mp.cards.imageUrlHint")}
              >
                {t("auth.admin.mp.cards.fieldImageUrl")}
              </FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.cardImageUrl ? fieldErrorClass : ""}`}
                value={values.cardImageUrl}
                onChange={(event) => updateField("cardImageUrl", event.target.value)}
                disabled={busy}
                placeholder="https://"
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.cardImageAlt}>
                {t("auth.admin.mp.cards.fieldImageAlt")}
              </FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.cardImageAlt ? fieldErrorClass : ""}`}
                value={values.cardImageAlt}
                onChange={(event) => updateField("cardImageAlt", event.target.value)}
                disabled={busy}
              />
            </label>
            {values.cardImageUrl.trim() ? (
              <div className="sm:col-span-2 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.cardImageUrl.trim()}
                  alt={values.cardImageAlt || t("auth.admin.mp.cards.imagePreviewAlt")}
                  className="aspect-video w-full object-cover"
                />
              </div>
            ) : (
              <p className="sm:col-span-2 text-sm text-zinc-500">
                {t("auth.admin.mp.cards.imagePreviewEmpty")}
              </p>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2">
              <SectionHeading>{t("auth.admin.mp.cards.sectionPpa")}</SectionHeading>
            </h3>
            {isBuilder ? (
              <p className="sm:col-span-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs leading-relaxed text-violet-100">
                {t("auth.admin.mp.builder.ppaAdminOnly")}
              </p>
            ) : null}
            {!locked ? (
              <p className="sm:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                {t("auth.admin.mp.cards.ppaLockWarning")}
              </p>
            ) : (
              <p className="sm:col-span-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {t("auth.admin.mp.cards.ppaLockedNote")}
              </p>
            )}
            <label className="block">
              <FieldLabel error={fieldErrors.ppaSignal}>
                {t("auth.admin.mp.cards.fieldPpaSignal")}
              </FieldLabel>
              <select
                className={`${fieldClass} ${fieldErrors.ppaSignal ? fieldErrorClass : ""}`}
                value={values.ppaSignal}
                onChange={(event) =>
                  updateField(
                    "ppaSignal",
                    event.target.value as MarketPulseSignal | "",
                  )
                }
                disabled={busy}
              >
                <option value="">—</option>
                {MARKET_PULSE_SIGNAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.ppaInsight}>
                {t("auth.admin.mp.cards.fieldPpaInsight")}
              </FieldLabel>
              <textarea
                className={`${fieldClass} min-h-[5rem] ${fieldErrors.ppaInsight ? fieldErrorClass : ""}`}
                value={values.ppaInsight}
                onChange={(event) => updateField("ppaInsight", event.target.value)}
                disabled={busy}
              />
            </label>
            {locked ? (
              <label className="block sm:col-span-2">
                <FieldLabel>{t("auth.admin.mp.cards.fieldChangeReason")}</FieldLabel>
                <input
                  className={fieldClass}
                  value={values.changeReason}
                  onChange={(event) => updateField("changeReason", event.target.value)}
                  disabled={busy}
                />
              </label>
            ) : null}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2">
              <SectionHeading>{t("auth.admin.mp.cards.sectionPublishing")}</SectionHeading>
            </h3>
            <label className="block" htmlFor={cardFieldId("dayIndex")}>
              <FieldLabel
                error={fieldErrors.dayIndex}
                errorId={cardFieldErrorId("dayIndex")}
                required
              >
                {t("auth.admin.mp.cards.fieldDay")}
              </FieldLabel>
              <input
                id={cardFieldId("dayIndex")}
                type="number"
                min={1}
                className={`${fieldClass} ${fieldErrors.dayIndex ? fieldErrorClass : ""}`}
                value={values.dayIndex}
                onChange={(event) =>
                  updateField("dayIndex", Number(event.target.value))
                }
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.dayIndex)}
                aria-describedby={
                  fieldErrors.dayIndex ? cardFieldErrorId("dayIndex") : undefined
                }
              />
            </label>
            <label className="block">
              <FieldLabel>{t("auth.admin.mp.cards.fieldStatus")}</FieldLabel>
              <select
                className={fieldClass}
                value={values.status}
                onChange={(event) =>
                  updateField("status", event.target.value as MarketPulseCardStatus)
                }
                disabled={busy}
              >
                {MARKET_PULSE_CARD_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.publishedAt}>
                {t("auth.admin.mp.cards.fieldPublishedAt")}
              </FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.publishedAt ? fieldErrorClass : ""}`}
                value={values.publishedAt}
                onChange={(event) => updateField("publishedAt", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.revealAt}>
                {t("auth.admin.mp.cards.fieldRevealAt")}
              </FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.revealAt ? fieldErrorClass : ""}`}
                value={values.revealAt}
                onChange={(event) => updateField("revealAt", event.target.value)}
                disabled={busy}
              />
            </label>
            <div className="sm:col-span-2 rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-400">
              <p className="font-medium text-zinc-300">
                {t("auth.admin.mp.cards.publishNotesTitle")}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
                <li>{t("auth.admin.mp.cards.publishNoteRequired")}</li>
                <li>{t("auth.admin.mp.cards.publishNoteImage")}</li>
                <li>{t("auth.admin.mp.cards.publishNotePpa")}</li>
              </ul>
              {publishBlocker ? (
                <p className="mt-2 text-xs font-medium text-amber-200">{publishBlocker}</p>
              ) : (
                <p className="mt-2 text-xs text-emerald-300">
                  {t("auth.admin.mp.cards.publishReady")}
                </p>
              )}
            </div>
          </section>
        </div>

        {!isBuilder ? (
          <div className="xl:sticky xl:top-36 xl:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              {t("auth.admin.mp.cards.livePreview")}
            </p>
            <div className="rounded-2xl bg-zinc-950 p-3 sm:p-4">
              <MarketPulseAdminCardPreview card={preview} />
            </div>
          </div>
        ) : null}
      </div>

      {!hideFooter ? (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
        <button
          type="submit"
          disabled={busy}
          className={`inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isSubmitting
            ? t("auth.admin.mp.cards.saving")
            : mode === "create"
              ? t("auth.admin.mp.cards.createButton")
              : t("auth.admin.mp.cards.saveButton")}
        </button>
        {mode === "create" ? (
          <button
            type="submit"
            name="saveIntent"
            value="create_another"
            disabled={busy}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {t("auth.admin.mp.builder.fastEntry.createAndAddAnother")}
          </button>
        ) : null}
        {onCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-60 ${focusRing}`}
          >
            {t("auth.admin.users.cancel")}
          </button>
        ) : null}
      </div>
      ) : null}

      {statusMessage ? (
        <p
          className={`text-sm font-medium ${
            statusIsError ? "text-red-400" : "text-emerald-400"
          }`}
          role={statusIsError ? "alert" : "status"}
          aria-live={statusIsError ? "assertive" : "polite"}
        >
          {translateAuthMessage(locale, statusMessage)}
        </p>
      ) : null}
      {statusWarning ? (
        <p className="text-sm font-medium text-amber-200" role="status">
          {statusWarning}
        </p>
      ) : null}
    </form>
  );
}
