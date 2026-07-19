"use client";

import { useActionState } from "react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MATCHING_PULSE_CATEGORY_MESSAGE_KEYS,
  MATCHING_PULSE_REQUEST_TYPE_MESSAGE_KEYS,
  MATCHING_PULSE_URGENCY_MESSAGE_KEYS,
  translateMatchingPulseError,
} from "@/lib/i18n/matching-pulse-ui";
import { createMatchingPulseRequestAction } from "@/lib/matching-pulse/actions";
import {
  MATCHING_PULSE_CATEGORIES,
  MATCHING_PULSE_FIELD_MAX,
  MATCHING_PULSE_REQUEST_TYPES,
  MATCHING_PULSE_URGENCIES,
} from "@/lib/matching-pulse/constants";
import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_PRIMARY_BTN,
  MP_TERMINAL_PANEL,
} from "@/lib/market-pulse/visual-primitives";

const fieldClass = mergeMpClasses(
  "mt-1.5 w-full min-h-11 rounded-xl border border-white/10 bg-mp-obsidian-elevated px-3 py-2.5 text-base text-white outline-none placeholder:text-zinc-500 disabled:opacity-60 sm:text-sm",
  "focus-visible:border-mp-pulse/40 focus-visible:ring-2 focus-visible:ring-mp-pulse/50",
);

const labelClass = "block text-sm font-medium text-zinc-200";
const hintClass = "mt-1 text-xs text-zinc-500";
const errorClass = "mt-1.5 text-sm text-red-400";

