"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { updateContactNumber } from "@/lib/auth-actions";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";

export default function ProfileContactNumberCard({
  initialContactNumber,
}: Readonly<{ initialContactNumber: string | null }>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [contactNumber, setContactNumber] = useState(initialContactNumber ?? "");
  const [isEditing, setIsEditing] = useState(!initialContactNumber?.trim());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const hasSavedNumber = Boolean(initialContactNumber?.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    setIsLoading(true);

    try {
      const result = await updateContactNumber(contactNumber);

      if (!result.success) {
        setError(translateAuthMessage(locale, result.error));
        return;
      }

      setSavedMessage(t("auth.profile.contact.saved"));
      setIsEditing(false);
      router.refresh();
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="profile-contact-heading" className={cardClass}>
      <h2
        id="profile-contact-heading"
        className="text-base font-semibold text-foreground sm:text-lg"
      >
        {t("auth.profile.contact.title")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-foreground/65 sm:text-sm">
        {t("auth.profile.contact.body")}
      </p>

      {hasSavedNumber && !isEditing ? (
        <div className="mt-4 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
            {t("auth.login.contactNumber")}
          </p>
          <p className="mt-0.5 text-sm text-foreground sm:text-base">
            {initialContactNumber}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setSavedMessage(null);
              setError(null);
            }}
            className={`mt-3 inline-flex min-h-10 items-center text-sm font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline ${focusRing}`}
          >
            {t("auth.profile.contact.update")}
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground/60">
              {t("auth.login.contactNumber")}
            </span>
            <input
              type="tel"
              name="contactNumber"
              autoComplete="tel"
              inputMode="tel"
              placeholder={t("auth.login.placeholderContact")}
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              disabled={isLoading}
              className={`w-full min-h-11 rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground/40 disabled:opacity-60 sm:text-sm ${focusRing}`}
            />
            <span className="mt-1.5 block text-[11px] text-foreground/50 sm:text-xs">
              {t("auth.onboarding.contactHint")}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading || !contactNumber.trim()}
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {isLoading ? t("auth.onboarding.saving") : t("auth.profile.contact.cta")}
            </button>
            {hasSavedNumber ? (
              <button
                type="button"
                onClick={() => {
                  setContactNumber(initialContactNumber ?? "");
                  setIsEditing(false);
                  setError(null);
                }}
                className={`inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/15 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/25 hover:text-foreground ${focusRing}`}
              >
                {t("auth.profile.contact.cancel")}
              </button>
            ) : null}
          </div>
        </form>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {savedMessage}
        </p>
      ) : null}
    </section>
  );
}
