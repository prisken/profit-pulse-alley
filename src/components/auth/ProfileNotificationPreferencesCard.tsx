"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import MarketPulseRemindersOptInCta from "@/components/market-pulse/MarketPulseRemindersOptInCta";
import { updateNotificationPreferencesAction } from "@/lib/notifications/actions";
import type { ProfileNotificationPreferences } from "@/lib/notifications/profile-notification-preferences";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import type { MessageKey } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";

type PreferenceKey = keyof ProfileNotificationPreferences;

const PREFERENCE_FIELDS: ReadonlyArray<{
  key: PreferenceKey;
  labelKey: MessageKey;
  helpKey: MessageKey;
}> = [
  {
    key: "marketPulseRemindersEnabled",
    labelKey: "auth.profile.emailPrefs.reminders.label",
    helpKey: "auth.profile.emailPrefs.reminders.help",
  },
  {
    key: "revealNotificationsEnabled",
    labelKey: "auth.profile.emailPrefs.reveal.label",
    helpKey: "auth.profile.emailPrefs.reveal.help",
  },
  {
    key: "eventUpdatesEnabled",
    labelKey: "auth.profile.emailPrefs.events.label",
    helpKey: "auth.profile.emailPrefs.events.help",
  },
  {
    key: "learningDigestEnabled",
    labelKey: "auth.profile.emailPrefs.digest.label",
    helpKey: "auth.profile.emailPrefs.digest.help",
  },
];

export default function ProfileNotificationPreferencesCard({
  initialPreferences,
}: Readonly<{ initialPreferences: ProfileNotificationPreferences }>) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [preferences, setPreferences] =
    useState<ProfileNotificationPreferences>(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function toggle(key: PreferenceKey) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setSavedMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    setIsLoading(true);

    try {
      const result = await updateNotificationPreferencesAction(preferences);

      if (!result.success) {
        setError(translateAuthMessage(locale, result.error));
        return;
      }

      setPreferences(result.preferences);
      setSavedMessage(t("auth.profile.emailPrefs.saved"));
      router.refresh();
    } catch {
      setError(t("auth.error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="profile-email-prefs-heading" className={cardClass}>
      <h2
        id="profile-email-prefs-heading"
        className="text-base font-semibold text-foreground sm:text-lg"
      >
        {t("auth.profile.emailPrefs.title")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-foreground/65 sm:text-sm">
        {t("auth.profile.emailPrefs.description")}
      </p>

      <div className="mt-4">
        <MarketPulseRemindersOptInCta
          isAuthenticated
          remindersEnabled={preferences.marketPulseRemindersEnabled}
          loginHref="/login?callbackUrl=%2Fprofile"
          showManageLink={false}
          tone="profile"
          onEnabled={() => {
            setPreferences((current) => ({
              ...current,
              marketPulseRemindersEnabled: true,
            }));
            setSavedMessage(null);
            setError(null);
          }}
        />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
        <fieldset className="space-y-3" disabled={isLoading}>
          <legend className="sr-only">
            {t("auth.profile.emailPrefs.title")}
          </legend>

          {PREFERENCE_FIELDS.map((field) => {
            const helpId = `email-pref-help-${field.key}`;
            return (
              <label
                key={field.key}
                className="flex cursor-pointer gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-3 sm:px-4"
              >
                <input
                  type="checkbox"
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border-foreground/30 text-amber-500 ${focusRing}`}
                  checked={preferences[field.key]}
                  onChange={() => toggle(field.key)}
                  aria-describedby={helpId}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {t(field.labelKey)}
                  </span>
                  <span
                    id={helpId}
                    className="mt-0.5 block text-xs leading-relaxed text-foreground/55"
                  >
                    {t(field.helpKey)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <p className="text-xs leading-relaxed text-foreground/55 sm:text-sm">
          {t("auth.profile.emailPrefs.transactionalNote")}
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex min-h-11 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isLoading
            ? t("auth.profile.emailPrefs.saving")
            : t("auth.profile.emailPrefs.save")}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p
          className="mt-3 text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
        >
          {savedMessage}
        </p>
      ) : null}
    </section>
  );
}
