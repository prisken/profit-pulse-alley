"use client";

import { useTransition } from "react";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  LOCALE_LABELS,
  SITE_LOCALES,
  type SiteLocale,
} from "@/lib/i18n/locales";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type LanguageSwitcherProps = {
  variant?: "default" | "dark" | "compact";
  className?: string;
  /** Enlarge locale chips to ≥44px hit targets (workshop / touch UIs). */
  touchFriendly?: boolean;
};

export default function LanguageSwitcher({
  variant = "default",
  className = "",
  touchFriendly = false,
}: Readonly<LanguageSwitcherProps>) {
  const { locale, setLocale, t } = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleSelect(nextLocale: SiteLocale) {
    if (nextLocale === locale || isPending) {
      return;
    }
    startTransition(async () => {
      await setLocale(nextLocale);
    });
  }

  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 ${
        isDark
          ? "border-zinc-700 bg-zinc-900"
          : "border-foreground/15 bg-foreground/5"
      } ${className}`}
      role="group"
      aria-label={t("lang.switcherLabel")}
    >
      {SITE_LOCALES.map((code) => {
        const active = code === locale;
        const label = LOCALE_LABELS[code];
        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            aria-pressed={active}
            aria-label={label.aria}
            title={label.aria}
            onClick={() => handleSelect(code)}
            className={`touch-manipulation rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${focusRing} ${
              touchFriendly
                ? "min-h-11 min-w-11 px-3"
                : isCompact
                  ? "min-h-8 min-w-[2rem] px-2.5"
                  : "min-h-8 min-w-[2.25rem] px-2.5"
            } ${
              active
                ? isDark
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-foreground text-background"
                : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-foreground/65 hover:text-foreground"
            }`}
          >
            {label.short}
          </button>
        );
      })}
    </div>
  );
}
