"use client";

import { useEffect, useState } from "react";
import type { MarketPulseCycleStatus } from "@prisma/client";

import type { AdminActionResult } from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import {
  DEFAULT_CYCLE_FORM_VALUES,
  MARKET_PULSE_CYCLE_STATUS_OPTIONS,
  type MarketPulseCycleFormValues,
  validateMarketPulseCycleForm,
} from "@/lib/market-pulse/cycle-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-base text-foreground outline-none disabled:opacity-60 sm:text-sm ${focusRing}`;

const fieldErrorClass = "border-red-500/50";

type SubmitValues = MarketPulseCycleFormValues & { cycleId?: string };

type MarketPulseCycleFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<MarketPulseCycleFormValues>;
  cycleId?: string;
  isActive?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit: (values: SubmitValues) => Promise<AdminActionResult>;
  onCancel?: () => void;
  onSuccess?: () => void | Promise<void>;
};

function mergeInitialValues(
  initialValues?: Partial<MarketPulseCycleFormValues>,
): MarketPulseCycleFormValues {
  return {
    ...DEFAULT_CYCLE_FORM_VALUES,
    ...initialValues,
    setActive: initialValues?.setActive ?? false,
  };
}

export default function MarketPulseCycleForm({
  mode,
  initialValues,
  cycleId,
  isActive = false,
  disabled = false,
  submitLabel,
  onSubmit,
  onCancel,
  onSuccess,
}: MarketPulseCycleFormProps) {
  const [values, setValues] = useState<MarketPulseCycleFormValues>(() =>
    mergeInitialValues(initialValues),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof MarketPulseCycleFormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !initialValues) {
      return;
    }
    setValues(mergeInitialValues(initialValues));
    setFieldErrors({});
  }, [
    mode,
    initialValues?.name,
    initialValues?.startsAt,
    initialValues?.endsAt,
    initialValues?.revealAt,
    initialValues?.status,
    initialValues?.prizeLabel,
    initialValues?.setActive,
  ]);

  function updateField<K extends keyof MarketPulseCycleFormValues>(
    key: K,
    value: MarketPulseCycleFormValues[K],
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

    const validation = validateMarketPulseCycleForm(values);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setStatusIsError(true);
      setStatusMessage("Fix the highlighted fields before saving.");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const succeeded = await invokeAdminAction(
        () => onSubmit({ ...values, cycleId }),
        {
          onSuccess: async (successMessage, warning) => {
            setStatusIsError(false);
            setStatusMessage(successMessage ?? "Cycle saved.");
            setStatusWarning(warning ?? null);

            if (mode === "create") {
              setValues(mergeInitialValues());
            }

            await onSuccess?.();
          },
          onError: (error, serverFieldErrors) => {
            setStatusIsError(true);
            setStatusWarning(null);
            setStatusMessage(error);
            if (serverFieldErrors) {
              const nextErrors: Partial<Record<keyof MarketPulseCycleFormValues, string>> =
                {};
              for (const [key, messages] of Object.entries(serverFieldErrors)) {
                if (messages[0]) {
                  nextErrors[key as keyof MarketPulseCycleFormValues] = messages[0];
                }
              }
              setFieldErrors(nextErrors);
            }
          },
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
  const label = submitLabel ?? (mode === "create" ? "Create cycle" : "Save cycle");

  return (
    <form
      className="space-y-5 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          {mode === "create" ? "New cycle" : "Edit cycle"}
        </p>
        <p className="mt-1 text-sm text-foreground/65">
          Start must be before end. Reveal must be on or after end. All times are
          Hong Kong (HKT, UTC+8).
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-foreground/80">Name</span>
          <input
            className={`${fieldClass} ${fieldErrors.name ? fieldErrorClass : ""}`}
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "cycle-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="cycle-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.name}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Status</span>
          <select
            className={fieldClass}
            value={values.status}
            onChange={(event) =>
              updateField("status", event.target.value as MarketPulseCycleStatus)
            }
            disabled={busy}
          >
            {MARKET_PULSE_CYCLE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Prize label</span>
          <input
            className={fieldClass}
            value={values.prizeLabel}
            onChange={(event) => updateField("prizeLabel", event.target.value)}
            disabled={busy}
            placeholder="Optional"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Starts</span>
          <input
            type="datetime-local"
            className={`${fieldClass} ${fieldErrors.startsAt ? fieldErrorClass : ""}`}
            value={values.startsAt}
            onChange={(event) => updateField("startsAt", event.target.value)}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.startsAt)}
          />
          {fieldErrors.startsAt ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.startsAt}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Ends</span>
          <input
            type="datetime-local"
            className={`${fieldClass} ${fieldErrors.endsAt ? fieldErrorClass : ""}`}
            value={values.endsAt}
            onChange={(event) => updateField("endsAt", event.target.value)}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.endsAt)}
          />
          {fieldErrors.endsAt ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.endsAt}
            </p>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-foreground/80">Reveal</span>
          <input
            type="datetime-local"
            className={`${fieldClass} ${fieldErrors.revealAt ? fieldErrorClass : ""}`}
            value={values.revealAt}
            onChange={(event) => updateField("revealAt", event.target.value)}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.revealAt)}
          />
          {fieldErrors.revealAt ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.revealAt}
            </p>
          ) : null}
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={values.setActive}
          onChange={(event) => updateField("setActive", event.target.checked)}
          disabled={busy || (mode === "edit" && isActive)}
        />
        Set as active cycle
        {mode === "edit" && isActive ? (
          <span className="text-xs text-foreground/50">(already active)</span>
        ) : null}
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className={`inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isSubmitting ? "Saving…" : label}
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
      {statusWarning ? (
        <p
          className="text-sm font-medium text-amber-700 dark:text-amber-300"
          role="status"
        >
          {statusWarning}
        </p>
      ) : null}
    </form>
  );
}