function RequiredMark() {
  return (
    <span className="text-mp-pulse" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

type MatchingPulseRequestFormProps = Readonly<{
  source: string;
  posterLabel: string | null;
}>;

export default function MatchingPulseRequestForm({
  source,
  posterLabel,
}: MatchingPulseRequestFormProps) {
  const { t, locale } = useTranslations();
  const [state, formAction, isPending] = useActionState(
    createMatchingPulseRequestAction,
    null,
  );

  const fieldErrors = state?.fieldErrors ?? {};
  const formError = state?.formError
    ? translateMatchingPulseError(locale, state.formError)
    : undefined;
  const values = state?.values;
  // Remount uncontrolled inputs with preserved defaults after a failed submit.
  const formKey = `mp-request-${state?.revision ?? 0}`;

  function fieldError(message: string | undefined): string | undefined {
    return message ? translateMatchingPulseError(locale, message) : undefined;
  }

  return (
    <form
      key={formKey}
      action={formAction}
      noValidate
      className="space-y-5 sm:space-y-6"
    >
      <input type="hidden" name="source" value={values?.source || source} />

      {posterLabel ? (
        <p
          className={mergeMpClasses(
            MP_TERMINAL_PANEL,
            "px-3.5 py-3 text-sm text-zinc-300 sm:px-4",
          )}
        >
          {t("matchingPulse.form.postingAs")}{" "}
          <span className="font-medium text-white">{posterLabel}</span>
        </p>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200 sm:px-4"
        >
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="mp-title" className={labelClass}>
          {t("matchingPulse.form.title")}
          <RequiredMark />
        </label>
        <input
          id="mp-title"
          name="title"
          type="text"
          required
          maxLength={MATCHING_PULSE_FIELD_MAX.title}
          disabled={isPending}
          defaultValue={values?.title ?? ""}
          className={fieldClass}
          aria-required="true"
          aria-invalid={fieldErrors.title ? true : undefined}
          aria-describedby={fieldErrors.title ? "mp-title-error" : undefined}
          placeholder={t("matchingPulse.form.titlePlaceholder")}
        />
        {fieldErrors.title ? (
          <p id="mp-title-error" className={errorClass} role="alert">
            {fieldError(fieldErrors.title)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor="mp-requestType" className={labelClass}>
            {t("matchingPulse.form.requestType")}
            <RequiredMark />
          </label>
          <select
            id="mp-requestType"
            name="requestType"
            required
            disabled={isPending}
            defaultValue={values?.requestType ?? ""}
            className={fieldClass}
            aria-required="true"
            aria-invalid={fieldErrors.requestType ? true : undefined}
            aria-describedby={
              fieldErrors.requestType ? "mp-requestType-error" : undefined
            }
          >
            <option value="" disabled>
              {t("matchingPulse.form.selectType")}
            </option>
            {MATCHING_PULSE_REQUEST_TYPES.map((value) => (
              <option key={value} value={value}>
                {t(MATCHING_PULSE_REQUEST_TYPE_MESSAGE_KEYS[value])}
              </option>
            ))}
          </select>
          {fieldErrors.requestType ? (
            <p id="mp-requestType-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.requestType)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mp-category" className={labelClass}>
            {t("matchingPulse.form.category")}
            <RequiredMark />
          </label>
          <select
            id="mp-category"
            name="category"
            required
            disabled={isPending}
            defaultValue={values?.category ?? ""}
            className={fieldClass}
            aria-required="true"
            aria-invalid={fieldErrors.category ? true : undefined}
            aria-describedby={
              fieldErrors.category ? "mp-category-error" : undefined
            }
          >
            <option value="" disabled>
              {t("matchingPulse.form.selectCategory")}
            </option>
            {MATCHING_PULSE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(MATCHING_PULSE_CATEGORY_MESSAGE_KEYS[value])}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p id="mp-category-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.category)}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="mp-description" className={labelClass}>
          {t("matchingPulse.form.description")}
          <RequiredMark />
        </label>
        <textarea
          id="mp-description"
          name="description"
          required
          rows={5}
          maxLength={MATCHING_PULSE_FIELD_MAX.description}
          disabled={isPending}
          defaultValue={values?.description ?? ""}
          className={mergeMpClasses(fieldClass, "min-h-28 resize-y")}
          aria-required="true"
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={
            fieldErrors.description
              ? "mp-description-error"
              : "mp-description-hint"
          }
          placeholder={t("matchingPulse.form.descriptionPlaceholder")}
        />
        <p id="mp-description-hint" className={hintClass}>
          {t("matchingPulse.form.descriptionMaxHint").replace(
            "{max}",
            String(MATCHING_PULSE_FIELD_MAX.description),
          )}
        </p>
        {fieldErrors.description ? (
          <p id="mp-description-error" className={errorClass} role="alert">
            {fieldError(fieldErrors.description)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor="mp-company" className={labelClass}>
            {t("matchingPulse.form.company")}{" "}
            <span className="font-normal text-zinc-500">
              {t("matchingPulse.form.optional")}
            </span>
          </label>
          <input
            id="mp-company"
            name="company"
            type="text"
            maxLength={MATCHING_PULSE_FIELD_MAX.company}
            disabled={isPending}
            defaultValue={values?.company ?? ""}
            className={fieldClass}
            aria-invalid={fieldErrors.company ? true : undefined}
            aria-describedby={
              fieldErrors.company ? "mp-company-error" : undefined
            }
          />
          {fieldErrors.company ? (
            <p id="mp-company-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.company)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mp-roleTitle" className={labelClass}>
            {t("matchingPulse.form.role")}{" "}
            <span className="font-normal text-zinc-500">
              {t("matchingPulse.form.optional")}
            </span>
          </label>
          <input
            id="mp-roleTitle"
            name="roleTitle"
            type="text"
            maxLength={MATCHING_PULSE_FIELD_MAX.roleTitle}
            disabled={isPending}
            defaultValue={values?.roleTitle ?? ""}
            className={fieldClass}
            aria-invalid={fieldErrors.roleTitle ? true : undefined}
            aria-describedby={
              fieldErrors.roleTitle ? "mp-roleTitle-error" : undefined
            }
          />
          {fieldErrors.roleTitle ? (
            <p id="mp-roleTitle-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.roleTitle)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor="mp-contactPhone" className={labelClass}>
            {t("matchingPulse.form.contactPhone")}{" "}
            <span className="font-normal text-zinc-500">
              {t("matchingPulse.form.optional")}
            </span>
          </label>
          <input
            id="mp-contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={MATCHING_PULSE_FIELD_MAX.contactPhone}
            disabled={isPending}
            defaultValue={values?.contactPhone ?? ""}
            className={fieldClass}
            autoComplete="tel"
            aria-invalid={fieldErrors.contactPhone ? true : undefined}
            aria-describedby={
              fieldErrors.contactPhone ? "mp-contactPhone-error" : undefined
            }
          />
          {fieldErrors.contactPhone ? (
            <p id="mp-contactPhone-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.contactPhone)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mp-contactMethod" className={labelClass}>
            {t("matchingPulse.form.contactMethod")}{" "}
            <span className="font-normal text-zinc-500">
              {t("matchingPulse.form.optional")}
            </span>
          </label>
          <input
            id="mp-contactMethod"
            name="contactMethod"
            type="text"
            maxLength={MATCHING_PULSE_FIELD_MAX.contactMethod}
            disabled={isPending}
            defaultValue={values?.contactMethod ?? ""}
            className={fieldClass}
            placeholder={t("matchingPulse.form.contactMethodPlaceholder")}
            aria-invalid={fieldErrors.contactMethod ? true : undefined}
            aria-describedby={
              fieldErrors.contactMethod ? "mp-contactMethod-error" : undefined
            }
          />
          {fieldErrors.contactMethod ? (
            <p id="mp-contactMethod-error" className={errorClass} role="alert">
              {fieldError(fieldErrors.contactMethod)}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="mp-urgency" className={labelClass}>
          {t("matchingPulse.form.urgency")}{" "}
          <span className="font-normal text-zinc-500">
            {t("matchingPulse.form.optional")}
          </span>
        </label>
        <select
          id="mp-urgency"
          name="urgency"
          disabled={isPending}
          defaultValue={values?.urgency ?? ""}
          className={fieldClass}
          aria-invalid={fieldErrors.urgency ? true : undefined}
          aria-describedby={
            fieldErrors.urgency ? "mp-urgency-error" : undefined
          }
        >
          <option value="">{t("matchingPulse.form.noPreference")}</option>
          {MATCHING_PULSE_URGENCIES.map((value) => (
            <option key={value} value={value}>
              {t(MATCHING_PULSE_URGENCY_MESSAGE_KEYS[value])}
            </option>
          ))}
        </select>
        {fieldErrors.urgency ? (
          <p id="mp-urgency-error" className={errorClass} role="alert">
            {fieldError(fieldErrors.urgency)}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="mp-idealMatch" className={labelClass}>
          {t("matchingPulse.form.idealMatch")}{" "}
          <span className="font-normal text-zinc-500">
            {t("matchingPulse.form.optional")}
          </span>
        </label>
        <textarea
          id="mp-idealMatch"
          name="idealMatch"
          rows={3}
          maxLength={MATCHING_PULSE_FIELD_MAX.idealMatch}
          disabled={isPending}
          defaultValue={values?.idealMatch ?? ""}
          className={mergeMpClasses(fieldClass, "min-h-20 resize-y")}
          placeholder={t("matchingPulse.form.idealMatchPlaceholder")}
          aria-invalid={fieldErrors.idealMatch ? true : undefined}
          aria-describedby={
            fieldErrors.idealMatch ? "mp-idealMatch-error" : undefined
          }
        />
        {fieldErrors.idealMatch ? (
          <p id="mp-idealMatch-error" className={errorClass} role="alert">
            {fieldError(fieldErrors.idealMatch)}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-4 sm:px-4">
        <legend className="px-1 text-sm font-medium text-zinc-200">
          {t("matchingPulse.form.consents")}
        </legend>

        <label className="flex items-start gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="consentToContact"
            value="on"
            required
            disabled={isPending}
            defaultChecked={values?.consentToContact ?? false}
            className={mergeMpClasses(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-mp-obsidian-elevated text-mp-pulse",
              MP_FOCUS_RING,
            )}
            aria-required="true"
            aria-invalid={fieldErrors.consentToContact ? true : undefined}
            aria-describedby={
              fieldErrors.consentToContact
                ? "mp-consentToContact-error"
                : undefined
            }
          />
          <span>
            {t("matchingPulse.form.consentContact")}
            <RequiredMark />
          </span>
        </label>
        {fieldErrors.consentToContact ? (
          <p id="mp-consentToContact-error" className={errorClass} role="alert">
            {fieldError(fieldErrors.consentToContact)}
          </p>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="consentToShare"
            value="on"
            disabled={isPending}
            defaultChecked={values?.consentToShare ?? false}
            className={mergeMpClasses(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-mp-obsidian-elevated text-mp-pulse",
              MP_FOCUS_RING,
            )}
          />
          <span>
            {t("matchingPulse.form.consentShare")}{" "}
            <span className="text-zinc-500">
              {t("matchingPulse.form.optional")}
            </span>
          </span>
        </label>
      </fieldset>

      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending}
          className={mergeMpClasses(
            MP_PRIMARY_BTN,
            "min-h-11 w-full px-5 py-2.5 text-sm sm:min-h-12 sm:w-auto sm:min-w-[12rem]",
            MP_FOCUS_RING,
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isPending
            ? t("matchingPulse.form.submitting")
            : t("matchingPulse.form.submit")}
        </button>
        <p className="mt-3 text-xs text-zinc-500">
          <span className="text-mp-pulse" aria-hidden="true">
            *
          </span>{" "}
          {t("matchingPulse.form.requiredFields")}
        </p>
      </div>
    </form>
  );
}
