"use client";

import { useState, type FormEvent } from "react";

import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { captureWorkshopLeadAction } from "@/lib/workshop/lead-actions";
import { validateWorkshopPhone } from "@/lib/workshop/phone";
import type { Bilingual } from "@/lib/workshop/types";

/**
 * Always ≥16px on the input itself — `sm:text-sm` would reintroduce iOS
 * Safari focus zoom on larger phones in landscape / narrow desktop widths.
 */
const fieldClass =
  "mt-1.5 w-full min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20";

const fieldErrorClass =
  "mt-1.5 w-full min-h-12 rounded-xl border border-rose-400 bg-rose-50 px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus-visible:border-rose-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-rose-500/20";

const labelClass = "block text-sm font-medium text-slate-700";

type WorkshopCaptureStepProps = Readonly<{
  sessionId: string;
  selectedGoalTitle: string | Bilingual;
  onBack: () => void;
}>;

function pdfUrl(sessionId: string): string {
  return `/api/workshop/pdf/${encodeURIComponent(sessionId)}`;
}

function triggerPdfDownload(sessionId: string) {
  const anchor = document.createElement("a");
  anchor.href = pdfUrl(sessionId);
  anchor.download = "";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function resolveCatalogOrRaw(
  value: string,
  t: (key: MessageKey) => string,
): string {
  if (value.startsWith("workshop.")) {
    return t(value as MessageKey);
  }
  return value;
}

export default function WorkshopCaptureStep({
  sessionId,
  selectedGoalTitle,
  onBack,
}: WorkshopCaptureStepProps) {
  const { t, locale } = useTranslations();
  const goalTitle = pickBilingual(selectedGoalTitle, locale);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  function syncPhoneError(nextPhone: string, force = false) {
    if (!nextPhone.trim()) {
      setPhoneError(null);
      return true;
    }
    const result = validateWorkshopPhone(nextPhone);
    if (!result.ok && (force || phoneTouched || nextPhone.trim().length > 0)) {
      setPhoneError(t(result.errorKey));
      return false;
    }
    setPhoneError(null);
    return result.ok;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPhoneTouched(true);

    if (!syncPhoneError(phone, true)) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await captureWorkshopLeadAction({
        sessionId,
        name,
        email,
        phone,
        selectedGoal: goalTitle,
      });

      if (!result.ok) {
        if (result.field === "phone") {
          setPhoneError(resolveCatalogOrRaw(result.error, t));
        } else {
          setError(resolveCatalogOrRaw(result.error, t));
        }
        return;
      }

      setCompleted(true);
      // Allow the lead row to commit before hitting the PDF route.
      window.setTimeout(() => {
        triggerPdfDownload(sessionId);
      }, 150);
    } catch {
      setError(t("workshop.capture.saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  const optionalLabel = t("workshop.capture.optionalLabel");

  if (completed) {
    return (
      <div className="min-w-0 space-y-5 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 shadow-sm sm:px-5 sm:py-8">
          <p className="text-2xl" aria-hidden="true">
            ✅
          </p>
          <h3 className="mt-3 text-balance text-xl font-semibold text-slate-900">
            {t("workshop.capture.thankYouMessage")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-600">
            {t("workshop.capture.thankYouBody")}{" "}
            <span className="font-medium text-emerald-800">{goalTitle}</span>
          </p>
          {phone.trim() ? (
            <p className="mx-auto mt-3 max-w-md rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-pretty text-xs leading-relaxed text-sky-900">
              {t("workshop.capture.whatsappSentNote")}
            </p>
          ) : null}
        </div>

        <WorkshopStickyFooter
          primaryLabel={t("workshop.capture.downloadAgainButton")}
          onPrimaryClick={() => triggerPdfDownload(sessionId)}
          secondaryLabel={t("workshop.capture.backToSummary")}
          onSecondaryClick={onBack}
        />
      </div>
    );
  }

  return (
    <form
      id="workshop-capture-form"
      onSubmit={handleSubmit}
      className="min-w-0 space-y-5"
      noValidate
      // Prevent browsers from auto-focusing the first field on step entry
      // (which would pop the mobile keyboard immediately).
      autoComplete="on"
    >
      <p className="text-sm leading-relaxed text-slate-600">
        {t("workshop.capture.intro")}
      </p>

      <p className="text-xs leading-relaxed text-slate-400">
        {t("workshop.capture.optionalHint")}
      </p>

      <p className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs leading-relaxed text-sky-900">
        {t("workshop.capture.whatsappHint")}
      </p>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-relaxed text-emerald-900">
        {t("workshop.capture.selectedGoal")}{" "}
        <span className="font-semibold break-words">{goalTitle}</span>
      </div>

      <div>
        <label htmlFor="workshop-lead-name" className={labelClass}>
          {t("workshop.capture.nameLabel")}{" "}
          <span className="text-xs font-normal text-slate-400">
            ({optionalLabel})
          </span>
        </label>
        <input
          id="workshop-lead-name"
          type="text"
          name="name"
          autoFocus={false}
          autoComplete="name"
          enterKeyHint="next"
          disabled={submitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder={t("workshop.capture.namePlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="workshop-lead-email" className={labelClass}>
          {t("workshop.capture.emailLabel")}{" "}
          <span className="text-xs font-normal text-slate-400">
            ({optionalLabel})
          </span>
        </label>
        <input
          id="workshop-lead-email"
          type="email"
          name="email"
          autoFocus={false}
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          placeholder={t("workshop.capture.emailPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="workshop-lead-phone" className={labelClass}>
          {t("workshop.capture.phoneLabel")}{" "}
          <span className="text-xs font-normal text-slate-400">
            ({optionalLabel})
          </span>
        </label>
        <input
          id="workshop-lead-phone"
          type="tel"
          name="tel"
          autoFocus={false}
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="done"
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? "workshop-lead-phone-error" : undefined}
          disabled={submitting}
          value={phone}
          onChange={(e) => {
            const next = e.target.value;
            setPhone(next);
            // Inline validation as soon as the user has typed or already blurred.
            if (phoneTouched || next.trim().length > 0) {
              syncPhoneError(next);
            }
          }}
          onBlur={() => {
            setPhoneTouched(true);
            syncPhoneError(phone, true);
          }}
          className={phoneError ? fieldErrorClass : fieldClass}
          placeholder={t("workshop.capture.phonePlaceholder")}
        />
        {phoneError ? (
          <p
            id="workshop-lead-phone-error"
            role="alert"
            className="mt-1.5 text-sm text-rose-700"
          >
            {phoneError}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      <WorkshopStickyFooter
        primaryLabel={
          submitting
            ? t("workshop.capture.submitting")
            : t("workshop.capture.downloadButton")
        }
        primaryType="submit"
        primaryForm="workshop-capture-form"
        primaryDisabled={submitting}
        secondaryLabel={t("workshop.errors.backButton")}
        secondaryDisabled={submitting}
        onSecondaryClick={onBack}
      />
    </form>
  );
}
