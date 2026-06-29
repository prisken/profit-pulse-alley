"use client";

import { useMemo, useState } from "react";
import type { MarketPulseCardStatus, MarketPulseSignal } from "@prisma/client";

import MarketPulseAdminCardPreview from "@/components/admin/MarketPulseAdminCardPreview";
import type { AdminActionResult } from "@/lib/market-pulse/admin-actions";
import {
  cardFormValuesToPreview,
  DEFAULT_CARD_FORM_VALUES,
  MARKET_PULSE_CARD_IMAGE_GUIDANCE,
  MARKET_PULSE_CARD_STATUS_OPTIONS,
  MARKET_PULSE_DEFAULT_USER_PROMPT,
  MARKET_PULSE_SIGNAL_OPTIONS,
  type CardFormFieldErrors,
  type MarketPulseCardFormValues,
  validateMarketPulseCardForm,
} from "@/lib/market-pulse/card-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-base text-foreground outline-none disabled:opacity-60 sm:text-sm ${focusRing}`;

const fieldErrorClass = "border-red-500/50";

type SubmitValues = MarketPulseCardFormValues & { cardId?: string };

type MarketPulseCardFormProps = {
  mode: "create" | "edit";
  cycleId: string;
  cycleName?: string;
  cardId?: string;
  initialValues?: Partial<MarketPulseCardFormValues>;
  existingDayIndexes: number[];
  ppaSignalLockedAt?: string | null;
  disabled?: boolean;
  onSubmit: (values: SubmitValues) => Promise<AdminActionResult>;
  onCancel?: () => void;
  onSuccess?: () => void;
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
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <span className="text-sm font-medium text-foreground/80">
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </span>
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
  onSubmit,
  onCancel,
  onSuccess,
}: MarketPulseCardFormProps) {
  const excludeDayIndex =
    mode === "edit" ? initialValues?.dayIndex : undefined;

  const [values, setValues] = useState<MarketPulseCardFormValues>(() =>
    mergeInitialValues(cycleId, initialValues),
  );
  const [fieldErrors, setFieldErrors] = useState<CardFormFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  const locked = Boolean(ppaSignalLockedAt);

  const preview = useMemo(
    () => cardFormValuesToPreview(values, ppaSignalLockedAt),
    [values, ppaSignalLockedAt],
  );

  function updateField<K extends keyof MarketPulseCardFormValues>(
    key: K,
    value: MarketPulseCardFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatusMessage(null);

    const validation = validateMarketPulseCardForm(values, {
      existingDayIndexes,
      excludeDayIndex,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setStatusIsError(true);
      setStatusMessage("Fix the highlighted fields before saving.");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const result = await onSubmit({
      ...values,
      cycleId,
      cardId,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setStatusIsError(true);
      setStatusMessage(result.error);
      return;
    }

    setStatusIsError(false);
    setStatusMessage(result.message ?? "Card saved.");

    if (mode === "create") {
      setValues(
        mergeInitialValues(cycleId, {
          dayIndex: values.dayIndex + 1,
        }),
      );
    }

    onSuccess?.();
  }

  const busy = disabled || isSubmitting;

  return (
    <form
      className="space-y-6 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          {mode === "create" ? "New card" : "Edit card"}
        </p>
        {cycleName ? (
          <p className="mt-1 text-sm text-foreground/65">Cycle: {cycleName}</p>
        ) : null}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              Schedule
            </h3>
            <label className="block">
              <FieldLabel error={fieldErrors.dayIndex}>
                Day number (1 = first day of cycle)
              </FieldLabel>
              <input
                type="number"
                min={1}
                className={`${fieldClass} ${fieldErrors.dayIndex ? fieldErrorClass : ""}`}
                value={values.dayIndex}
                onChange={(event) =>
                  updateField("dayIndex", Number(event.target.value))
                }
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel>Status</FieldLabel>
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
              <FieldLabel error={fieldErrors.publishedAt}>Published at</FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.publishedAt ? fieldErrorClass : ""}`}
                value={values.publishedAt}
                onChange={(event) => updateField("publishedAt", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.revealAt}>Reveal at</FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.revealAt ? fieldErrorClass : ""}`}
                value={values.revealAt}
                onChange={(event) => updateField("revealAt", event.target.value)}
                disabled={busy}
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              A · News
            </h3>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.headline}>News headline</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.headline ? fieldErrorClass : ""}`}
                value={values.headline}
                onChange={(event) => updateField("headline", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>News body / content</FieldLabel>
              <textarea
                className={`${fieldClass} min-h-[5rem]`}
                value={values.newsBody}
                onChange={(event) => updateField("newsBody", event.target.value)}
                disabled={busy}
                placeholder="Longer news text shown under the headline."
              />
            </label>
            <label className="block">
              <FieldLabel>News source name</FieldLabel>
              <input
                className={fieldClass}
                value={values.sourceName}
                onChange={(event) => updateField("sourceName", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.sourceDate}>News published date</FieldLabel>
              <input
                type="datetime-local"
                className={`${fieldClass} ${fieldErrors.sourceDate ? fieldErrorClass : ""}`}
                value={values.sourceDate}
                onChange={(event) => updateField("sourceDate", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.sourceUrl}>News source URL (optional)</FieldLabel>
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
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              B · Company / security
            </h3>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.companyName}>Company name</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.companyName ? fieldErrorClass : ""}`}
                value={values.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>Company name (ZH)</FieldLabel>
              <input
                className={fieldClass}
                value={values.companyNameZh}
                onChange={(event) => updateField("companyNameZh", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.ticker}>Ticker</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.ticker ? fieldErrorClass : ""}`}
                value={values.ticker}
                onChange={(event) => updateField("ticker", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel>Exchange</FieldLabel>
              <input
                className={fieldClass}
                value={values.exchange}
                onChange={(event) => updateField("exchange", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <FieldLabel>Logo initials</FieldLabel>
              <input
                className={fieldClass}
                value={values.logoInitials}
                onChange={(event) => updateField("logoInitials", event.target.value)}
                disabled={busy}
                placeholder="e.g. TS"
                maxLength={4}
              />
            </label>
            <label className="block">
              <FieldLabel error={fieldErrors.logoUrl}>Company logo URL (optional)</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.logoUrl ? fieldErrorClass : ""}`}
                value={values.logoUrl}
                onChange={(event) => updateField("logoUrl", event.target.value)}
                disabled={busy}
                placeholder="https://"
              />
            </label>
            <label className="block">
              <FieldLabel>Current price text</FieldLabel>
              <input
                className={fieldClass}
                value={values.priceLabel}
                onChange={(event) => updateField("priceLabel", event.target.value)}
                disabled={busy}
                placeholder="$248.30"
              />
            </label>
            <label className="block">
              <FieldLabel>Price change text</FieldLabel>
              <input
                className={fieldClass}
                value={values.priceDirection}
                onChange={(event) => updateField("priceDirection", event.target.value)}
                disabled={busy}
                placeholder="↘ -1.2%"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              C · Card image
            </h3>
            <p className="sm:col-span-2 text-sm leading-relaxed text-foreground/60">
              {MARKET_PULSE_CARD_IMAGE_GUIDANCE}
            </p>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.cardImageUrl}>Card image URL</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.cardImageUrl ? fieldErrorClass : ""}`}
                value={values.cardImageUrl}
                onChange={(event) => updateField("cardImageUrl", event.target.value)}
                disabled={busy}
                placeholder="https://"
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.cardImageAlt}>Card image alt text</FieldLabel>
              <input
                className={`${fieldClass} ${fieldErrors.cardImageAlt ? fieldErrorClass : ""}`}
                value={values.cardImageAlt}
                onChange={(event) => updateField("cardImageAlt", event.target.value)}
                disabled={busy}
                placeholder="Describe the image for screen readers"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              D · Summary / prompt
            </h3>
            <label className="block sm:col-span-2">
              <FieldLabel error={fieldErrors.summary}>Summary</FieldLabel>
              <textarea
                className={`${fieldClass} min-h-[5rem] ${fieldErrors.summary ? fieldErrorClass : ""}`}
                value={values.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>User prompt / question</FieldLabel>
              <input
                className={fieldClass}
                value={values.userPrompt}
                onChange={(event) => updateField("userPrompt", event.target.value)}
                disabled={busy}
                placeholder={MARKET_PULSE_DEFAULT_USER_PROMPT}
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
              E · PPA signal (hidden until reveal)
            </h3>
            <label className="block">
              <FieldLabel error={fieldErrors.ppaSignal}>PPA signal</FieldLabel>
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
              <FieldLabel error={fieldErrors.ppaInsight}>PPA insight</FieldLabel>
              <textarea
                className={`${fieldClass} min-h-[5rem] ${fieldErrors.ppaInsight ? fieldErrorClass : ""}`}
                value={values.ppaInsight}
                onChange={(event) => updateField("ppaInsight", event.target.value)}
                disabled={busy}
              />
            </label>
            {locked ? (
              <label className="block sm:col-span-2">
                <FieldLabel>
                  Reason for PPA change (required if signal or insight changes)
                </FieldLabel>
                <input
                  className={fieldClass}
                  value={values.changeReason}
                  onChange={(event) => updateField("changeReason", event.target.value)}
                  disabled={busy}
                />
              </label>
            ) : null}
          </section>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/45">
            Preview
          </p>
          <div className="rounded-2xl bg-zinc-950 p-3 sm:p-4">
            <MarketPulseAdminCardPreview card={preview} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
        <button
          type="submit"
          disabled={busy}
          className={`inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isSubmitting ? "Saving…" : mode === "create" ? "Create card" : "Save card"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={`inline-flex min-h-10 items-center justify-center rounded-full border border-foreground/15 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60 ${focusRing}`}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {statusMessage ? (
        <p
          className={`text-sm font-medium ${
            statusIsError
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
