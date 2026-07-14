"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing } from "lucide-react";

import {
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { enableMarketPulseRemindersAction } from "@/lib/notifications/actions";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

export type MarketPulseRemindersOptInCtaProps = Readonly<{
  isAuthenticated: boolean;
  /** Pref from server; `null` means guest. */
  remindersEnabled: boolean | null;
  loginHref: string;
  /** When false (profile page), hide the manage-preferences link. */
  showManageLink?: boolean;
  /** Visual tone — play uses dark Market Pulse chrome; profile uses light card surface. */
  tone?: "play" | "profile";
  onEnabled?: () => void;
  className?: string;
}>;

/**
 * Explicit opt-in for Market Pulse game reminders. Does not send email.
 */
export default function MarketPulseRemindersOptInCta({
  isAuthenticated,
  remindersEnabled,
  loginHref,
  showManageLink = true,
  tone = "play",
  onEnabled,
  className = "",
}: MarketPulseRemindersOptInCtaProps) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [enabled, setEnabled] = useState(remindersEnabled === true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEnabled(remindersEnabled === true);
  }, [remindersEnabled]);

  const shellClass =
    tone === "profile"
      ? "rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 text-left"
      : "rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-left";
  const enabledShellClass =
    tone === "profile"
      ? "rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-left"
      : "rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-left";
  const promptClass =
    tone === "profile" ? "text-sm font-medium text-foreground" : "text-sm font-medium text-white";
  const subtextClass =
    tone === "profile"
      ? "mt-2 text-xs leading-relaxed text-foreground/55"
      : "mt-2 text-xs leading-relaxed text-zinc-500";
  const enableButtonClass =
    tone === "profile"
      ? "mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      : "mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-400 bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60";

  function handleEnable() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await enableMarketPulseRemindersAction();
        if (!result.success) {
          setError(translateAuthMessage(locale, result.error));
          return;
        }
        setEnabled(true);
        onEnabled?.();
        router.refresh();
      } catch {
        setError(t("mp.error.generic"));
      }
    });
  }

  if (!isAuthenticated) {
    return (
      <aside
        className={mergeMpClasses(shellClass, className)}
        aria-label={t("mp.reminders.optIn.prompt")}
      >
        <p className={promptClass}>{t("mp.reminders.optIn.prompt")}</p>
        <Link
          href={loginHref}
          className={mergeMpClasses(
            "mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-400/70 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/15",
            MP_FOCUS_RING,
          )}
        >
          <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("mp.reminders.optIn.signIn")}
        </Link>
        <p className={subtextClass}>{t("mp.reminders.optIn.subtext")}</p>
      </aside>
    );
  }

  if (enabled) {
    return (
      <aside
        className={mergeMpClasses(enabledShellClass, className)}
        aria-label={t("mp.reminders.enabled")}
      >
        <p
          className={
            tone === "profile"
              ? "flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200"
              : "flex items-center gap-2 text-sm font-medium text-emerald-200"
          }
        >
          <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("mp.reminders.enabled")}
        </p>
        {showManageLink ? (
          <Link
            href="/profile"
            className={mergeMpClasses(
              "mt-2 inline-flex text-xs font-medium text-emerald-300/90 underline-offset-2 hover:underline",
              MP_FOCUS_RING,
            )}
          >
            {t("mp.reminders.manage")}
          </Link>
        ) : null}
      </aside>
    );
  }

  return (
    <aside
      className={mergeMpClasses(shellClass, className)}
      aria-label={t("mp.reminders.optIn.prompt")}
    >
      <p className={promptClass}>{t("mp.reminders.optIn.prompt")}</p>
      <button
        type="button"
        disabled={isPending}
        onClick={handleEnable}
        className={mergeMpClasses(enableButtonClass, MP_FOCUS_RING)}
      >
        <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
        {isPending
          ? t("mp.reminders.optIn.enabling")
          : t("mp.reminders.optIn.button")}
      </button>
      <p className={subtextClass}>{t("mp.reminders.optIn.subtext")}</p>
      {error ? (
        <p
          className={
            tone === "profile"
              ? "mt-2 text-xs text-red-600 dark:text-red-400"
              : "mt-2 text-xs text-red-400"
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </aside>
  );
}
